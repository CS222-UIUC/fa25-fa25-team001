import { NextResponse } from 'next/server';
import { RawgApi } from '@/lib/api';

const rawgApi = new RawgApi();

export async function GET() {
  try {
    const platforms = await rawgApi.getPlatforms();
    return NextResponse.json({ success: true, data: platforms });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch platforms' },
      { status: 500 }
    );
  }
}

