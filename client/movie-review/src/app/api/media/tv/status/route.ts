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

    let tvShow = null;
    if (mediaId) {
      tvShow = await prisma.tvShow.findFirst({ where: { id: mediaId } });
    } else if (title) {
      tvShow = await prisma.tvShow.findFirst({ where: { title } });
    }

    if (!tvShow) {
      return NextResponse.json({ status: null });
    }

    const watched = await prisma.tvShowWatched.findUnique({
      where: {
        userId_showId: {
          userId: session.user.id,
          showId: tvShow.id,
        },
      },
      select: { status: true },
    });

    return NextResponse.json({ status: watched?.status || null });
  } catch (error) {
    console.error('Error fetching TV show status:', error);
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

    if (!['watched', 'currently_watching', 'dropped'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Find or create TV show
    let tvShow = null;
    if (mediaId) {
      tvShow = await prisma.tvShow.findFirst({
        where: { id: mediaId },
      });
    }
    
    // If TV show doesn't exist and we have title, try to find by title or create it
    if (!tvShow && title) {
      tvShow = await prisma.tvShow.findFirst({
        where: { title },
      });
      
      if (!tvShow) {
        tvShow = await prisma.tvShow.create({
          data: {
            title,
            releaseYear: year ? parseInt(String(year)) : undefined,
          },
        });
      }
    }

    if (!tvShow) {
      return NextResponse.json({ error: 'TV show not found and cannot be created' }, { status: 404 });
    }

    // Upsert the watched status
    await prisma.tvShowWatched.upsert({
      where: {
        userId_showId: {
          userId: session.user.id,
          showId: tvShow.id,
        },
      },
      update: {
        status,
        watchedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        showId: tvShow.id,
        status,
        watchedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating TV show status:', error);
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

    let tvShow = null;
    if (mediaId) {
      tvShow = await prisma.tvShow.findFirst({ where: { id: mediaId } });
    } else if (title) {
      tvShow = await prisma.tvShow.findFirst({ where: { title } });
    }

    if (tvShow) {
      await prisma.tvShowWatched.deleteMany({
        where: {
          userId: session.user.id,
          showId: tvShow.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing TV show status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

