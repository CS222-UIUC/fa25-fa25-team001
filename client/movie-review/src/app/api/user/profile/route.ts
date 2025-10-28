import { NextRequest, NextResponse } from 'next/server';
import { updateUserProfile, getUserProfile } from '../server_actions';

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await updateUserProfile(data);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch (error) {
    console.error('Profile update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await getUserProfile();
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    return NextResponse.json({ success: true, user: result.user });
  } catch (error) {
    console.error('Profile get API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}