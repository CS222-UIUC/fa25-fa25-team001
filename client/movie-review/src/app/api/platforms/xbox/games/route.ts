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

    // For now, return a placeholder response since Xbox API requires OAuth tokens
    // In a full implementation, you would use the Xbox Live API with proper authentication
    
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

