import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

const XBOX_API_KEY = process.env.XBOX_API_KEY || '';

interface XboxGame {
  gameId: string;
  titleId: string;
  name: string;
  totalPlayTime: number; // in minutes
  lastTimePlayed: string;
}

/**
 * Fetch games from Xbox/Microsoft API
 * GET /api/platforms/xbox/games
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's Xbox connection
    const connection = await prisma.platformConnection.findUnique({
      where: {
        userId_platformType: {
          userId: session.user.id,
          platformType: 'xbox',
        },
      },
    });

    if (!connection || !connection.platformUserId) {
      return NextResponse.json(
        { error: 'Xbox account not connected' },
        { status: 400 }
      );
    }

    if (!XBOX_API_KEY) {
      return NextResponse.json(
        { error: 'Xbox API key not configured' },
        { status: 500 }
      );
    }

    // Xbox API Implementation Notes:
    // - When implementing full Xbox Live API integration, ensure to include FREE GAMES
    // - Similar to Steam's include_played_free_games=true parameter, Xbox should include all games
    // - Do NOT filter out free-to-play titles or free games obtained through promotions
    // - Include ALL games the user has played/installed, regardless of purchase status
    
    // Example implementations (when OAuth is set up):
    // 1. Using OpenXBL API (unofficial but easier):
    //    GET https://xbl.io/api/v2/{xuid}/games - includes all games (free + purchased)
    // 2. Using official Xbox Live API:
    //    GET https://xsts.auth.xboxlive.com/user/{xuid}/playersettings
    //    - Ensure API call includes all game types (retail, arcade, free-to-play, etc.)
    
    // IMPORTANT: When processing game data, do NOT filter based on:
    // - purchaseStatus === 'Free'
    // - isFree === true
    // - price === 0
    // Include ALL games in the response, just like Steam does
    
    // For now, return a placeholder response since Xbox API requires OAuth tokens
    // Format placeholder games data
    const games: any[] = [];

    // Update connection with latest data
    await prisma.platformConnection.update({
      where: { id: connection.id },
      data: {
        gamesData: games,
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      games,
      message: 'Xbox API integration requires OAuth tokens. Basic connection established.' 
    });
  } catch (error) {
    console.error('Error fetching Xbox games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Xbox games' },
      { status: 500 }
    );
  }
}

