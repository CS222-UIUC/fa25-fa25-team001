import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { platformQueries } from '@/lib/db/platforms';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=unauthorized`);
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Verify OpenID response
    const mode = searchParams.get('openid.mode');
    const identity = searchParams.get('openid.identity');
    
    if (mode !== 'id_res' || !identity) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=steam_auth_failed`);
    }

    // Extract Steam ID from identity URL
    const steamIdMatch = identity.match(/\/id\/(\d+)/);
    if (!steamIdMatch) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=invalid_steam_id`);
    }

    const steamId = steamIdMatch[1];

    // Get Steam games using Steam API
    const steamApiKey = process.env.STEAM_API_KEY!;
    const gamesResponse = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${steamApiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&format=json`
    );

    if (!gamesResponse.ok) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=steam_api_failed`);
    }

    const steamData = await gamesResponse.json();
    const games = steamData.response?.games || [];

    // Process games data
    const processedGames = games.map((game: any) => ({
      appid: game.appid,
      name: game.name || 'Unknown Game',
      playtime_forever: game.playtime_forever || 0,
      playtime_2weeks: game.playtime_2weeks || 0,
      img_icon_url: game.img_icon_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg` : null,
      img_logo_url: game.img_logo_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_logo_url}.jpg` : null,
      has_community_visible_stats: game.has_community_visible_stats || false,
      last_played_timestamp: game.rtime_last_played || null,
      hours_total: Math.round((game.playtime_forever || 0) / 60 * 10) / 10,
      hours_recent: Math.round((game.playtime_2weeks || 0) / 60 * 10) / 10
    })).sort((a: any, b: any) => (b.last_played_timestamp || 0) - (a.last_played_timestamp || 0));

    // Store connection
    await platformQueries.upsertSteamConnection(session.user.id, steamId, processedGames);

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?success=steam_connected`);
  } catch (error) {
    console.error('Steam OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=steam_connection_failed`);
  }
}