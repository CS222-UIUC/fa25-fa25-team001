import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const apiKey = process.env.RAWG_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'RAWG API key not configured' }, { status: 500 });
    }

    // RAWG API search
    const response = await fetch(
      `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=${limit}&search_precise=true`
    );

    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status}`);
    }

    const data = await response.json();
    const games = data.results || [];

    // Transform the data to make it easier to use
    const transformedGames = games
      .filter((game: any) => game.background_image) // only games with images
      .map((game: any) => ({
        id: game.id,
        name: game.name,
        cover: game.background_image || null,
        rating: game.rating ? Math.round(game.rating) : null,
        ratingCount: game.ratings_count || 0,
        releaseDate: game.released ? new Date(game.released) : null,
        platforms: game.platforms?.map((p: any) => p.platform.name) || [],
        genres: game.genres?.map((g: any) => g.name) || [],
        summary: game.description_raw || null,
      }));

    return NextResponse.json({ games: transformedGames });
  } catch (error) {
    console.error('RAWG Search Error:', error);
    return NextResponse.json(
      { error: 'Failed to search games' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { gameIds } = await request.json();

    if (!gameIds || !Array.isArray(gameIds)) {
      return NextResponse.json({ error: 'Game IDs array is required' }, { status: 400 });
    }

    const apiKey = process.env.RAWG_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'RAWG API key not configured' }, { status: 500 });
    }

    // Get detailed game information from RAWG
    const games = await Promise.all(
      gameIds.map(async (id: number) => {
        const response = await fetch(`https://api.rawg.io/api/games/${id}?key=${apiKey}`);
        if (!response.ok) return null;
        return response.json();
      })
    );

    const validGames = games.filter((game: any) => game !== null);

    // Transform the detailed data
    const transformedGames = validGames.map((game: any) => ({
      id: game.id,
      name: game.name,
      cover: game.background_image || null,
      rating: game.rating ? Math.round(game.rating) : null,
      ratingCount: game.ratings_count || 0,
      releaseDate: game.released ? new Date(game.released) : null,
      platforms: game.platforms?.map((p: any) => p.platform.name) || [],
      genres: game.genres?.map((g: any) => g.name) || [],
      summary: game.description_raw || null,
      screenshots: game.short_screenshots?.map((s: any) => s.image) || [],
    }));

    return NextResponse.json({ games: transformedGames });
  } catch (error) {
    console.error('RAWG Details Error:', error);
    return NextResponse.json(
      { error: 'Failed to get game details' },
      { status: 500 }
    );
  }
}

