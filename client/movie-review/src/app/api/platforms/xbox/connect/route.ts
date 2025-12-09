/**
 * ============================================================================
 * ROUTE: Xbox Platform Connection API
 * ============================================================================
 * 
 * Endpoint: POST /api/platforms/xbox/connect
 * Purpose: Connect a user's Xbox account to their profile
 * 
 * Authentication: Required (session-based)
 * 
 * Request Body: { xboxUserId: string }
 * 
 * Returns: { success: true }
 * 
 * Status: Basic implementation - May require OAuth for full functionality
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectPlatform } from '@/actions/platform';
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

