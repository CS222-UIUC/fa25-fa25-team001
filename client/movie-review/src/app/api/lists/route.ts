import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET all user's watchlists or a specific watchlist
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const listId = searchParams.get('listId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (listId) {
      // Get specific list with items
      const list = await prisma.list.findFirst({
        where: {
          id: listId,
          userId,
        },
        include: {
          items: {
            include: {
              movie: true,
              tvShow: true,
              videoGame: true,
            },
            orderBy: { position: 'asc' },
          },
        },
      });

      if (!list) {
        return NextResponse.json({ error: 'List not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, list });
    }

    // Get all lists for user
    const lists = await prisma.list.findMany({
      where: { userId },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, lists });
  } catch (error: any) {
    console.error('Get lists error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get lists' },
      { status: 500 }
    );
  }
}

// POST create a new watchlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, category, isPublic } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const list = await prisma.list.create({
      data: {
        title,
        description: description || null,
        category: category || 'custom',
        isPublic: isPublic !== undefined ? isPublic : true,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json({ success: true, list }, { status: 201 });
  } catch (error: any) {
    console.error('Create list error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create list' },
      { status: 500 }
    );
  }
}

// DELETE a watchlist
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listId } = await request.json();

    if (!listId) {
      return NextResponse.json({ error: 'List ID required' }, { status: 400 });
    }

    // Delete the list (cascade will delete items)
    await prisma.list.deleteMany({
      where: {
        id: listId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, message: 'List deleted' });
  } catch (error: any) {
    console.error('Delete list error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete list' },
      { status: 500 }
    );
  }
}

// PATCH update a watchlist
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listId, title, description, isPublic } = await request.json();

    if (!listId) {
      return NextResponse.json({ error: 'List ID required' }, { status: 400 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const list = await prisma.list.updateMany({
      where: {
        id: listId,
        userId: session.user.id,
      },
      data: updateData,
    });

    if (list.count === 0) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'List updated' });
  } catch (error: any) {
    console.error('Update list error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update list' },
      { status: 500 }
    );
  }
}
