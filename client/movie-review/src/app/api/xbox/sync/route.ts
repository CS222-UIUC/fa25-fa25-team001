import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { platformQueries } from '@/lib/db/platforms';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing connection to get gamertag/XUID
    const connection = await platformQueries.getXboxConnection(session.user.id);
    if (!connection || !connection.platformUserId) {
      return NextResponse.json({ error: 'Xbox connection not found' }, { status: 404 });
    }

    const gamertag = connection.platformUserId;
    const xboxApiKey = process.env.XBOX_API_KEY;
    if (!xboxApiKey) {
      return NextResponse.json({ error: 'Xbox API key not configured' }, { status: 500 });
    }

    // Try to get XUID from stored gamesData (if we stored it during OAuth)
    let xuid: string | null = null;
    if (connection.gamesData && typeof connection.gamesData === 'object') {
      const gamesData = connection.gamesData as any;
      // Check if XUID is stored in gamesData metadata (could be array with metadata or object)
      if (Array.isArray(gamesData)) {
        // If it's an array, check last element for metadata
        const lastItem = gamesData[gamesData.length - 1];
        if (lastItem && lastItem._xuid) {
          xuid = lastItem._xuid;
        }
      } else if (gamesData._xuid) {
        xuid = gamesData._xuid;
      }
    }

    // If no XUID stored, try to get it from gamertag search
    if (!xuid) {
      try {
        const profileResponse = await fetch(
          `https://xbl.io/api/v2/search/${encodeURIComponent(gamertag)}`,
          {
            headers: {
              'X-Authorization': xboxApiKey,
              'Accept': 'application/json'
            }
          }
        );

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          // Handle different response formats
          if (Array.isArray(profileData) && profileData.length > 0) {
            xuid = profileData[0]?.xuid;
          } else if (profileData.xuid) {
            xuid = profileData.xuid;
          } else if (profileData.profileUsers && profileData.profileUsers.length > 0) {
            xuid = profileData.profileUsers[0]?.id;
          }
        }
      } catch (searchError) {
        console.error('Failed to search for gamertag:', searchError);
      }
    }

    // If still no XUID, try using gamertag directly with games endpoint (some APIs accept gamertag)
    if (!xuid) {
      // Try alternative: use gamertag directly if API supports it
      // For now, return error with helpful message
      return NextResponse.json({ 
        error: `Gamertag "${gamertag}" not found. Please reconnect via Xbox OAuth to refresh your connection.`,
        gamertag: gamertag
      }, { status: 404 });
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
      { _xuid: xuid, _gamertag: gamertag, _metadata: true } as any
    ];

    // Update connection with fresh games data
    await platformQueries.upsertXboxConnection(session.user.id, gamertag, gamesDataWithXuid);

    return NextResponse.json({ 
      success: true, 
      gamesCount: processedGames.length,
      lastSynced: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Xbox sync error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to sync Xbox games' 
    }, { status: 500 });
  }
}

