import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
    if (!session?.user?.id) {
      return NextResponse.redirect(`${baseUrl}/profile?error=unauthorized`);
    }

    // In a real implementation, this would redirect to Sony's OAuth page.
    // For now, we'll simulate a successful redirect to our callback.
    const redirectUri = `${baseUrl}/api/playstation/callback`;
    const state = Buffer.from(`${session.user.id}:${Date.now()}`).toString('base64');
    
    // Simulate Sony redirecting back with a code
    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set('code', 'dummy_psn_auth_code');
    callbackUrl.searchParams.set('state', state);
    
    return NextResponse.redirect(callbackUrl.toString());
  } catch (error) {
    console.error('PlayStation auth error:', error);
    const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}/profile?error=playstation_auth_failed`);
  }
}
