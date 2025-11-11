import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=unauthorized`);
    }

    const clientId = process.env.XBOX_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/xbox/callback`;
    
    if (!clientId) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=xbox_config_missing`);
    }

    // Generate state for CSRF protection
    const state = Buffer.from(`${session.user.id}:${Date.now()}`).toString('base64');
    
    // Microsoft OAuth 2.0 authorization endpoint
    const authUrl = new URL('https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize');
    
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: 'XboxLive.signin XboxLive.offline_access',
      state: state,
    });

    authUrl.search = params.toString();
    
    // Store state in session/cookie for verification (simplified - in production use proper session storage)
    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set('xbox_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });
    
    return response;
  } catch (error) {
    console.error('Xbox auth error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=xbox_auth_failed`);
  }
}

