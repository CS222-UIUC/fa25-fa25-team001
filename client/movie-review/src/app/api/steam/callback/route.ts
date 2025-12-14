import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { platformQueries } from '@/lib/db/platforms';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
    if (!session?.user?.id) {
      return NextResponse.redirect(`${baseUrl}/profile?error=unauthorized`);
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Verify OpenID response
    const mode = searchParams.get('openid.mode');
    const claimedId = searchParams.get('openid.claimed_id');
    const identity = searchParams.get('openid.identity');
    const identityUrl = claimedId || identity;
    
    if (mode !== 'id_res' || !identityUrl) {
      return NextResponse.redirect(`${baseUrl}/profile?error=steam_auth_failed`);
    }

    // Extract Steam ID from identity URL
    const steamIdMatch = identityUrl.match(/\/openid\/id\/(\d{5,})$/);
    if (!steamIdMatch) {
      return NextResponse.redirect(`${baseUrl}/profile?error=invalid_steam_id`);
    }

    const steamId = steamIdMatch[1];

    let processedGames: any[] = [];
    let warning: string | null = null;

    const steamApiKey = process.env.STEAM_API_KEY;
    if (!steamApiKey) {
      warning = 'steam_api_key_missing';
    } else {
      const gamesResponse = await fetch(
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${steamApiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&format=json`
      );

      if (!gamesResponse.ok) {
        warning = 'steam_api_failed';
      } else {
        const steamData = await gamesResponse.json();
        const games = steamData.response?.games || [];

        processedGames = games.map((game: any) => ({
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
      }
    }

    // Store connection
    await platformQueries.upsertSteamConnection(session.user.id, steamId, processedGames);

    const redirectUrl = new URL(`${baseUrl}/profile`);
    redirectUrl.searchParams.set('success', 'steam_connected');
    if (warning) {
      redirectUrl.searchParams.set('warning', warning);
    }
    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Steam OAuth callback error:', error);
    const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}/profile?error=steam_connection_failed`);
  }
}