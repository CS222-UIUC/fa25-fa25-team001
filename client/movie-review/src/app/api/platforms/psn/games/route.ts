import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { getUserTitles, getUserPlayedGames, exchangeRefreshTokenForAuthTokens } from 'psn-api';

/**
 * Fetch games from PSN API
 * GET /api/platforms/psn/games
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's PSN connection
    const connection = await prisma.platformConnection.findUnique({
      where: {
        userId_platformType: {
          userId: session.user.id,
          platformType: 'playstation',
        },
      },
    });

    if (!connection || !connection.accessToken) {
      return NextResponse.json(
        { error: 'PlayStation account not connected' },
        { status: 400 }
      );
    }

    // Check if token is expired and refresh if needed
    let accessToken = connection.accessToken;
    let refreshToken = connection.refreshToken;

    if (connection.expiresAt && new Date(connection.expiresAt) < new Date()) {
      if (!refreshToken) {
        return NextResponse.json(
          { error: 'PSN token expired and no refresh token available' },
          { status: 400 }
        );
      }

      try {
        const newAuth = await exchangeRefreshTokenForAuthTokens(refreshToken);
        accessToken = newAuth.accessToken;
        refreshToken = newAuth.refreshToken;

        // Update the connection with new tokens
        await prisma.platformConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: newAuth.accessToken,
            refreshToken: newAuth.refreshToken,
            expiresAt: new Date(Date.now() + newAuth.expiresIn * 1000),
          },
        });
      } catch (error) {
        console.error('Error refreshing PSN token:', error);
        return NextResponse.json(
          { error: 'Failed to refresh authentication token' },
          { status: 500 }
        );
      }
    }

    // Fetch played games
    let playedGames;
    try {
      playedGames = await getUserPlayedGames(
        { accessToken },
        'me'
      );
    } catch (error: any) {
      console.error('Error fetching played games:', error);
      const errorMessage = error?.message || 'Unknown error';
      return NextResponse.json(
        { error: `Failed to fetch PlayStation games: ${errorMessage}` },
        { status: 500 }
      );
    }

    // Fetch trophy titles for additional info
    let trophyTitles;
    try {
      trophyTitles = await getUserTitles(
        { accessToken },
        'me'
      );
    } catch (error: any) {
      console.error('Error fetching trophy titles:', error?.message || error);
      // Don't fail if this fails, just use played games
      trophyTitles = null;
    }

    // Format games data
    const gamesMap = new Map();

    // Helper function to parse ISO 8601 duration to hours
    const parseDurationToHours = (duration: string): number => {
      if (!duration) return 0;
      
      // Parse PT228H56M33S format
      const hourMatch = duration.match(/(\d+)H/);
      const minuteMatch = duration.match(/(\d+)M/);
      const secondMatch = duration.match(/(\d+)S/);
      
      const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
      const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
      const seconds = secondMatch ? parseInt(secondMatch[1], 10) : 0;
      
      // Convert to hours with 1 decimal place
      return parseFloat((hours + minutes / 60 + seconds / 3600).toFixed(1));
    };

    // Add played games (includes both paid and free-to-play games)
    // getUserPlayedGames returns all games the user has played, regardless of purchase status
    if (playedGames?.titles) {
      playedGames.titles.forEach((game: any) => {
        const playtimeHours = parseDurationToHours(game.playDuration || 'PT0H0M0S');
        gamesMap.set(game.titleId, {
          id: game.titleId,
          name: game.name,
          platform: game.category || 'PlayStation',
          playtimeHours,
          lastPlayed: game.lastPlayedDateTime || null,
          imageUrl: game.imageUrl || null,
          playCount: game.playCount || 0,
        });
      });
    }

    // Merge trophy data
    if (trophyTitles?.trophyTitles) {
      trophyTitles.trophyTitles.forEach((title: any) => {
        const existing = gamesMap.get(title.npCommunicationId);
        if (existing) {
          // Add trophy info
          existing.trophyLevel = title.trophyLevel;
          existing.trophyCount = title.earnedTrophies;
        } else if (title.hasTrophyGroups) {
          // Game with trophies but no playtime
          gamesMap.set(title.npCommunicationId, {
            id: title.npCommunicationId,
            name: title.trophyTitleName,
            platform: 'PlayStation',
            playtimeHours: 0,
            lastPlayed: null,
            imageUrl: title.trophyTitleIconUrl || null,
            trophyLevel: title.trophyLevel,
            trophyCount: title.earnedTrophies,
          });
        }
      });
    }

    const games = Array.from(gamesMap.values());

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
    console.error('Error fetching PSN games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PlayStation games' },
      { status: 500 }
    );
  }
}

