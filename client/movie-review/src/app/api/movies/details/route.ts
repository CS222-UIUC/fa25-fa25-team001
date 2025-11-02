import { NextRequest, NextResponse } from 'next/server';
import { getMovieById } from '@/lib/api/omdb';

/**
 * Get movie details by IMDb ID
 * GET /api/movies/details?id=tt0111161
 */
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

