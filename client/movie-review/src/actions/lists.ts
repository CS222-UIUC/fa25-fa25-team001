"use server";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Get all lists for the current user
export async function getMyLists() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { lists: [] } as const;

  const lists = await prisma.list.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      items: {
        orderBy: { position: 'asc' },
        take: 1, // Just get count
      },
      _count: {
        select: { items: true },
      },
    },
  });

  return {
    lists: lists.map(list => ({
      id: list.id,
      title: list.title,
      description: list.description,
      mediaType: list.mediaType,
      isPublic: list.isPublic,
      itemCount: list._count.items,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    })),
  } as const;
}

// Get a single list with all items
export async function getList(listId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const list = await prisma.list.findUnique({
    where: { id: listId },
    include: {
      items: {
        orderBy: { position: 'asc' },
      },
      user: {
        select: { id: true, username: true },
      },
    },
  });

  if (!list) return { error: 'List not found' } as const;
  if (list.userId !== session.user.id && !list.isPublic) {
    return { error: 'Forbidden' } as const;
  }

  return {
    list: {
      id: list.id,
      title: list.title,
      description: list.description,
      mediaType: list.mediaType,
      isPublic: list.isPublic,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      user: list.user,
      items: list.items.map(item => ({
        id: item.id,
        position: item.position,
        notes: item.notes,
        itemName: item.itemName,
        itemCover: item.itemCover,
        itemYear: item.itemYear,
        itemType: item.itemType,
        externalGameId: item.externalGameId,
        externalMovieId: item.externalMovieId,
        externalTvShowId: item.externalTvShowId,
      })),
    },
  } as const;
}

// Create a new list
export async function createList(input: { title: string; description?: string; mediaType?: string; isPublic?: boolean }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const { title, description, mediaType, isPublic = true } = input;
  if (!title.trim()) return { error: 'Title is required' } as const;

  // Validate mediaType if provided
  if (mediaType && !['game', 'movie', 'tv'].includes(mediaType)) {
    return { error: 'mediaType must be game, movie, or tv' } as const;
  }

  try {
    console.log('Creating list in database:', {
      userId: session.user.id,
      title: title.trim(),
      description: description?.trim() || null,
      mediaType: mediaType || null,
      isPublic,
    });

    const list = await prisma.list.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        mediaType: mediaType || null,
        isPublic,
      },
      select: {
        id: true,
        title: true,
        description: true,
        mediaType: true,
        isPublic: true,
        createdAt: true,
      },
    });

    console.log('List created successfully:', list);
    return { success: true, list } as const;
  } catch (error) {
    console.error('Error creating list:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: `Failed to create list: ${errorMessage}` } as const;
  }
}

// Update a list
export async function updateList(
  listId: string,
  input: { title?: string; description?: string; mediaType?: string; isPublic?: boolean }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { userId: true },
  });

  if (!list) return { error: 'List not found' } as const;
  if (list.userId !== session.user.id) return { error: 'Forbidden' } as const;

  // Validate mediaType if provided
  if (input.mediaType && !['game', 'movie', 'tv'].includes(input.mediaType)) {
    return { error: 'mediaType must be game, movie, or tv' } as const;
  }

  try {
    const updated = await prisma.list.update({
      where: { id: listId },
      data: {
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.description !== undefined && { description: input.description.trim() || null }),
        ...(input.mediaType !== undefined && { mediaType: input.mediaType || null }),
        ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
      },
      select: {
        id: true,
        title: true,
        description: true,
        mediaType: true,
        isPublic: true,
        updatedAt: true,
      },
    });

    return { success: true, list: updated } as const;
  } catch (error) {
    console.error('Error updating list:', error);
    return { error: 'Failed to update list' } as const;
  }
}

// Delete a list
export async function deleteList(listId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { userId: true },
  });

  if (!list) return { error: 'List not found' } as const;
  if (list.userId !== session.user.id) return { error: 'Forbidden' } as const;

  try {
    await prisma.list.delete({ where: { id: listId } });
    return { success: true } as const;
  } catch (error) {
    console.error('Error deleting list:', error);
    return { error: 'Failed to delete list' } as const;
  }
}

// Add item to list
export async function addItemToList(
  listId: string,
  input: {
    itemType: 'game' | 'movie' | 'tv';
    externalId: string;
    itemName: string;
    itemCover?: string;
    itemYear?: number;
    notes?: string;
  }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { userId: true },
  });

  if (!list) return { error: 'List not found' } as const;
  if (list.userId !== session.user.id) return { error: 'Forbidden' } as const;

  const { itemType, externalId, itemName, itemCover, itemYear, notes } = input;

  // Get current max position
  const maxPosition = await prisma.listItem.findFirst({
    where: { listId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  const newPosition = (maxPosition?.position || 0) + 1;

  try {
    const item = await prisma.listItem.create({
      data: {
        listId,
        position: newPosition,
        itemType,
        itemName,
        itemCover: itemCover || null,
        itemYear: itemYear || null,
        notes: notes?.trim() || null,
        ...(itemType === 'game' && { externalGameId: externalId }),
        ...(itemType === 'movie' && { externalMovieId: externalId }),
        ...(itemType === 'tv' && { externalTvShowId: externalId }),
      },
      select: {
        id: true,
        position: true,
        itemName: true,
        itemCover: true,
        itemYear: true,
        itemType: true,
      },
    });

    return { success: true, item } as const;
  } catch (error) {
    console.error('Error adding item to list:', error);
    return { error: 'Failed to add item to list' } as const;
  }
}

// Remove item from list
export async function removeItemFromList(listId: string, itemId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { userId: true },
  });

  if (!list) return { error: 'List not found' } as const;
  if (list.userId !== session.user.id) return { error: 'Forbidden' } as const;

  const item = await prisma.listItem.findUnique({
    where: { id: itemId },
    select: { listId: true },
  });

  if (!item || item.listId !== listId) return { error: 'Item not found' } as const;

  try {
    await prisma.listItem.delete({ where: { id: itemId } });
    
    // Reorder remaining items
    const remainingItems = await prisma.listItem.findMany({
      where: { listId },
      orderBy: { position: 'asc' },
    });

    for (let i = 0; i < remainingItems.length; i++) {
      await prisma.listItem.update({
        where: { id: remainingItems[i].id },
        data: { position: i + 1 },
      });
    }

    return { success: true } as const;
  } catch (error) {
    console.error('Error removing item from list:', error);
    return { error: 'Failed to remove item from list' } as const;
  }
}

// Reorder items in list
export async function reorderListItems(listId: string, itemIds: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { userId: true },
  });

  if (!list) return { error: 'List not found' } as const;
  if (list.userId !== session.user.id) return { error: 'Forbidden' } as const;

  try {
    for (let i = 0; i < itemIds.length; i++) {
      await prisma.listItem.update({
        where: { id: itemIds[i] },
        data: { position: i + 1 },
      });
    }

    return { success: true } as const;
  } catch (error) {
    console.error('Error reordering list items:', error);
    return { error: 'Failed to reorder items' } as const;
  }
}

