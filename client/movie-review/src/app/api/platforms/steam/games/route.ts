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
  last_played?: number; // Unix timestamp (deprecated, use rtime_last_played)
  rtime_last_played?: number; // Unix timestamp (preferred field)
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
    
    // Fetch owned games
    const ownedGamesUrl = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&format=json&include_appinfo=true&include_played_free_games=true`;
    const ownedGamesResponse = await fetch(ownedGamesUrl);
    
    if (!ownedGamesResponse.ok) {
      console.error('Steam API error:', ownedGamesResponse.status, ownedGamesResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch data from Steam API. Please check if the Steam profile is public.' },
        { status: ownedGamesResponse.status }
      );
    }

    const data: SteamOwnedGamesResponse = await ownedGamesResponse.json();
    
    // Also fetch recently played games to get last played dates
    // GetRecentlyPlayedGames returns games played in the last 2 weeks with better date info
    const recentGamesUrl = `http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&format=json&count=100`;
    let recentGamesData: any = null;
    try {
      const recentGamesResponse = await fetch(recentGamesUrl);
      if (recentGamesResponse.ok) {
        recentGamesData = await recentGamesResponse.json();
      }
    } catch (error) {
      console.log('Could not fetch recently played games (non-critical):', error);
      // Continue without recent games data
    }

    // Check for Steam API errors
    if (data.response === undefined) {
      console.error('Steam API returned unexpected response:', data);
      return NextResponse.json(
        { error: 'Invalid response from Steam API. The Steam profile may be private or the Steam ID may be invalid.' },
        { status: 400 }
      );
    }

    // Check if profile is private (game_count exists but is undefined or 0)
    if (data.response.game_count === undefined || data.response.game_count === null) {
      return NextResponse.json(
        { error: 'Unable to access Steam profile. Please ensure the profile is set to public in Steam privacy settings.' },
        { status: 403 }
      );
    }

    if (!data.response.games || data.response.games.length === 0) {
      return NextResponse.json({ 
        error: `No games found. The profile shows ${data.response.game_count || 0} games, but game details are not accessible. Please ensure the profile is fully public.` 
      }, { status: 404 });
    }

    // Create a map of recently played games (played in last 2 weeks) for last played dates
    const recentGamesMap = new Map<number, any>();
    if (recentGamesData?.response?.games) {
      recentGamesData.response.games.forEach((recentGame: any) => {
        // GetRecentlyPlayedGames may include a last_played or rtime_last_played field
        recentGamesMap.set(recentGame.appid, recentGame);
      });
    }
    
    // Format games with playtime data
    const games = data.response.games.map((game) => {
      // Steam's GetOwnedGames doesn't officially return last_played, but GetRecentlyPlayedGames might
      // Check if this game is in recently played games first
      const recentGame = recentGamesMap.get(game.appid);
      
      // Try to get last played timestamp from various sources
      // 1. From recently played games (most reliable for last 2 weeks)
      // 2. From owned games (if Steam returns it despite not being documented)
      // 3. Use playtime_2weeks as indicator (if > 0, game was played in last 2 weeks)
      let lastPlayedTimestamp: number | null = null;
      
      if (recentGame) {
        // Recently played game - may have last_played or rtime_last_played
        lastPlayedTimestamp = (recentGame as any).rtime_last_played || 
                             (recentGame as any).last_played || 
                             null;
      }
      
      // If not found in recent games, check if owned games has it (undocumented field)
      if (!lastPlayedTimestamp) {
        lastPlayedTimestamp = (game as any).rtime_last_played || 
                            (game as any).last_played || 
                            null;
      }
      
      // If still no timestamp but playtime_2weeks exists, estimate "recently" as within 2 weeks
      // Use current date minus estimated days based on playtime_2weeks ratio
      let lastPlayed: string | null = null;
      if (lastPlayedTimestamp && lastPlayedTimestamp > 0) {
        try {
          lastPlayed = new Date(lastPlayedTimestamp * 1000).toISOString();
        } catch (e) {
          console.error('Error parsing last played timestamp:', e);
        }
      } else if (game.playtime_2weeks && game.playtime_2weeks > 0 && game.playtime_forever > 0) {
        // Estimate: if played in last 2 weeks, use a rough estimate
        // Calculate days ago based on playtime_2weeks vs playtime_forever ratio
        // This is an approximation - assume more recent playtime means more recent date
        const recentPlayRatio = game.playtime_2weeks / game.playtime_forever;
        const daysAgo = Math.max(1, Math.min(14, Math.round(14 * (1 - recentPlayRatio))));
        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() - daysAgo);
        lastPlayed = estimatedDate.toISOString();
      }
      
      return {
        id: game.appid,
        name: game.name,
        playtimeMinutes: game.playtime_forever,
        playtimeHours: (game.playtime_forever / 60).toFixed(1),
        lastPlayed,
        platform: 'steam',
      };
    });

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

