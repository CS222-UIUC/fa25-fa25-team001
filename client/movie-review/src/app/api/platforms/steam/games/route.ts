import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

const STEAM_API_KEY = process.env.STEAM_API_KEY || '';

interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number; // in minutes
  playtime_windows_forever: number;
  playtime_mac_forever: number;
  playtime_linux_forever: number;
  playtime_2weeks?: number;
  last_played?: number; // Unix timestamp
}

interface SteamOwnedGamesResponse {
  response: {
    game_count: number;
    games: SteamGame[];
  };
}

/**
 * Fetch games from Steam API
 * GET /api/platforms/steam/games
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's Steam connection
    const connection = await prisma.platformConnection.findUnique({
      where: {
        userId_platformType: {
          userId: session.user.id,
          platformType: 'steam',
        },
      },
    });

    if (!connection || !connection.platformUserId) {
      return NextResponse.json(
        { error: 'Steam account not connected' },
        { status: 400 }
      );
    }

    if (!STEAM_API_KEY) {
      return NextResponse.json(
        { error: 'Steam API key not configured' },
        { status: 500 }
      );
    }

    const steamId = connection.platformUserId;
    const url = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&format=json&include_appinfo=true`;

    const response = await fetch(url);
    const data: SteamOwnedGamesResponse = await response.json();

    if (!data.response || !data.response.games) {
      return NextResponse.json({ error: 'No games found' }, { status: 404 });
    }

    // Format games with playtime data
    const games = data.response.games.map((game) => ({
      id: game.appid,
      name: game.name,
      playtimeMinutes: game.playtime_forever,
      playtimeHours: (game.playtime_forever / 60).toFixed(1),
      lastPlayed: game.last_played
        ? new Date(game.last_played * 1000).toISOString()
        : null,
      platform: 'steam',
    }));

    // Update connection with latest data
    await prisma.platformConnection.update({
      where: { id: connection.id },
      data: {
        gamesData: games,
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, games });
  } catch (error) {
    console.error('Error fetching Steam games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Steam games' },
      { status: 500 }
    );
  }
}

