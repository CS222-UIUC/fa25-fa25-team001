import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

/**
 * POST /api/platforms/nintendo/connect
 * Connect Nintendo account (manual entry - no API needed)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if connection already exists
    const existing = await prisma.platformConnection.findUnique({
      where: {
        userId_platformType: {
          userId: session.user.id,
          platformType: 'nintendo',
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Nintendo already connected' }, { status: 400 });
    }

    // Create connection (no API credentials needed for manual entry)
    await prisma.platformConnection.create({
      data: {
        userId: session.user.id,
        platformType: 'nintendo',
        platformUserId: 'manual',
        gamesData: { games: [] },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Nintendo account connected. You can now manually add games!',
    });
  } catch (error) {
    console.error('Error connecting Nintendo:', error);
    return NextResponse.json(
      { error: 'Failed to connect Nintendo account' },
      { status: 500 }
    );
  }
}
