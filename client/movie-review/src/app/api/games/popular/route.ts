/**
 * ============================================================================
 * ROUTE: Popular Games API (IGDB)
 * ============================================================================
 * 
 * Endpoint: GET /api/games/popular
 * Purpose: Fetch popular/highly rated games from IGDB API
 * 
 * Query Parameters:
 *   - limit (optional): Number of results (default: 20)
 * 
 * Returns: { success: true, games: [...] }
 * 
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { getPopularGames, getCoverImageUrl } from '@/lib/api/igdb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const games = await getPopularGames(limit);

    // Format games with cover image URLs
    const formattedGames = games.map((game: any) => ({
      id: game.id,
      name: game.name,
      slug: game.slug,
      summary: game.summary,
      rating: game.rating ? (Math.round(Number(game.rating) * 10) / 10).toFixed(1) : null,
      cover: game.cover?.image_id ? getCoverImageUrl(game.cover.image_id, 'cover_big') : null,
      first_release_date: game.first_release_date,
    }));

    return NextResponse.json({
      success: true,
      games: formattedGames,
    });
  } catch (error: any) {
    console.error('Error fetching popular games:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch popular games',
      },
      { status: 500 }
    );
  }
}

