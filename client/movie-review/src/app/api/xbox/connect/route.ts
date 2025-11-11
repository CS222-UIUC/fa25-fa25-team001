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

    const { gamertag } = await request.json();
    if (!gamertag) {
      return NextResponse.json({ error: 'Xbox gamertag required' }, { status: 400 });
    }

    const xboxApiKey = process.env.XBOX_API_KEY;
    if (!xboxApiKey) {
      return NextResponse.json({ error: 'Xbox API key not configured' }, { status: 500 });
    }

    // First, get the Xbox user ID (XUID) from gamertag using OpenXBL API
    const profileResponse = await fetch(
      `https://xbl.io/api/v2/search/${encodeURIComponent(gamertag)}`,
      {
        headers: {
          'X-Authorization': xboxApiKey,
          'Accept': 'application/json'
        }
      }
    );

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch Xbox profile');
    }

    const profileData = await profileResponse.json();
    const xuid = profileData[0]?.xuid;
    
    if (!xuid) {
      return NextResponse.json({ error: 'Gamertag not found' }, { status: 404 });
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
      // Process achievements by titleId
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

    // Process games data similar to Steam format
    const processedGames = games.map((game: any) => {
      const titleId = game.titleId?.toString();
      const gameAchievements = achievementsMap[titleId] || { total: 0, unlocked: 0, achievements: [] };
      
      // Calculate playtime in hours (if available)
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
      // Sort by last played, then by hours played
      const aLastPlayed = a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0;
      const bLastPlayed = b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0;
      if (bLastPlayed !== aLastPlayed) return bLastPlayed - aLastPlayed;
      return (b.hoursTotal || 0) - (a.hoursTotal || 0);
    });

    // Store connection with processed games data
    await platformQueries.upsertXboxConnection(session.user.id, gamertag, processedGames);

    return NextResponse.json({ 
      success: true, 
      gamertag,
      xuid,
      gamesCount: processedGames.length 
    });
  } catch (error: any) {
    console.error('Xbox connection error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to connect Xbox' 
    }, { status: 500 });
  }
}

