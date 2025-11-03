import { NextRequest, NextResponse } from 'next/server';
import { connectPlatform } from '@/actions/platform';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { exchangeNpssoForAccessCode, exchangeAccessCodeForAuthTokens } from 'psn-api';

/**
 * Connect a PlayStation account by NPSSO token
 * POST /api/platforms/psn/connect
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error('PSN Connect: Not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { npsso } = await request.json();
    console.log('PSN Connect: Received request for NPSSO token');

    if (!npsso) {
      return NextResponse.json({ error: 'NPSSO token required' }, { status: 400 });
    }

    // Exchange NPSSO for access code
    let accessCode;
    try {
      console.log('PSN Connect: Exchanging NPSSO for access code...');
      accessCode = await exchangeNpssoForAccessCode(npsso);
      console.log('PSN Connect: Got access code');
    } catch (error: any) {
      console.error('PSN Connect: Error exchanging NPSSO for access code:', error);
      const errorMessage = error?.message || 'Unknown error';
      return NextResponse.json(
        { error: `Invalid NPSSO token: ${errorMessage}` },
        { status: 400 }
      );
    }

    // Exchange access code for auth tokens
    let authorization;
    try {
      console.log('PSN Connect: Exchanging access code for auth tokens...');
      authorization = await exchangeAccessCodeForAuthTokens(accessCode);
      console.log('PSN Connect: Got auth tokens');
    } catch (error: any) {
      console.error('PSN Connect: Error exchanging access code for auth tokens:', error);
      const errorMessage = error?.message || 'Unknown error';
      return NextResponse.json(
        { error: `Failed to obtain authentication tokens: ${errorMessage}` },
        { status: 500 }
      );
    }

    // Verify the connection works by making a simple API call
    // We don't need to fetch titles here, just verify the token works
    
    // Store the connection with tokens
    // We'll use the user's account ID or a hash of their access token as platformUserId
    console.log('PSN Connect: Storing connection in database...');
    const result = await connectPlatform({
      platformType: 'playstation',
      platformUserId: authorization.accessToken.substring(0, 16), // Use first 16 chars as ID
      accessToken: authorization.accessToken,
      refreshToken: authorization.refreshToken,
      expiresAt: new Date(Date.now() + authorization.expiresIn * 1000), // expiresIn is in seconds
    });

    if (!result.success) {
      console.error('PSN Connect: Failed to store connection:', result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log('PSN Connect: Successfully stored connection');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error connecting PlayStation account:', error);
    return NextResponse.json(
      { error: 'Failed to connect PlayStation account' },
      { status: 500 }
    );
  }
}

