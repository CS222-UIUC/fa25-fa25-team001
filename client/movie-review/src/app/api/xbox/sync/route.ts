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

    // Get existing connection
    const connection = await platformQueries.getXboxConnection(session.user.id);
    if (!connection || !connection.platformUserId) {
      return NextResponse.json({ error: 'Xbox connection not found' }, { status: 404 });
    }

    // Mock Xbox games data
    const mockGames = [
      {
        titleId: '1',
        name: 'Halo Infinite',
        platform: 'Xbox Series X',
        image: 'https://upload.wikimedia.org/wikipedia/en/1/14/Halo_Infinite.png',
        playtime_forever: 3200, // minutes
        progress: 45,
        lastPlayed: new Date().toISOString()
      },
      {
        titleId: '2',
        name: 'Forza Horizon 5',
        platform: 'Xbox Series X',
        image: 'https://upload.wikimedia.org/wikipedia/en/8/86/Forza_Horizon_5_cover_art.jpg',
        playtime_forever: 5400, // minutes
        progress: 70,
        lastPlayed: new Date(Date.now() - 86400000).toISOString()
      },
      {
        titleId: '3',
        name: 'Starfield',
        platform: 'Xbox Series X',
        image: 'https://upload.wikimedia.org/wikipedia/en/6/6d/Starfield_cover_art.jpg',
        playtime_forever: 7200, // minutes
        progress: 30,
        lastPlayed: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    // Update connection with mock games data
    await platformQueries.upsertXboxConnection(session.user.id, connection.platformUserId, mockGames);

    return NextResponse.json({ 
      success: true, 
      gamesCount: mockGames.length,
      lastSynced: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Xbox sync error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to sync Xbox games' 
    }, { status: 500 });
  }
}

