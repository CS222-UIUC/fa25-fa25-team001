/**
 * ============================================================================
 * ROUTE: Popular TV Shows API (OMDB)
 * ============================================================================
 * 
 * Endpoint: GET /api/tv/popular
 * Purpose: Fetch popular TV shows from OMDB API
 * 
 * Query Parameters:
 *   - limit (optional): Number of results (default: 20)
 * 
 * Returns: { success: true, shows: [...] }
 * 
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { searchMovies } from '@/lib/api/omdb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Search terms that tend to return popular TV shows
    const searchTerms = [
      '2024', // Recent year
      '2023',
      'series',
      'drama',
      'comedy',
    ];

    const allShows: Array<{
      Title: string;
      Year: string;
      imdbID: string;
      Type: string;
      Poster: string;
    }> = [];

    try {
      // Try multiple searches to get variety
      for (const term of searchTerms.slice(0, 3)) {
        try {
          const result = await searchMovies(term, 1);
          if (result.Search) {
            // Filter for TV shows with posters
            const showsWithPosters = result.Search.filter(
              s => s.Type === 'series' && s.Poster && s.Poster !== 'N/A'
            );
            allShows.push(...showsWithPosters);
          }
          if (allShows.length >= limit * 2) break;
        } catch (err) {
          // Continue to next search term if one fails
          continue;
        }
      }
    } catch (error) {
      console.error('Error fetching popular TV shows:', error);
    }

    // Remove duplicates and limit
    const uniqueShows = Array.from(
      new Map(allShows.map(s => [s.imdbID, s])).values()
    ).slice(0, limit);

    return NextResponse.json({
      success: true,
      shows: uniqueShows,
    });
  } catch (error: any) {
    console.error('Error fetching popular TV shows:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch popular TV shows',
      },
      { status: 500 }
    );
  }
}

