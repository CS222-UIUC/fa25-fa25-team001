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
        include: {
          movie: {
            select: { id: true, title: true, releaseYear: true },
          },
          videoGame: {
            select: { id: true, title: true, releaseYear: true },
          },
          tvShow: {
            select: { id: true, title: true, releaseYear: true },
          },
        },
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
      isPublic: list.isPublic,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      user: list.user,
      items: list.items.map(item => {
        // Determine item type and get the media record
        let itemType: 'game' | 'movie' | 'tv' | null = null;
        let mediaId: string | null = null;
        let title: string | null = null;
        let year: number | null = null;

        if (item.videoGame) {
          itemType = 'game';
          mediaId = item.videoGame.id;
          title = item.videoGame.title;
          year = item.videoGame.releaseYear;
        } else if (item.movie) {
          itemType = 'movie';
          mediaId = item.movie.id;
          title = item.movie.title;
          year = item.movie.releaseYear;
        } else if (item.tvShow) {
          itemType = 'tv';
          mediaId = item.tvShow.id;
          title = item.tvShow.title;
          year = item.tvShow.releaseYear;
        }

        return {
          id: item.id,
          position: item.position,
          notes: item.notes,
          itemType,
          mediaId,
          title,
          year,
        };
      }),
    },
  } as const;
}

// Create a new list
export async function createList(input: { 
  title: string; 
  description?: string; 
  mediaType?: string; 
  isPublic?: boolean;
  items?: Array<{
    itemType: 'game' | 'movie' | 'tv';
    externalId: string;
    itemName: string;
    itemCover?: string;
    itemYear?: number;
  }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const { title, description, mediaType, isPublic = true, items = [] } = input;
  if (!title.trim()) return { error: 'Title is required' } as const;

  // Validate mediaType if provided (though we don't store it in the schema)
  if (mediaType && !['game', 'movie', 'tv'].includes(mediaType)) {
    return { error: 'mediaType must be game, movie, or tv' } as const;
  }

  try {
    // Create the list with items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the list
      const list = await tx.list.create({
        data: {
          userId: session.user.id,
          title: title.trim(),
          description: description?.trim() || null,
          isPublic,
        },
      });

      // Create items if provided
      if (items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          let mediaId: string | null = null;

          // Find or create the media record
          if (item.itemType === 'game') {
            // For games, try to find by ID (IGDB ID stored as string)
            let game = await tx.videoGame.findFirst({
              where: { id: item.externalId },
            });
            
            if (!game) {
              // Create new game record
              game = await tx.videoGame.create({
                data: {
                  id: item.externalId,
                  title: item.itemName,
                  releaseYear: item.itemYear || undefined,
                },
              });
            }
            mediaId = game.id;
          } else if (item.itemType === 'movie') {
            // For movies, try to find by title or create
            let movie = await tx.movie.findFirst({
              where: { title: item.itemName },
            });
            
            if (!movie) {
              movie = await tx.movie.create({
                data: {
                  title: item.itemName,
                  releaseYear: item.itemYear || undefined,
                },
              });
            }
            mediaId = movie.id;
          } else if (item.itemType === 'tv') {
            // For TV shows, try to find by title or create
            let tvShow = await tx.tvShow.findFirst({
              where: { title: item.itemName },
            });
            
            if (!tvShow) {
              tvShow = await tx.tvShow.create({
                data: {
                  title: item.itemName,
                  releaseYear: item.itemYear || undefined,
                },
              });
            }
            mediaId = tvShow.id;
          }

          if (mediaId) {
            // Create the list item
            await tx.listItem.create({
              data: {
                listId: list.id,
                position: i + 1,
                ...(item.itemType === 'game' && { videoGameId: mediaId }),
                ...(item.itemType === 'movie' && { movieId: mediaId }),
                ...(item.itemType === 'tv' && { tvShowId: mediaId }),
              },
            });
          }
        }
      }

      return list;
    });

    return { 
      success: true, 
      list: {
        id: result.id,
        title: result.title,
        description: result.description,
        isPublic: result.isPublic,
        createdAt: result.createdAt,
      }
    } as const;
  } catch (error) {
    console.error('Error creating list:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: `Failed to create list: ${errorMessage}` } as const;
  }
}

// Update a list
export async function updateList(
  listId: string,
  input: { title?: string; description?: string; isPublic?: boolean }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' } as const;

  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { userId: true },
  });

  if (!list) return { error: 'List not found' } as const;
  if (list.userId !== session.user.id) return { error: 'Forbidden' } as const;

  try {
    const updated = await prisma.list.update({
      where: { id: listId },
      data: {
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.description !== undefined && { description: input.description.trim() || null }),
        ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
      },
      select: {
        id: true,
        title: true,
        description: true,
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

  const { itemType, externalId, itemName, itemYear, notes } = input;

  try {
    // Create or find the media record, similar to createList
    let mediaId: string | null = null;

    if (itemType === 'game') {
      // For games, try to find by ID (IGDB ID stored as string)
      let game = await prisma.videoGame.findFirst({
        where: { id: externalId },
      });
      
      if (!game) {
        // Create new game record
        game = await prisma.videoGame.create({
          data: {
            id: externalId,
            title: itemName,
            releaseYear: itemYear || undefined,
          },
        });
      }
      mediaId = game.id;
    } else if (itemType === 'movie') {
      // For movies, try to find by title or create
      let movie = await prisma.movie.findFirst({
        where: { title: itemName },
      });
      
      if (!movie) {
        movie = await prisma.movie.create({
          data: {
            title: itemName,
            releaseYear: itemYear || undefined,
          },
        });
      }
      mediaId = movie.id;
    } else if (itemType === 'tv') {
      // For TV shows, try to find by title or create
      let tvShow = await prisma.tvShow.findFirst({
        where: { title: itemName },
      });
      
      if (!tvShow) {
        tvShow = await prisma.tvShow.create({
          data: {
            title: itemName,
            releaseYear: itemYear || undefined,
          },
        });
      }
      mediaId = tvShow.id;
    }

    if (!mediaId) {
      return { error: 'Failed to create or find media record' } as const;
    }

    // Get current max position
    const maxPosition = await prisma.listItem.findFirst({
      where: { listId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const newPosition = (maxPosition?.position || 0) + 1;

    // Create the list item
    const item = await prisma.listItem.create({
      data: {
        listId,
        position: newPosition,
        notes: notes?.trim() || null,
        ...(itemType === 'game' && { videoGameId: mediaId }),
        ...(itemType === 'movie' && { movieId: mediaId }),
        ...(itemType === 'tv' && { tvShowId: mediaId }),
      },
      select: {
        id: true,
        position: true,
        notes: true,
        movieId: true,
        videoGameId: true,
        tvShowId: true,
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

