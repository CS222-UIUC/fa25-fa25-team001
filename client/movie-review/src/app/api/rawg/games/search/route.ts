import { NextRequest, NextResponse } from 'next/server';
import { RawgApi } from '@/lib/api';

const rawgApi = new RawgApi();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    const games = await rawgApi.searchGames(query);
    return NextResponse.json({ success: true, data: games });
  } catch (error) {
    console.error('Error searching games:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search games' },
      { status: 500 }
    );
  }
}

