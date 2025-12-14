/**
 * ============================================================================
 * ROUTE: Games by Genre API (IGDB)
 * ============================================================================
 * 
 * Endpoint: GET /api/games/genre
 * Purpose: Fetch games by genre from IGDB API
 * 
 * Query Parameters:
 *   - genre (required): Genre name
 *   - limit (optional): Number of results (default: 20)
 * 
 * Returns: { success: true, games: [...] }
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchGamesByGenre, getCoverImageUrl } from '@/lib/api/igdb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!genre) {
      return NextResponse.json({ error: 'Genre parameter required' }, { status: 400 });
    }

    const games = await searchGamesByGenre(genre, limit);

    // Format games with cover image URLs, platforms, and genres
    const formattedGames = games.map((game: any) => ({
      id: game.id,
      name: game.name,
      slug: game.slug,
      summary: game.summary,
      rating: game.rating ? (Math.round(Number(game.rating) * 10) / 10).toFixed(1) : null,
      cover: game.cover?.image_id ? getCoverImageUrl(game.cover.image_id, 'cover_big') : null,
      releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString() : null,
      platforms: game.platforms?.map((p: any) => p.name) || [],
      genres: game.genres?.map((g: any) => g.name) || [],
    }));

    return NextResponse.json({
      success: true,
      games: formattedGames,
    });
  } catch (error: any) {
    console.error('Error fetching games by genre:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch games by genre',
      },
      { status: 500 }
    );
  }
}

