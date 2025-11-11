import { NextRequest, NextResponse } from 'next/server';
import { searchGames, getCoverImageUrl } from '@/lib/api/igdb';
import { searchMovies } from '@/lib/api/omdb';

/**
 * GET /api/search?type=games|movies|tv&q=query
 * Search for games, movies, or TV shows
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const query = searchParams.get('q');

    if (!type || !query) {
      return NextResponse.json(
        { error: 'Type and query parameters are required' },
        { status: 400 }
      );
    }

    if (type === 'games') {
      const platformFilter = searchParams.get('platform'); // 'nintendo' for Nintendo Switch
      const results = await searchGames(query, 10);
      
      // Filter for Nintendo Switch games if platform=nintendo
      let filteredResults = results;
      if (platformFilter === 'nintendo') {
        // IGDB platform ID for Nintendo Switch is 130
        // Also check for "Nintendo Switch" in the platform name
        filteredResults = results.filter((game: any) => {
          if (!game.platforms || !Array.isArray(game.platforms) || game.platforms.length === 0) {
            return false;
          }
          
          return game.platforms.some((platform: any) => {
            // Check by platform ID (130 = Nintendo Switch)
            const platformId = typeof platform === 'number' ? platform : (platform.id || platform);
            if (platformId === 130) return true;
            
            // Also check by platform name (case-insensitive)
            const platformName = typeof platform === 'string' ? platform : (platform.name || '');
            if (platformName.toLowerCase().includes('nintendo switch')) return true;
            
            return false;
          });
        });
      }
      
      const formatted = filteredResults.map((game: any) => ({
        id: game.id.toString(),
        title: game.name,
        posterUrl: game.cover ? getCoverImageUrl(game.cover.image_id, 'cover_big') : '',
        igdbId: game.id,
        year: game.first_release_date
          ? new Date(game.first_release_date * 1000).getFullYear()
          : undefined,
      }));
      return NextResponse.json({ success: true, results: formatted });
    } else if (type === 'movies' || type === 'tv') {
      const results = await searchMovies(query, 1);
      const allResults = (results as any).Search || [];
      const filtered = type === 'movies'
        ? allResults.filter((item: any) => item.Type === 'movie')
        : allResults.filter((item: any) => item.Type === 'series');
      
      const formatted = filtered.map((item: any) => ({
        id: item.imdbID,
        title: item.Title,
        posterUrl: item.Poster !== 'N/A' ? item.Poster : '',
        year: parseInt(item.Year) || undefined,
        tmdbId: item.imdbID,
      }));
      
      return NextResponse.json({ success: true, results: formatted });
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Use "games", "movies", or "tv"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
