import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { platformQueries } from '@/lib/db/platforms';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const games: any[] = [];

    // Get Steam games
    const steamConnection = await platformQueries.getSteamConnection(userId);
    if (steamConnection?.gamesData && Array.isArray(steamConnection.gamesData)) {
      const steamGames = steamConnection.gamesData.map((game: any) => ({
        id: `steam_${game.appid}`,
        platform: 'Steam',
        platformId: game.appid,
        title: game.name,
        image: game.img_logo_url || game.img_icon_url,
        hoursPlayed: game.hours_total || 0,
        lastPlayed: game.last_played_timestamp
          ? new Date(game.last_played_timestamp * 1000)
          : null,
      }));
      games.push(...steamGames);
    }

    // Get Xbox games
    const xboxConnection = await platformQueries.getXboxConnection(userId);
    if (xboxConnection?.gamesData && Array.isArray(xboxConnection.gamesData)) {
      const xboxGames = xboxConnection.gamesData.map((game: any) => ({
        id: `xbox_${game.titleId}`,
        platform: 'Xbox',
        platformId: game.titleId,
        title: game.name,
        image: game.displayImage || game.modernTitleId,
        achievements: game.currentAchievements || 0,
        totalAchievements: game.totalAchievements || 0,
        gamerscore: game.currentGamerscore || 0,
        lastPlayed: game.lastPlayed ? new Date(game.lastPlayed) : null,
      }));
      games.push(...xboxGames);
    }

    // Sort by last played
    games.sort((a, b) => {
      const dateA = a.lastPlayed || new Date(0);
      const dateB = b.lastPlayed || new Date(0);
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return NextResponse.json({
      success: true,
      games: games.slice(0, limit),
      total: games.length,
      steamConnected: !!steamConnection,
      xboxConnected: !!xboxConnection,
    });
  } catch (error: any) {
    console.error('Get games error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get games' },
      { status: 500 }
    );
  }
}
