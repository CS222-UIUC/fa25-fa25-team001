import { NextResponse } from 'next/server';
import { getPopularMovies } from '@/lib/api/omdb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const movies = await getPopularMovies(limit);

    return NextResponse.json({
      success: true,
      movies: movies,
    });
  } catch (error: any) {
    console.error('Error fetching popular movies:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch popular movies',
      },
      { status: 500 }
    );
  }
}

