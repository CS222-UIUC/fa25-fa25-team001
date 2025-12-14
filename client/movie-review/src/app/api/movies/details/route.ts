/**
 * ============================================================================
 * ROUTE: Movie Details API (OMDB)
 * ============================================================================
 * 
 * Endpoint: GET /api/movies/details
 * Purpose: Fetch movie details (poster, year) from OMDB by titles
 * 
 * Query Parameters:
 *   - titles (required): Comma-separated list of movie titles
 * 
 * Returns: { success: true, movies: [...] }
 * 
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMovieById, searchMovies } from '@/lib/api/omdb';

const OMDB_API_KEY = process.env.OMDB_API_KEY || '';

async function getMovieDetails(title: string): Promise<{ title: string; poster?: string; year?: number } | null> {
  try {
    // Search for the movie
    const searchResults = await searchMovies(title, 1);
    
    // Find the first result that matches the title (case-insensitive) and is type "movie"
    const match = searchResults.Search?.find(
      (item) => item.Type === 'movie' && item.Title.toLowerCase() === title.toLowerCase()
    ) || searchResults.Search?.find(
      (item) => item.Type === 'movie'
    );

    if (!match) {
      return null;
    }

    // Get full details
    try {
      const details = await getMovieById(match.imdbID);
      return {
        title: details.Title,
        poster: details.Poster && details.Poster !== 'N/A' ? details.Poster : undefined,
        year: details.Year ? parseInt(details.Year) : undefined,
      };
    } catch (error) {
      // If getting details fails, return what we have from search
      return {
        title: match.Title,
        poster: match.Poster && match.Poster !== 'N/A' ? match.Poster : undefined,
        year: match.Year ? parseInt(match.Year) : undefined,
      };
    }
  } catch (error) {
    console.error(`Error fetching movie details for "${title}":`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const titlesParam = searchParams.get('titles');

    if (!titlesParam) {
      return NextResponse.json({ error: 'titles parameter required' }, { status: 400 });
    }

    const titles = titlesParam.split(',').map(t => t.trim()).filter(t => t);
    
    if (titles.length === 0) {
      return NextResponse.json({ success: true, movies: [] });
    }

    // Fetch details for all titles in parallel
    const movieDetails = await Promise.all(
      titles.map(title => getMovieDetails(title))
    );

    // Create a map of title -> details
    const moviesMap: Record<string, { poster?: string; year?: number }> = {};
    titles.forEach((title, index) => {
      const details = movieDetails[index];
      if (details) {
        moviesMap[title] = {
          poster: details.poster,
          year: details.year,
        };
      }
    });

    return NextResponse.json({
      success: true,
      movies: moviesMap,
    });
  } catch (error: any) {
    console.error('Error fetching movie details:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch movie details',
      },
      { status: 500 }
    );
  }
}
