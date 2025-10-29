import { NextRequest, NextResponse } from 'next/server';
import { connectPlatform } from '@/actions/platform';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Connect a Steam account by Steam ID
 * POST /api/platforms/steam/connect
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { steamId } = await request.json();

    if (!steamId) {
      return NextResponse.json({ error: 'Steam ID required' }, { status: 400 });
    }

    const result = await connectPlatform({
      platformType: 'steam',
      platformUserId: steamId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error connecting Steam account:', error);
    return NextResponse.json(
      { error: 'Failed to connect Steam account' },
      { status: 500 }
    );
  }
}

