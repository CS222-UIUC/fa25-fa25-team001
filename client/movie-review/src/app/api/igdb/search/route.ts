import { NextRequest, NextResponse } from 'next/server';
import { searchGames, getCoverImageUrl } from '@/lib/api/igdb';

/**
 * Search for games using IGDB API
 * GET /api/igdb/search?q=query&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    const games = await searchGames(query, limit);

    // Format games with cover images
    const formattedGames = games.map(game => ({
      id: game.id,
      name: game.name,
      slug: game.slug,
      summary: game.summary,
      rating: game.rating?.toFixed(1),
      cover: getCoverImageUrl(game.cover?.image_id),
      genres: game.genres?.map(g => g.name) || [],
      platforms: game.platforms?.map(p => p.name) || [],
      releaseDate: game.first_release_date 
        ? new Date(game.first_release_date * 1000).toISOString() 
        : null,
    }));

    return NextResponse.json({ success: true, games: formattedGames });
  } catch (error) {
    console.error('IGDB search error:', error);
    return NextResponse.json(
      { error: 'Failed to search games' },
      { status: 500 }
    );
  }
}

