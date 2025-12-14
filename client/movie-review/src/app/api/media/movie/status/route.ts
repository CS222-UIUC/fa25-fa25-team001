import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');
    const title = searchParams.get('title');

    if (!mediaId && !title) {
      return NextResponse.json({ error: 'Missing mediaId or title' }, { status: 400 });
    }

    let movie = null;
    if (mediaId) {
      movie = await prisma.movie.findFirst({ where: { id: mediaId } });
    } else if (title) {
      movie = await prisma.movie.findFirst({ where: { title } });
    }

    if (!movie) {
      return NextResponse.json({ status: null });
    }

    const watched = await prisma.movieWatched.findUnique({
      where: {
        userId_movieId: {
          userId: session.user.id,
          movieId: movie.id,
        },
      },
      select: { status: true },
    });

    return NextResponse.json({ status: watched?.status || null });
  } catch (error) {
    console.error('Error fetching movie status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mediaId, status, title, year } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['watched', 'dropped'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Find or create movie
    let movie = null;
    if (mediaId) {
      movie = await prisma.movie.findFirst({
        where: { id: mediaId },
      });
    }
    
    // If movie doesn't exist and we have title, create it
    if (!movie && title) {
      movie = await prisma.movie.create({
        data: {
          title,
          releaseYear: year ? parseInt(year) : undefined,
        },
      });
    }

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found and cannot be created' }, { status: 404 });
    }

    // Upsert the watched status
    await prisma.movieWatched.upsert({
      where: {
        userId_movieId: {
          userId: session.user.id,
          movieId: movie.id,
        },
      },
      update: {
        status,
        watchedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        movieId: movie.id,
        status,
        watchedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating movie status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mediaId, title } = await request.json();

    if (!mediaId && !title) {
      return NextResponse.json({ error: 'Missing mediaId or title' }, { status: 400 });
    }

    let movie = null;
    if (mediaId) {
      movie = await prisma.movie.findFirst({ where: { id: mediaId } });
    } else if (title) {
      movie = await prisma.movie.findFirst({ where: { title } });
    }

    if (movie) {
      await prisma.movieWatched.deleteMany({
        where: {
          userId: session.user.id,
          movieId: movie.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing movie status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
