/**
 * ============================================================================
 * ROUTE: Movies by Genre API (OMDB)
 * ============================================================================
 * 
 * Endpoint: GET /api/movies/genre
 * Purpose: Fetch movies by genre from OMDB API
 * 
 * Query Parameters:
 *   - genre (required): Genre name
 *   - limit (optional): Number of results (default: 20)
 * 
 * Returns: { success: true, movies: [...] }
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchMoviesByGenre } from '@/lib/api/omdb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!genre) {
      return NextResponse.json({ error: 'Genre parameter required' }, { status: 400 });
    }

    const movies = await searchMoviesByGenre(genre, limit);

    return NextResponse.json({
      success: true,
      movies: movies,
    });
  } catch (error: any) {
    console.error('Error fetching movies by genre:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch movies by genre',
      },
      { status: 500 }
    );
  }
}

