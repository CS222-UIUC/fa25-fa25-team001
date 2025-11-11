import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const omdbApiKey = process.env.OMDB_API_KEY;
    if (!omdbApiKey) {
      return NextResponse.json({ error: 'OMDB API key not configured' }, { status: 500 });
    }

    // Fetch movie details from OMDB
    const response = await fetch(
      `http://www.omdbapi.com/?apikey=${omdbApiKey}&i=${id}&plot=full`
    );

    if (!response.ok) {
      throw new Error('OMDB API failed');
    }

    const data = await response.json();

    if (data.Response === 'False') {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    const movie = {
      id: data.imdbID,
      title: data.Title,
      year: parseInt(data.Year) || null,
      genre: data.Genre || null,
      director: data.Director || null,
      plot: data.Plot || null,
      poster: data.Poster !== 'N/A' ? data.Poster : null,
      rating: data.imdbRating !== 'N/A' ? parseFloat(data.imdbRating) : null,
      runtime: data.Runtime || null,
      actors: data.Actors || null,
    };

    return NextResponse.json({ success: true, movie });
  } catch (error: any) {
    console.error('Get OMDB movie error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get movie' },
      { status: 500 }
    );
  }
}

