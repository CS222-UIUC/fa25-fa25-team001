import { NextRequest, NextResponse } from 'next/server';
import { searchMovies } from '@/lib/api/omdb';

/**
 * Search for movies using OMDB API
 * GET /api/movies/search?q=query&page=1
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    const data = await searchMovies(query, page);

    return NextResponse.json({ 
      success: true, 
      movies: data.Search,
      totalResults: parseInt(data.totalResults),
      page 
    });
  } catch (error: any) {
    console.error('OMDB search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search movies' },
      { status: 500 }
    );
  }
}

