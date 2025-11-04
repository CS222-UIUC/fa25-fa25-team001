/**
 * ============================================================================
 * ROUTE: Platform Disconnection API
 * ============================================================================
 * 
 * Endpoint: DELETE /api/platforms/disconnect
 * Purpose: Disconnect a platform account from user's profile
 * 
 * Authentication: Required (session-based)
 * 
 * Query Parameters:
 *   - platformType (required): Platform to disconnect ('steam', 'playstation', 'xbox')
 * 
 * Returns: { success: true }
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { disconnectPlatform } from '@/actions/platform';
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platformType = searchParams.get('platformType');

    if (!platformType) {
      return NextResponse.json({ error: 'Platform type required' }, { status: 400 });
    }

    const result = await disconnectPlatform(platformType);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting platform:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect platform' },
      { status: 500 }
    );
  }
}

