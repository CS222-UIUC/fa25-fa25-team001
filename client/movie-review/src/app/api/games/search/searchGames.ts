/**
 * ============================================================================
 * ROUTE: Game Search API (IGDB)
 * ============================================================================
 * 
 * Endpoint: GET /api/games/search
 * Purpose: Search for video games using IGDB API with Twitch OAuth
 * 
 * Query Parameters:
 *   - q (required): Search query string
 *   - limit (optional): Number of results (default: 20)
 * 
 * Returns: { success: true, games: [...] }
 * 
 * Also supports:
 * - POST /api/games/search: Get detailed game information by IDs
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';

let accessToken: string | null = null;

let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  // Check if we have a valid token
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  // Get new token from Twitch
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get Twitch OAuth token');
  }

  const data = await response.json();
  accessToken = data.access_token;
  // Set expiry to 5 minutes before actual expiry for safety
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

  return accessToken!;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    // IGDB API query - search for games with images and ratings
    const igdbQuery = `
      fields name, cover.url, rating, rating_count, first_release_date, platforms.name, genres.name, summary;
      search "${query}";
      where rating != null & cover != null;
      limit ${limit};
    `;

    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID!,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
      },
      body: igdbQuery,
    });

    if (!response.ok) {
      throw new Error(`IGDB API error: ${response.status}`);
    }

    const games = await response.json();

    // Transform the data to make it easier to use
    const transformedGames = games.map((game: any) => ({
      id: game.id,
      name: game.name,
      cover: game.cover ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
      rating: game.rating ? Math.round(game.rating).toString() : null,
      ratingCount: game.rating_count || 0,
      releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString() : null,
      platforms: game.platforms?.map((p: any) => p.name) || [],
      genres: game.genres?.map((g: any) => g.name) || [],
      summary: game.summary || null,
    }));

    return NextResponse.json({ success: true, games: transformedGames });
  } catch (error) {
    console.error('IGDB Search Error:', error);
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

    const accessToken = await getAccessToken();

    // Get detailed game information
    const igdbQuery = `
      fields name, cover.url, rating, rating_count, first_release_date, platforms.name, genres.name, summary, screenshots.url;
      where id = (${gameIds.join(',')});
    `;

    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID!,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
      },
      body: igdbQuery,
    });

    if (!response.ok) {
      throw new Error(`IGDB API error: ${response.status}`);
    }

    const games = await response.json();

    // Transform the detailed data
    const transformedGames = games.map((game: any) => ({
      id: game.id,
      name: game.name,
      cover: game.cover ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
      rating: game.rating ? Math.round(game.rating).toString() : null,
      ratingCount: game.rating_count || 0,
      releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString() : null,
      platforms: game.platforms?.map((p: any) => p.name) || [],
      genres: game.genres?.map((g: any) => g.name) || [],
      summary: game.summary || null,
      screenshots: game.screenshots?.map((s: any) => `https:${s.url.replace('t_thumb', 't_screenshot_med')}`) || [],
    }));

    return NextResponse.json({ games: transformedGames });
  } catch (error) {
    console.error('IGDB Details Error:', error);
    return NextResponse.json(
      { error: 'Failed to get game details' },
      { status: 500 }
    );
  }
}

