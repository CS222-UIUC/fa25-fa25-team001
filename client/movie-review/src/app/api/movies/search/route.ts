/**
 * ============================================================================
 * ROUTE: Movie Search API (OMDB)
 * ============================================================================
 * 
 * Endpoint: GET /api/movies/search
 * Purpose: Search for movies and TV shows using OMDB API
 * 
 * Query Parameters:
 *   - q (required): Search query string
 *   - page (optional): Page number (default: 1)
 * 
 * Returns: { success: true, movies: [...], totalResults: number, page: number }
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchMovies } from '@/lib/api/omdb';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    try {
      const data = await searchMovies(query, page);
      
      // Filter to only return movies (type='movie')
      const moviesOnly = (data.Search || []).filter((item: any) => item.Type === 'movie');

      return NextResponse.json({ 
        success: true, 
        movies: moviesOnly,
        totalResults: moviesOnly.length,
        page 
      });
    } catch (omdbError: any) {
      // Handle "no results" as a valid response, not an error
      if (omdbError?.message?.includes('not found') || omdbError?.message?.includes('Movie not found')) {
        return NextResponse.json({ 
          success: true, 
          movies: [],
          totalResults: 0,
          page 
        });
      }
      
      // For API key errors, return empty results instead of error
      if (omdbError?.message?.includes('API key not configured')) {
        return NextResponse.json({ 
          success: true, 
          movies: [],
          totalResults: 0,
          page 
        });
      }
      
      throw omdbError;
    }
  } catch (error: any) {
    console.error('Movie search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search movies' },
      { status: 500 }
    );
  }
}

