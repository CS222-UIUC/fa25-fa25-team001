import { NextRequest, NextResponse } from 'next/server';
import { howlongtobeatClient } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameName = searchParams.get('q');

    if (!gameName) {
      return NextResponse.json(
        { success: false, error: 'Game name is required' },
        { status: 400 }
      );
    }

    const results = await howlongtobeatClient.searchGame(gameName);
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Error searching HowLongToBeat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search game completion times' },
      { status: 500 }
    );
  }
}

