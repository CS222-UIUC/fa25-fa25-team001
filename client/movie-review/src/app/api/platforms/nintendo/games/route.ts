import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

/**
 * GET /api/platforms/nintendo/games
 * Get user's Nintendo games (manual entry)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's Nintendo connection
    const connection = await prisma.platformConnection.findUnique({
      where: {
        userId_platformType: {
          userId: session.user.id,
          platformType: 'nintendo',
        },
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Nintendo account not connected' },
        { status: 400 }
      );
    }

    const games = (connection.gamesData as any)?.games || [];

    return NextResponse.json({
      success: true,
      games: games,
    });
  } catch (error) {
    console.error('Error fetching Nintendo games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Nintendo games' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/platforms/nintendo/games
 * Update user's Nintendo games (manual entry)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { games } = body;

    if (!Array.isArray(games)) {
      return NextResponse.json(
        { error: 'Games must be an array' },
        { status: 400 }
      );
    }

    // Get or create Nintendo connection
    let connection = await prisma.platformConnection.findUnique({
      where: {
        userId_platformType: {
          userId: session.user.id,
          platformType: 'nintendo',
        },
      },
    });

    if (!connection) {
      // Create connection if it doesn't exist
      connection = await prisma.platformConnection.create({
        data: {
          userId: session.user.id,
          platformType: 'nintendo',
          platformUserId: 'manual',
          gamesData: { games },
          lastSyncedAt: new Date(),
        },
      });
    } else {
      // Update existing connection
      await prisma.platformConnection.update({
        where: {
          userId_platformType: {
            userId: session.user.id,
            platformType: 'nintendo',
          },
        },
        data: {
          gamesData: { games },
          lastSyncedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      games: games,
    });
  } catch (error) {
    console.error('Error updating Nintendo games:', error);
    return NextResponse.json(
      { error: 'Failed to update Nintendo games' },
      { status: 500 }
    );
  }
}
