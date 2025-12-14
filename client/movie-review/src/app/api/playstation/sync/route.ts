import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const existing = await prisma.platform_connections.findUnique({
      where: {
        userId_platformType: {
          userId: session.user.id,
          platformType: 'playstation'
        }
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'PlayStation account not connected' },
        { status: 400 }
      );
    }

    // Mock PlayStation Games Data
    const mockPsnGames = [
      { title: "God of War Ragnarök", trophies: { platinum: 1, gold: 4, silver: 15, bronze: 20 }, progress: 100, image: "https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png" },
      { title: "The Last of Us Part II", trophies: { platinum: 0, gold: 2, silver: 8, bronze: 15 }, progress: 65, image: "https://image.api.playstation.com/vulcan/ap/rnd/202006/0915/J5LLN9a9149IaDHSP4X80DxC.png" },
      { title: "Spider-Man 2", trophies: { platinum: 1, gold: 2, silver: 10, bronze: 25 }, progress: 100, image: "https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/1c7b75d8ed9271516546560d219ad0b22ee0a263b4537d9e.png" },
      { title: "Horizon Forbidden West", trophies: { platinum: 0, gold: 1, silver: 5, bronze: 10 }, progress: 40, image: "https://image.api.playstation.com/vulcan/ap/rnd/202107/3100/HO8jkBiPIHzham8RIcb5ECEd.png" }
    ];

    await prisma.platform_connections.update({
      where: { id: existing.id },
      data: {
        lastSyncedAt: new Date(),
        gamesData: mockPsnGames,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PlayStation sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync PlayStation account' },
      { status: 500 }
    );
  }
}
