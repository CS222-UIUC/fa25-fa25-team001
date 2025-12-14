import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Find the user's watchlist
    const watchlist = await prisma.list.findFirst({
      where: {
        userId: userId,
        title: 'Watchlist',
      },
      include: {
        items: {
          include: {
            movie: true,
            tvShow: true,
            videoGame: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!watchlist) {
      return NextResponse.json({ items: [] });
    }

    // Transform the data for the frontend
    const items = watchlist.items.map((item) => {
      let type = 'unknown';
      let title = 'Unknown';
      let poster = undefined;
      let mediaId = '';
      let releaseYear = undefined;

      if (item.movie) {
        type = 'movie';
        title = item.movie.title;
        poster = item.movie.poster || undefined;
        mediaId = item.movie.id;
        releaseYear = item.movie.releaseYear;
      } else if (item.tvShow) {
        type = 'tv';
        title = item.tvShow.title;
        poster = item.tvShow.poster || undefined;
        mediaId = item.tvShow.id;
        releaseYear = item.tvShow.releaseYear;
      } else if (item.videoGame) {
        type = 'game';
        title = item.videoGame.title;
        poster = item.videoGame.cover || undefined;
        mediaId = item.videoGame.id;
        releaseYear = item.videoGame.releaseYear;
      }

      return {
        id: item.id,
        type,
        title,
        poster,
        addedAt: item.createdAt.toISOString(),
        mediaId,
        releaseYear,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
