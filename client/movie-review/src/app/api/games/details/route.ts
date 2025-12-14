/**
 * ============================================================================
 * ROUTE: Game Details API (IGDB)
 * ============================================================================
 * 
 * Endpoint: GET /api/games/details
 * Purpose: Fetch game details (cover, year) from IGDB by game IDs
 * 
 * Query Parameters:
 *   - ids (required): Comma-separated list of game IDs
 * 
 * Returns: { success: true, games: [...] }
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCoverImageUrl } from '@/lib/api/igdb';

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || '';
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || '';

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt) {
    return cachedAccessToken.token;
  }

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get Twitch access token');
  }

  const data = await response.json();
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 10 * 24 * 60 * 60) * 1000,
  };

  return cachedAccessToken.token;
}

async function getGameDetails(gameIds: string[], titles?: string[]): Promise<any[]> {
  const accessToken = await getAccessToken();
  
  // First, try to fetch by IDs
  const numericIds = gameIds.filter(id => !isNaN(Number(id)) && Number(id) > 0);
  let games: any[] = [];
  
  if (numericIds.length > 0) {
    const body = `
      fields id,name,cover.image_id,first_release_date;
      where id = (${numericIds.join(',')});
    `.trim();

    try {
      const response = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: {
          'Client-ID': TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/plain',
        },
        body,
      });

      if (response.ok) {
        games = await response.json();
      }
    } catch (error) {
      console.error('Error fetching games by ID:', error);
    }
  }

  // If we have titles and some games weren't found, try searching by title
  if (titles && titles.length > 0) {
    const foundIds = new Set(games.map(g => String(g.id)));
    const missingTitles = titles.filter((title, index) => {
      const id = gameIds[index];
      return !foundIds.has(id);
    });

    for (const title of missingTitles) {
      try {
        const searchBody = `
          search "${title.replace(/"/g, '\\"')}";
          fields id,name,cover.image_id,first_release_date;
          limit 1;
        `.trim();

        const response = await fetch('https://api.igdb.com/v4/games', {
          method: 'POST',
          headers: {
            'Client-ID': TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'text/plain',
          },
          body: searchBody,
        });

        if (response.ok) {
          const searchResults = await response.json();
          if (searchResults.length > 0) {
            games.push(searchResults[0]);
          }
        }
      } catch (error) {
        console.error(`Error searching for game "${title}":`, error);
      }
    }
  }

  return games;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    const titlesParam = searchParams.get('titles');

    if (!idsParam && !titlesParam) {
      return NextResponse.json({ error: 'ids or titles parameter required' }, { status: 400 });
    }

    const gameIds = idsParam ? idsParam.split(',').filter(id => id.trim()) : [];
    const titles = titlesParam ? titlesParam.split(',').map(t => t.trim()).filter(t => t) : [];
    
    if (gameIds.length === 0 && titles.length === 0) {
      return NextResponse.json({ success: true, games: [] });
    }

    const games = await getGameDetails(gameIds, titles.length > 0 ? titles : undefined);

    // Create a map that can match by both ID and title
    const gamesMap: Record<string, { cover?: string; year?: number }> = {};
    
    games.forEach((game: any) => {
      const gameId = String(game.id);
      gamesMap[gameId] = {
        cover: game.cover?.image_id ? getCoverImageUrl(game.cover.image_id, 'cover_big') : undefined,
        year: game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : undefined,
      };
      
      // Also map by title if we have titles
      if (titles.length > 0) {
        const matchingTitle = titles.find(t => t.toLowerCase() === game.name.toLowerCase());
        if (matchingTitle) {
          gamesMap[matchingTitle] = gamesMap[gameId];
        }
      }
    });

    return NextResponse.json({
      success: true,
      games: gamesMap,
    });
  } catch (error: any) {
    console.error('Error fetching game details:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch game details',
      },
      { status: 500 }
    );
  }
}

