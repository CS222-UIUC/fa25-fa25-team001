"use server";

import prisma from '@/lib/prisma';

async function searchRAWGGames(query: string) {
  try {
    const apiKey = process.env.RAWG_API_KEY;
    if (!apiKey) {
      console.error('RAWG_API_KEY not configured');
      return [];
    }

    // Search RAWG API
    const response = await fetch(
      `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=20&search_precise=true`
    );

    if (!response.ok) throw new Error('RAWG API failed');
    
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('Failed to parse RAWG response:', error);
      return [];
    }

    const games = data.results || [];

    // Normalize and dedupe by base title to avoid platform/edition duplicates
    const normalize = (s: string) =>
      (s || '')
        .toLowerCase()
        .replace(/\(.*?\)/g, '') // drop parenthetical qualifiers
        .replace(/\s+edition|\s+remaster|\s+hd|\s+collection/g, '') // drop common suffixes
        .replace(/[^a-z0-9]+/g, ' ') // remove punctuation
        .trim();

    const mapped = games
      .filter((game: any) => game.background_image) // only games with images
      .map((game: any) => ({
        id: game.id,
        name: game.name as string,
        cover: game.background_image || null,
        rating: game.rating ? Math.round(game.rating) : null,
        norm: normalize(game.name),
        first: game.released ? new Date(game.released).getTime() : 0,
      }));

    const byNorm = new Map<string, { id: number; name: string; cover: string | null; rating: number | null; first: number }>();
    for (const g of mapped) {
      const existing = byNorm.get(g.norm);
      if (!existing) {
        byNorm.set(g.norm, { id: g.id, name: g.name, cover: g.cover, rating: g.rating, first: g.first });
      } else {
        // prefer higher rating, else earlier release, else keep existing
        const better = (g.rating || 0) > (existing.rating || 0)
          || ((g.rating || 0) === (existing.rating || 0) && (g.first || 0) < (existing.first || 0));
        if (better) byNorm.set(g.norm, { id: g.id, name: g.name, cover: g.cover, rating: g.rating, first: g.first });
      }
    }

    // return top 5 after dedupe by rating desc
    return Array.from(byNorm.values())
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5)
      .map(g => ({ id: g.id, name: g.name, cover: g.cover, rating: g.rating }));
  } catch (error) {
    console.error('RAWG search error:', error);
    return [];
  }
}

async function searchOMDBMovies(query: string) {
  try {
    const response = await fetch(`http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&s=${encodeURIComponent(query)}&type=movie`);
    if (!response.ok) throw new Error('OMDB API failed');
    
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('Failed to parse OMDB movies response:', error);
      return [];
    }
    
    return (data.Search || []).slice(0, 5).map((item: any) => ({
      id: item.imdbID,
      title: item.Title,
      year: item.Year,
      poster: item.Poster
    }));
  } catch {
    return [];
  }
}

async function searchOMDBTVShows(query: string) {
  try {
    const response = await fetch(`http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&s=${encodeURIComponent(query)}&type=series`);
    if (!response.ok) throw new Error('OMDB API failed');
    
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('Failed to parse OMDB TV shows response:', error);
      return [];
    }
    
    return (data.Search || []).slice(0, 5).map((item: any) => ({
      id: item.imdbID,
      title: item.Title,
      year: item.Year,
      poster: item.Poster
    }));
  } catch {
    return [];
  }
}

export async function searchEverything(q: string) {
  const query = (q || '').trim();
  if (!query || query.length < 2) return { users: [], movies: [], tvShows: [], games: [] } as const;

  const [users, localMovies, rawgGames, omdbMovies, omdbTVShows] = await Promise.all([
    prisma.user.findMany({
      where: { username: { contains: query, mode: 'insensitive' } },
      select: { id: true, username: true, profilePicture: true },
      take: 5,
    }),
    prisma.movie.findMany({
      where: { title: { contains: query, mode: 'insensitive' } },
      select: { id: true, title: true, releaseYear: true },
      take: 5,
    }),
    searchRAWGGames(query),
    searchOMDBMovies(query),
    searchOMDBTVShows(query)
  ]);

  // Ensure unique IDs across sources by prefixing local items
  const moviesAll = [
    ...localMovies.map(m => ({ id: `local-${m.id}`, title: m.title, year: m.releaseYear, source: 'local' as const })),
    ...omdbMovies.map((m: any) => ({ id: `omdb-${m.id}`, title: m.title, year: m.year, poster: m.poster, source: 'omdb' as const }))
  ];
  // Deduplicate by id to prevent duplicate keys in UI
  const movies = Array.from(new Map(moviesAll.map(m => [m.id, m])).values());

  // Deduplicate tv shows as well
  const tvAll = omdbTVShows.map((t: any) => ({ ...t, id: `tv-${t.id}` }));
  const tvShows = Array.from(new Map(tvAll.map((t: any) => [t.id, t])).values());

  // Deduplicate games by id just in case
  const games = Array.from(new Map(rawgGames.map((g: any) => [g.id, g])).values());

  return {
    users: users.map(u => ({ id: u.id, username: u.username, profilePicture: u.profilePicture })),
    movies,
    tvShows,
    games
  } as const;
}
