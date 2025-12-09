import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// POST add an item to a list
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listId, mediaId, mediaType, title, year, poster, notes } = await request.json();

    if (!listId || !mediaId || !mediaType || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: listId, mediaId, mediaType, title' },
        { status: 400 }
      );
    }

    // Verify list belongs to user
    const list = await prisma.list.findFirst({
      where: {
        id: listId,
        userId: session.user.id,
      },
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Ensure the media exists in our database
    let movieId = null,
      tvShowId = null,
      gameId = null;

    if (mediaType === 'movie') {
      // First check if movie already exists locally (by exact title match)
      let movie = await prisma.movie.findFirst({
        where: {
          title: { equals: title, mode: 'insensitive' },
          ...(year && { releaseYear: parseInt(year.toString()) }),
        },
      });
      
      if (!movie) {
        // Create new local copy with OMDB ID as the database ID
        movie = await prisma.movie.create({
          data: {
            id: mediaId, // Use OMDB ID as database ID for consistency
            title: title,
            releaseYear: year ? parseInt(year.toString()) : null,
            poster: poster && poster !== 'N/A' ? poster : null,
          },
        });
      }
      movieId = movie.id;
    } else if (mediaType === 'tvshow') {
      // First check if TV show already exists locally
      let tvShow = await prisma.tvShow.findFirst({
        where: {
          title: { equals: title, mode: 'insensitive' },
          ...(year && { releaseYear: parseInt(year.toString()) }),
        },
      });
      
      if (!tvShow) {
        // Create new local copy with OMDB ID as the database ID
        tvShow = await prisma.tvShow.create({
          data: {
            id: mediaId, // Use OMDB ID as database ID
            title: title,
            releaseYear: year ? parseInt(year.toString()) : null,
            poster: poster && poster !== 'N/A' ? poster : null,
          },
        });
      }
      tvShowId = tvShow.id;
    } else if (mediaType === 'game') {
      // First check if game already exists locally
      let game = await prisma.videoGame.findFirst({
        where: {
          title: { equals: title, mode: 'insensitive' },
          ...(year && { releaseYear: parseInt(year.toString()) }),
        },
      });
      
      if (!game) {
        // Create new local copy with RAWG ID as the database ID
        game = await prisma.videoGame.create({
          data: {
            id: mediaId, // Use RAWG ID as database ID
            title: title,
            releaseYear: year ? parseInt(year.toString()) : null,
            cover: poster || null,
          },
        });
      }
      gameId = game.id;
    }

    // Check if item already exists in list
    const existingItem = await prisma.listItem.findFirst({
      where: {
        listId,
        OR: [
          { movieId: movieId },
          { tvShowId: tvShowId },
          { videoGameId: gameId },
        ],
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: 'Item already in list' },
        { status: 400 }
      );
    }

    // Get the next position
    const lastItem = await prisma.listItem.findFirst({
      where: { listId },
      orderBy: { position: 'desc' },
    });
    const nextPosition = (lastItem?.position || 0) + 1;

    // Create the list item
    const listItem = await prisma.listItem.create({
      data: {
        listId,
        position: nextPosition,
        movieId,
        tvShowId,
        videoGameId: gameId,
        notes: notes || null,
      },
      include: {
        movie: true,
        tvShow: true,
        videoGame: true,
      },
    });

    return NextResponse.json({ success: true, listItem }, { status: 201 });
  } catch (error: any) {
    console.error('Add list item error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add item to list' },
      { status: 500 }
    );
  }
}

// DELETE remove an item from a list
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    // Delete the list item (only if it belongs to the user's list)
    const result = await prisma.listItem.deleteMany({
      where: {
        id: itemId,
        list: {
          userId: session.user.id,
        },
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Item removed from list' });
  } catch (error: any) {
    console.error('Remove list item error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove item from list' },
      { status: 500 }
    );
  }
}
