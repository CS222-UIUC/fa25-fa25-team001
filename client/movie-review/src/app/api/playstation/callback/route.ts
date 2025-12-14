import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
    if (!session?.user?.id) {
      return NextResponse.redirect(`${baseUrl}/profile?error=unauthorized`);
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.redirect(`${baseUrl}/profile?error=playstation_invalid_callback`);
    }

    // Verify state (simplified)
    const decodedState = Buffer.from(state, 'base64').toString();
    const [userId] = decodedState.split(':');
    
    if (userId !== session.user.id) {
      return NextResponse.redirect(`${baseUrl}/profile?error=playstation_invalid_state`);
    }

    // In a real app, we would exchange the code for an access token here.
    // const tokenResponse = await fetch('https://ca.account.sony.com/api/authz/v3/oauth/token', ...);
    
    // Mock PSN User ID
    const psnUserId = `psn_${Math.random().toString(36).substring(7)}`;

    // Save connection
    await prisma.platform_connections.upsert({
      where: {
        userId_platformType: {
          userId: session.user.id,
          platformType: 'playstation'
        }
      },
      update: {
        platformUserId: psnUserId,
        accessToken: 'dummy_access_token',
        refreshToken: 'dummy_refresh_token',
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        id: `playstation_${session.user.id}`,
        userId: session.user.id,
        platformType: 'playstation',
        platformUserId: psnUserId,
        accessToken: 'dummy_access_token',
        refreshToken: 'dummy_refresh_token',
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    return NextResponse.redirect(`${baseUrl}/profile?success=playstation_connected`);
  } catch (error) {
    console.error('PlayStation callback error:', error);
    const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}/profile?error=playstation_connection_failed`);
  }
}
