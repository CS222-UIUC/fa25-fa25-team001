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
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=xbox_auth_denied`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=xbox_auth_failed`);
    }

    // Verify state (simplified - in production verify against stored state)
    const storedState = request.cookies.get('xbox_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=xbox_state_mismatch`);
    }

    const clientId = process.env.XBOX_CLIENT_ID;
    const clientSecret = process.env.XBOX_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/xbox/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=xbox_config_missing`);
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'XboxLive.signin XboxLive.offline_access',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('No access token received');
    }

    // Exchange Microsoft token for Xbox Live token
    const xboxTokenResponse = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        Properties: {
          AuthMethod: 'RPS',
          SiteName: 'user.auth.xboxlive.com',
          RpsTicket: `d=${accessToken}`,
        },
        RelyingParty: 'http://auth.xboxlive.com',
        TokenType: 'JWT',
      }),
    });

    if (!xboxTokenResponse.ok) {
      throw new Error('Failed to get Xbox Live token');
    }

    const xboxTokenData = await xboxTokenResponse.json();
    const xboxToken = xboxTokenData.Token;
    const userHash = xboxTokenData.DisplayClaims?.xui?.[0]?.uhs;

    if (!xboxToken || !userHash) {
      throw new Error('Invalid Xbox Live token response');
    }

    // Get XUID from Xbox Live
    const xboxUserResponse = await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        Properties: {
          SandboxId: 'RETAIL',
          UserTokens: [xboxToken],
        },
        RelyingParty: 'http://xboxlive.com',
        TokenType: 'JWT',
      }),
    });

    if (!xboxUserResponse.ok) {
      throw new Error('Failed to get XUID');
    }

    const xboxUserData = await xboxUserResponse.json();
    const xuid = xboxUserData.DisplayClaims?.xui?.[0]?.xid;
    const gamertag = xboxUserData.DisplayClaims?.xui?.[0]?.gtg;

    if (!xuid) {
      throw new Error('XUID not found in response');
    }

    // Now fetch games using OpenXBL API with XUID
    const xboxApiKey = process.env.XBOX_API_KEY;
    if (!xboxApiKey) {
      // Store connection without games if API key not available
      await platformQueries.upsertXboxConnection(session.user.id, gamertag || xuid, []);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?success=xbox_connected&warning=no_api_key`);
    }

    // Fetch user's game library
    const gamesResponse = await fetch(
      `https://xbl.io/api/v2/accountXuid/${xuid}/games`,
      {
        headers: {
          'X-Authorization': xboxApiKey,
          'Accept': 'application/json'
        }
      }
    );

    let games: any[] = [];
    if (gamesResponse.ok) {
      const gamesData = await gamesResponse.json();
      games = gamesData.titles || [];
    }

    // Fetch achievements for games
    const achievementsResponse = await fetch(
      `https://xbl.io/api/v2/achievements/player/${xuid}`,
      {
        headers: {
          'X-Authorization': xboxApiKey,
          'Accept': 'application/json'
        }
      }
    );

    let achievementsMap: Record<string, any> = {};
    if (achievementsResponse.ok) {
      const achievementsData = await achievementsResponse.json();
      if (achievementsData.achievements) {
        achievementsData.achievements.forEach((ach: any) => {
          const titleId = ach.titleId;
          if (!achievementsMap[titleId]) {
            achievementsMap[titleId] = {
              total: 0,
              unlocked: 0,
              achievements: []
            };
          }
          achievementsMap[titleId].total++;
          if (ach.progressState === 'Achieved') {
            achievementsMap[titleId].unlocked++;
          }
          achievementsMap[titleId].achievements.push({
            name: ach.name,
            description: ach.description,
            unlocked: ach.progressState === 'Achieved',
            unlockedDate: ach.progressState === 'Achieved' ? ach.progressedDateTime : null,
            gamerscore: ach.rewards?.[0]?.value || 0
          });
        });
      }
    }

    // Process games data
    const processedGames = games.map((game: any) => {
      const titleId = game.titleId?.toString();
      const gameAchievements = achievementsMap[titleId] || { total: 0, unlocked: 0, achievements: [] };
      
      const totalMinutes = game.stats?.minutesPlayed || 0;
      const hoursTotal = Math.round((totalMinutes / 60) * 10) / 10;

      return {
        titleId: titleId,
        name: game.name || 'Unknown Game',
        platform: game.platforms?.join(', ') || 'Xbox',
        releaseDate: game.releaseDate || null,
        imageUrl: game.imageUrl || null,
        boxArtUrl: game.boxArtUrl || null,
        minutesPlayed: totalMinutes,
        hoursTotal: hoursTotal,
        lastPlayed: game.lastPlayed || null,
        achievements: {
          total: gameAchievements.total,
          unlocked: gameAchievements.unlocked,
          percentage: gameAchievements.total > 0 
            ? Math.round((gameAchievements.unlocked / gameAchievements.total) * 100) 
            : 0,
          list: gameAchievements.achievements
        },
        gamerscore: gameAchievements.achievements.reduce((sum: number, ach: any) => sum + (ach.gamerscore || 0), 0)
      };
    }).sort((a: any, b: any) => {
      const aLastPlayed = a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0;
      const bLastPlayed = b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0;
      if (bLastPlayed !== aLastPlayed) return bLastPlayed - aLastPlayed;
      return (b.hoursTotal || 0) - (a.hoursTotal || 0);
    });

    // Store XUID in gamesData metadata for future syncs (add as last element)
    const gamesDataWithXuid = [
      ...processedGames,
      { _xuid: xuid, _gamertag: gamertag || xuid, _metadata: true } as any
    ];

    // Store connection with processed games data
    await platformQueries.upsertXboxConnection(session.user.id, gamertag || xuid, gamesDataWithXuid);

    // Clear OAuth state cookie
    const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?success=xbox_connected`);
    response.cookies.delete('xbox_oauth_state');
    
    return response;
  } catch (error: any) {
    console.error('Xbox OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=xbox_connection_failed`);
  }
}

