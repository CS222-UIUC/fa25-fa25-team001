/**
 * IGDB API Client for fetching video game data
 * Uses Twitch OAuth for authentication
 */

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || '';
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || '';
const IGDB_API_URL = 'https://api.igdb.com/v4';

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * Get OAuth access token from Twitch
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
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
  
  // Cache token (expires in ~60 days, but we'll refresh after 50 days to be safe)
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 10 * 24 * 60 * 60) * 1000, // 10 days buffer
  };

  return data.access_token;
}

/**
 * Make a request to IGDB API
 */
async function igdbRequest<T>(endpoint: string, body: string): Promise<T[]> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${IGDB_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!response.ok) {
    // Get error details for debugging
    const errorText = await response.text().catch(() => '');
    console.error('IGDB API error:', response.status, response.statusText);
    console.error('Request body:', body);
    console.error('Error response:', errorText);
    throw new Error(`IGDB API error: ${response.statusText}${errorText ? ` - ${errorText.substring(0, 200)}` : ''}`);
  }

  return response.json();
}

/**
 * Search for games using IGDB's search function
 */
export async function searchGames(query: string, limit: number = 24) {
  const cleanQuery = query.trim().replace(/["']/g, '').trim();
  
  if (!cleanQuery) {
    throw new Error('Search query cannot be empty');
  }
  
  const escapedQuery = cleanQuery.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  
  const body = `
    search "${escapedQuery}";
    fields id,name,slug,summary,genres.name,platforms.name,platforms.id,rating,cover.image_id,
           release_dates.date,first_release_date;
    limit ${limit};
  `.trim();
  
  const results = await igdbRequest<{
    id: number;
    name: string;
    slug: string;
    summary?: string;
    genres?: Array<{ name: string }>;
    platforms?: Array<{ name: string }>;
    rating?: number;
    cover?: { image_id: string };
    release_dates?: Array<{ date: number }>;
    first_release_date?: number;
  }>('/games', body);
  
  // Sort by rating (highest first), then by name
  results.sort((a, b) => {
    if ((b.rating || 0) !== (a.rating || 0)) {
      return (b.rating || 0) - (a.rating || 0);
    }
    return a.name.localeCompare(b.name);
  });
  
  return results.slice(0, limit);
}

/**
 * Get game by ID
 */
export async function getGame(gameId: number) {
  const body = `
    fields id,name,slug,summary,genres.name,platforms.name,rating,rating_count,
           cover.image_id,release_dates.date,first_release_date,storyline;
    where id = ${gameId};
  `.trim();

  const games = await igdbRequest('/games', body);
  return games[0];
}

/**
 * Get game cover image URL
 */
export function getCoverImageUrl(imageId: string | undefined, size: 'cover_small' | 'cover_big' | 'screenshot_med' = 'cover_big'): string {
  if (!imageId) return '';
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

/**
 * Get popular games
 */
export async function getPopularGames(limit: number = 20) {
  const body = `
    fields id,name,slug,summary,rating,cover.image_id,first_release_date;
    where rating > 70 & cover != null;
    sort rating desc;
    limit ${limit};
  `.trim();

  return igdbRequest('/games', body);
}

