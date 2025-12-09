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

    // Search TV shows from OMDB
    const response = await fetch(
      `http://www.omdbapi.com/?apikey=${omdbApiKey}&s=${encodeURIComponent(title)}&type=series`
    );

    if (!response.ok) {
      throw new Error('OMDB API failed');
    }

    const data = await response.json();

    if (data.Response === 'False') {
      return NextResponse.json({ success: true, results: [] });
    }

    const results = (data.Search || []).map((show: any) => ({
      id: show.imdbID,
      title: show.Title,
      year: show.Year,
      poster: show.Poster !== 'N/A' ? show.Poster : null,
      type: show.Type,
    }));

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Search TV shows error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search TV shows' },
      { status: 500 }
    );
  }
}
