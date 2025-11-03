import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

/**
 * Steam OpenID Authentication Initiation
 * GET /api/platforms/steam/oauth
 * 
 * Redirects user to Steam's OpenID login page
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // Generate random nonce for security
    const nonce = randomBytes(16).toString('hex');
    const state = randomBytes(16).toString('hex');

    // Store nonce and state in cookies for verification
    const cookieStore = await cookies();
    cookieStore.set('steam_openid_nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });
    cookieStore.set('steam_openid_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    // Build Steam OpenID URL
    const returnUrl = new URL('/api/platforms/steam/oauth/callback', request.url);
    const realm = new URL('/', request.url).origin;

    const steamOpenIdUrl = new URL('https://steamcommunity.com/openid/login');
    steamOpenIdUrl.searchParams.set('openid.ns', 'http://specs.openid.net/auth/2.0');
    steamOpenIdUrl.searchParams.set('openid.mode', 'checkid_setup');
    steamOpenIdUrl.searchParams.set('openid.return_to', returnUrl.toString());
    steamOpenIdUrl.searchParams.set('openid.realm', realm);
    steamOpenIdUrl.searchParams.set('openid.claimed_id', 'http://specs.openid.net/auth/2.0/identifier_select');
    steamOpenIdUrl.searchParams.set('openid.identity', 'http://specs.openid.net/auth/2.0/identifier_select');

    return NextResponse.redirect(steamOpenIdUrl.toString());
  } catch (error) {
    console.error('Error initiating Steam OpenID:', error);
    return NextResponse.redirect(new URL('/user/profile?error=steam_auth_failed', request.url));
  }
}

