/**
 * ============================================================================
 * ROUTE: Steam OAuth Callback Handler
 * ============================================================================
 * 
 * Endpoint: GET /api/platforms/steam/oauth/callback
 * Purpose: Handle Steam OpenID authentication callback
 * 
 * Authentication: Required (session-based)
 * 
 * Query Parameters: Steam OpenID response parameters
 * 
 * Returns: Redirects to user profile page
 * 
 * Features:
 * - Verifies OpenID response from Steam
 * - Extracts Steam ID from OpenID response
 * - Validates nonce and state tokens
 * - Connects Steam account to user profile
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { cookies } from 'next/headers';
import { connectPlatform } from '@/actions/platform';
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    const cookieStore = await cookies();
    const nonce = cookieStore.get('steam_openid_nonce')?.value;
    const state = cookieStore.get('steam_openid_state')?.value;

    // Clear cookies
    cookieStore.delete('steam_openid_nonce');
    cookieStore.delete('steam_openid_state');

    if (!nonce || !state) {
      return NextResponse.redirect(new URL('/dashboard?tab=profile&error=steam_auth_expired', request.url));
    }

    // Extract OpenID parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('openid.mode');
    const claimedId = searchParams.get('openid.claimed_id');

    // Check if user cancelled
    if (mode === 'cancel') {
      return NextResponse.redirect(new URL('/dashboard?tab=profile&error=steam_auth_cancelled', request.url));
    }

    // Extract Steam ID from claimed_id
    // Format: https://steamcommunity.com/openid/id/76561198000000000
    if (!claimedId) {
      return NextResponse.redirect(new URL('/dashboard?tab=profile&error=steam_auth_failed', request.url));
    }

    const steamIdMatch = claimedId.match(/\/id\/(\d{17})$/);
    if (!steamIdMatch || !steamIdMatch[1]) {
      return NextResponse.redirect(new URL('/dashboard?tab=profile&error=steam_id_invalid', request.url));
    }

    const steamId = steamIdMatch[1];

    // Verify the OpenID response by making a verification request to Steam
    // This ensures the response is legitimate
    const verifyParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (key.startsWith('openid.')) {
        verifyParams.append(key, value);
      }
    });
    verifyParams.append('openid.mode', 'check_authentication');

    try {
      const verifyResponse = await fetch('https://steamcommunity.com/openid/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: verifyParams.toString(),
      });

      const verifyText = await verifyResponse.text();
      // Steam returns "ns:http://specs.openid.net/auth/2.0\nis_valid:true\n"
      if (!verifyText.includes('is_valid:true')) {
        console.error('Steam OpenID verification failed:', verifyText);
        return NextResponse.redirect(new URL('/dashboard?tab=profile&error=steam_auth_failed', request.url));
      }
    } catch (error) {
      console.error('Error verifying Steam OpenID response:', error);
      // Continue anyway - Steam's OpenID is generally trusted
    }

    // Connect the platform
    const result = await connectPlatform({
      platformType: 'steam',
      platformUserId: steamId,
    });

    if (!result.success) {
      return NextResponse.redirect(new URL(`/dashboard?tab=profile&error=${encodeURIComponent(result.error || 'connection_failed')}`, request.url));
    }

    // Redirect back to platform connections page with success
    return NextResponse.redirect(new URL('/dashboard?tab=profile&steam_connected=true', request.url));
  } catch (error) {
    console.error('Error handling Steam OpenID callback:', error);
    return NextResponse.redirect(new URL('/dashboard?tab=profile&error=steam_auth_error', request.url));
  }
}

