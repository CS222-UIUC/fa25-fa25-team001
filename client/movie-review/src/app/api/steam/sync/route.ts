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

    // Check if user has a Steam connection
    const steamConnection = await prisma.platform_connections.findFirst({
      where: {
        userId: session.user.id,
        platformType: 'steam',
      },
    });

    if (!steamConnection) {
      return NextResponse.json(
        { error: 'Steam account not connected' },
        { status: 400 }
      );
    }

    const steamId = steamConnection.platformUserId;
    if (!steamId) {
      return NextResponse.json(
        { error: 'Steam connection missing SteamID. Please reconnect Steam.' },
        { status: 400 }
      );
    }

    const steamApiKey = process.env.STEAM_API_KEY;
    if (!steamApiKey) {
      return NextResponse.json(
        { error: 'STEAM_API_KEY is not set on the server' },
        { status: 500 }
      );
    }

    const gamesResponse = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${steamApiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&format=json`
    );

    if (!gamesResponse.ok) {
      return NextResponse.json(
        { error: 'Steam API request failed', status: gamesResponse.status },
        { status: 502 }
      );
    }

    const steamData = await gamesResponse.json();
    const games = steamData.response?.games || [];

    const processedGames = games
      .map((game: any) => ({
        appid: game.appid,
        name: game.name || 'Unknown Game',
        playtime_forever: game.playtime_forever || 0,
        playtime_2weeks: game.playtime_2weeks || 0,
        img_icon_url: game.img_icon_url
          ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
          : null,
        img_logo_url: game.img_logo_url
          ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_logo_url}.jpg`
          : null,
        has_community_visible_stats: game.has_community_visible_stats || false,
        last_played_timestamp: game.rtime_last_played || null,
        hours_total: Math.round(((game.playtime_forever || 0) / 60) * 10) / 10,
        hours_recent: Math.round(((game.playtime_2weeks || 0) / 60) * 10) / 10,
      }))
      .sort((a: any, b: any) => (b.last_played_timestamp || 0) - (a.last_played_timestamp || 0));

    await prisma.platform_connections.update({
      where: { id: steamConnection.id },
      data: {
        lastSyncedAt: new Date(),
        gamesData: processedGames,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, gamesCount: processedGames.length });
  } catch (error) {
    console.error('Steam sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync Steam library' },
      { status: 500 }
    );
  }
}
