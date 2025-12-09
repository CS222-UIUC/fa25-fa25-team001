import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const title = searchParams.get('title');

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const omdbApiKey = process.env.OMDB_API_KEY;
    if (!omdbApiKey) {
      return NextResponse.json({ error: 'OMDB API key not configured' }, { status: 500 });
    }

    // Search movies from OMDB
    const response = await fetch(
      `http://www.omdbapi.com/?apikey=${omdbApiKey}&s=${encodeURIComponent(title)}&type=movie`
    );

    if (!response.ok) {
      throw new Error('OMDB API failed');
    }

    const data = await response.json();

    if (data.Response === 'False') {
      return NextResponse.json({ success: true, results: [] });
    }

    const results = (data.Search || []).map((movie: any) => ({
      id: movie.imdbID,
      title: movie.Title,
      year: movie.Year,
      poster: movie.Poster !== 'N/A' ? movie.Poster : null,
      type: movie.Type,
    }));

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Search movies error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search movies' },
      { status: 500 }
    );
  }
}
