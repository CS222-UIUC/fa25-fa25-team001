/**
 * ============================================================================
 * ROUTE: Movie Details API (OMDB)
 * ============================================================================
 * 
 * Endpoint: GET /api/movies/details
 * Purpose: Get detailed information about a specific movie by IMDb ID
 * 
 * Query Parameters:
 *   - id (required): IMDb ID (e.g., "tt0111161")
 * 
 * Returns: { success: true, movie: {...} }
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMovieById } from '@/lib/api/omdb';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID parameter required' }, { status: 400 });
    }

    const movie = await getMovieById(id);

    return NextResponse.json({ success: true, movie });
  } catch (error: any) {
    console.error('OMDB details error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get movie details' },
      { status: 500 }
    );
  }
}

