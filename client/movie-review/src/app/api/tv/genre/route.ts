/**
 * ============================================================================
 * ROUTE: TV Shows by Genre API (OMDB)
 * ============================================================================
 * 
 * Endpoint: GET /api/tv/genre
 * Purpose: Fetch TV shows by genre from OMDB API
 * 
 * Query Parameters:
 *   - genre (required): Genre name
 *   - limit (optional): Number of results (default: 20)
 * 
 * Returns: { success: true, shows: [...] }
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchTvShowsByGenre } from '@/lib/api/omdb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!genre) {
      return NextResponse.json({ error: 'Genre parameter required' }, { status: 400 });
    }

    const shows = await searchTvShowsByGenre(genre, limit);

    return NextResponse.json({
      success: true,
      shows: shows,
    });
  } catch (error: any) {
    console.error('Error fetching TV shows by genre:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch TV shows by genre',
      },
      { status: 500 }
    );
  }
}

