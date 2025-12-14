/**
 * ============================================================================
 * ROUTE: TV Show Search API (OMDB)
 * ============================================================================
 * 
 * Endpoint: GET /api/tv/search
 * Purpose: Search for TV shows using OMDB API
 * 
 * Query Parameters:
 *   - q (required): Search query string
 *   - page (optional): Page number (default: 1)
 * 
 * Returns: { success: true, shows: [...], totalResults: number, page: number }
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

      // Filter to only return TV shows (type='series')
      const tvShowsOnly = (data.Search || []).filter((item: any) => item.Type === 'series');

      return NextResponse.json({ 
        success: true, 
        shows: tvShowsOnly,
        totalResults: tvShowsOnly.length,
        page 
      });
    } catch (omdbError: any) {
      // Handle "no results" as a valid response, not an error
      if (omdbError?.message?.includes('not found') || omdbError?.message?.includes('Movie not found')) {
        return NextResponse.json({ 
          success: true, 
          shows: [],
          totalResults: 0,
          page 
        });
      }
      
      // For API key errors, return empty results instead of error
      if (omdbError?.message?.includes('API key not configured')) {
        return NextResponse.json({ 
          success: true, 
          shows: [],
          totalResults: 0,
          page 
        });
      }
      
      throw omdbError;
    }
  } catch (error: any) {
    console.error('TV show search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search TV shows' },
      { status: 500 }
    );
  }
}


