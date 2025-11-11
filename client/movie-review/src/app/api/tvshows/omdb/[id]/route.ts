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

    // Fetch TV show details from OMDB
    const response = await fetch(
      `http://www.omdbapi.com/?apikey=${omdbApiKey}&i=${id}&plot=full`
    );

    if (!response.ok) {
      throw new Error('OMDB API failed');
    }

    const data = await response.json();

    if (data.Response === 'False') {
      return NextResponse.json({ error: 'TV show not found' }, { status: 404 });
    }

    const show = {
      id: data.imdbID,
      title: data.Title,
      year: data.Year,
      genre: data.Genre,
      creator: data.Writer,
      plot: data.Plot,
      poster: data.Poster !== 'N/A' ? data.Poster : null,
      rating: data.imdbRating !== 'N/A' ? parseFloat(data.imdbRating) : null,
      actors: data.Actors,
    };

    return NextResponse.json({ success: true, show });
  } catch (error: any) {
    console.error('Get OMDB TV show error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get TV show' },
      { status: 500 }
    );
  }
}

