import { NextRequest, NextResponse } from 'next/server';
import { connectPlatform } from '@/actions/platform';

/**
 * Connect an Xbox account by Xbox User ID
 * POST /api/platforms/xbox/connect
 */
export async function POST(request: NextRequest) {
  try {
    const { xboxUserId } = await request.json();

    if (!xboxUserId) {
      return NextResponse.json({ error: 'Xbox User ID required' }, { status: 400 });
    }

    const result = await connectPlatform({
      platformType: 'xbox',
      platformUserId: xboxUserId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error connecting Xbox account:', error);
    return NextResponse.json(
      { error: 'Failed to connect Xbox account' },
      { status: 500 }
    );
  }
}

