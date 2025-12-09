import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { platformQueries } from '@/lib/db/platforms';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const activities: any[] = [];

    // Get Steam games
    const steamConnection = await platformQueries.getSteamConnection(userId);
    if (steamConnection?.gamesData && Array.isArray(steamConnection.gamesData)) {
      const steamGames = steamConnection.gamesData
        .slice(0, 5)
        .map((game: any) => ({
          id: `steam_${game.appid}`,
          type: 'game',
          platform: 'Steam',
          title: game.name,
          image: game.img_logo_url || game.img_icon_url,
          playedAt: game.last_played_timestamp ? new Date(game.last_played_timestamp * 1000) : new Date(),
          hours: game.hours_total || 0,
        }));
      activities.push(...steamGames);
    }

    // Get Xbox games
    const xboxConnection = await platformQueries.getXboxConnection(userId);
    if (xboxConnection?.gamesData && Array.isArray(xboxConnection.gamesData)) {
      const xboxGames = xboxConnection.gamesData
        .slice(0, 5)
        .map((game: any) => ({
          id: `xbox_${game.titleId}`,
          type: 'game',
          platform: 'Xbox',
          title: game.name,
          image: game.displayImage || game.modernTitleId,
          playedAt: game.lastPlayed ? new Date(game.lastPlayed) : new Date(),
          achievements: game.currentAchievements || 0,
          totalAchievements: game.totalAchievements || 0,
        }));
      activities.push(...xboxGames);
    }

    // Get recent movies watched
    const moviesWatched = await prisma.movieWatched.findMany({
      where: { userId },
      take: 3,
      orderBy: { watchedAt: 'desc' },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            releaseYear: true,
            poster: true,
          },
        },
      },
    });

    activities.push(
      ...moviesWatched.map((mw) => ({
        id: `movie_${mw.movieId}`,
        type: 'movie',
        title: mw.movie.title,
        year: mw.movie.releaseYear,
        image: mw.movie.poster,
        watchedAt: mw.watchedAt,
        rating: mw.rating,
      }))
    );

    // Get recent TV shows watched
    const tvShowsWatched = await prisma.tvShowWatched.findMany({
      where: { userId },
      take: 3,
      orderBy: { watchedAt: 'desc' },
      include: {
        tvShow: {
          select: {
            id: true,
            title: true,
            releaseYear: true,
            poster: true,
          },
        },
      },
    });

    activities.push(
      ...tvShowsWatched.map((tw) => ({
        id: `tvshow_${tw.showId}`,
        type: 'tvshow',
        title: tw.tvShow.title,
        year: tw.tvShow.releaseYear,
        image: tw.tvShow.poster,
        watchedAt: tw.watchedAt,
        rating: tw.rating,
      }))
    );

    // Sort all activities by date
    activities.sort((a, b) => {
      const dateA = a.playedAt || a.watchedAt || new Date(0);
      const dateB = b.playedAt || b.watchedAt || new Date(0);
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return NextResponse.json({
      success: true,
      activities: activities.slice(0, limit),
    });
  } catch (error: any) {
    console.error('Get activity error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get activity' },
      { status: 500 }
    );
  }
}
