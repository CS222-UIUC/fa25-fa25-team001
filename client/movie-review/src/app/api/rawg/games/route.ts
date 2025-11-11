import { NextRequest, NextResponse } from 'next/server';
import { RawgApi } from '@/lib/api';

const rawgApi = new RawgApi();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const params: Record<string, string> = {};
    
    // Get all query parameters
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const games = await rawgApi.getGames(params);
    return NextResponse.json({ success: true, data: games });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}

