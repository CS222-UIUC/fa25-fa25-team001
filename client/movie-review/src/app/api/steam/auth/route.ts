import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
  const steamAuthUrl = new URL('https://steamcommunity.com/openid/login');

  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': `${baseUrl}/api/steam/callback`,
    'openid.realm': baseUrl,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  steamAuthUrl.search = params.toString();

  return NextResponse.redirect(steamAuthUrl.toString());
}