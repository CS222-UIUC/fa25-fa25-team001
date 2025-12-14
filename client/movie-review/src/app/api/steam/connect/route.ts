import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { steamId } = await request.json();
    if (!steamId) {
      return NextResponse.json({ error: 'Steam ID required' }, { status: 400 });
    }

    const steamApiKey = process.env.STEAM_API_KEY;
    if (!steamApiKey) {
      await prisma.platform_connections.upsert({
        where: {
          userId_platformType: {
            userId: session.user.id,
            platformType: 'steam'
          }
        },
        update: {
          platformUserId: steamId,
          gamesData: [],
          lastSyncedAt: new Date(),
          updatedAt: new Date()
        },
        create: {
          id: `steam_${session.user.id}`,
          userId: session.user.id,
          platformType: 'steam',
          platformUserId: steamId,
          gamesData: [],
          lastSyncedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        gamesCount: 0,
        warning: 'STEAM_API_KEY not set; connected without fetching library.'
      });
    }

    // Get Steam games using Steam API with detailed info and free games
    const gamesResponse = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${steamApiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&format=json`
    );

    if (!gamesResponse.ok) {
      throw new Error('Failed to fetch Steam games');
    }

    const steamData = await gamesResponse.json();
    const games = steamData.response?.games || [];

    // Process and enhance game data
    const processedGames = games.map((game: any) => ({
      appid: game.appid,
      name: game.name || 'Unknown Game',
      playtime_forever: game.playtime_forever || 0, // Total minutes played
      playtime_2weeks: game.playtime_2weeks || 0, // Minutes played in last 2 weeks
      img_icon_url: game.img_icon_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg` : null,
      img_logo_url: game.img_logo_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_logo_url}.jpg` : null,
      has_community_visible_stats: game.has_community_visible_stats || false,
      last_played_timestamp: game.rtime_last_played || null,
      hours_total: Math.round((game.playtime_forever || 0) / 60 * 10) / 10, // Convert to hours
      hours_recent: Math.round((game.playtime_2weeks || 0) / 60 * 10) / 10
    })).sort((a: any, b: any) => (b.last_played_timestamp || 0) - (a.last_played_timestamp || 0)); // Sort by last played

    // Store connection
    await prisma.platform_connections.upsert({
      where: {
        userId_platformType: {
          userId: session.user.id,
          platformType: 'steam'
        }
      },
      update: {
        platformUserId: steamId,
        gamesData: processedGames,
        lastSyncedAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        id: `steam_${session.user.id}`,
        userId: session.user.id,
        platformType: 'steam',
        platformUserId: steamId,
        gamesData: processedGames,
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      gamesCount: processedGames.length 
    });
  } catch (error) {
    console.error('Steam connection error:', error);
    return NextResponse.json({ error: 'Failed to connect Steam' }, { status: 500 });
  }
}