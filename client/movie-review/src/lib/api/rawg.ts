/**
 * RAWG.io API Integration
 * Documentation: https://rawg.io/apidocs
 */

const RAWG_API_BASE_URL = 'https://api.rawg.io/api';

export interface RawgGame {
  id: number;
  slug: string;
  name: string;
  ratio?: number;
  released?: string;
  tba?: boolean;
  background_image?: string;
  rating?: number;
  rating_top?: number;
  ratings?: Array<{
    id: number;
    title: string;
    count: number;
    percent: number;
  }>;
  ratings_count?: number;
  reviews_text_count?: number;
  added?: number;
  metacritic?: number;
  playtime?: number;
  suggestions_count?: number;
  updated?: string;
  platforms?: Array<{
    platform: {
      id: number;
      name: string;
      slug: string;
    };
    released_at?: string;
    requirements?: {
      minimum?: string;
      recommended?: string;
    };
  }>;
  developers?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  genres?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  tags?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  short_screenshots?: Array<{
    id: number;
    image: string;
  }>;
}

export interface RawgPlatform {
  id: number;
  name: string;
  slug: string;
}

export interface RawgResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export class RawgApi {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_RAWG_API_KEY || '';
    if (!this.apiKey) {
      console.warn('RAWG API key not provided');
    }
  }

  private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${RAWG_API_BASE_URL}${endpoint}`);
    url.searchParams.set('key', this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a list of platforms
   */
  async getPlatforms(): Promise<RawgPlatform[]> {
    const response = await this.fetch<RawgResponse<RawgPlatform>>('/platforms');
    return response.results;
  }

  /**
   * Search for games
   */
  async searchGames(query: string): Promise<RawgGame[]> {
    const response = await this.fetch<RawgResponse<RawgGame>>('/games', {
      search: query,
    });
    return response.results;
  }

  /**
   * Get games by date range and platforms
   */
  async getGames(params: {
    dates?: string; // Format: YYYY-MM-DD,YYYY-MM-DD
    platforms?: string; // Comma-separated platform IDs
    ordering?: string; // -rating, -metacritic, -released, etc.
    page?: string;
    page_size?: string;
  }): Promise<RawgGame[]> {
    const response = await this.fetch<RawgResponse<RawgGame>>('/games', params);
    return response.results;
  }

  /**
   * Get a specific game by ID
   */
  async getGameById(id: number): Promise<RawgGame> {
    return this.fetch<RawgGame>(`/games/${id}`);
  }

  /**
   * Get a game by slug
   */
  async getGameBySlug(slug: string): Promise<RawgGame> {
    return this.fetch<RawgGame>(`/games/${slug}`);
  }
}

export const rawgApi = new RawgApi();

