/**
 * OMDB API Client for fetching movie data
 */

const OMDB_API_KEY = process.env.OMDB_API_KEY || '';
const OMDB_API_URL = 'https://www.omdbapi.com/';

export interface OMDBMovie {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Array<{ Source: string; Value: string }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
}

export interface OMDBSearchResult {
  Search: Array<{
    Title: string;
    Year: string;
    imdbID: string;
    Type: string;
    Poster: string;
  }>;
  totalResults: string;
  Response: string;
}

/**
 * Search for movies
 */
export async function searchMovies(query: string, page: number = 1): Promise<OMDBSearchResult> {
  if (!OMDB_API_KEY) {
    throw new Error('OMDB API key not configured');
  }

  const response = await fetch(
    `${OMDB_API_URL}?s=${encodeURIComponent(query)}&page=${page}&apikey=${OMDB_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`OMDB API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.Response === 'False') {
    throw new Error(data.Error || 'Failed to search movies');
  }

  return data;
}

/**
 * Get movie details by ID
 */
export async function getMovieById(imdbId: string): Promise<OMDBMovie> {
  if (!OMDB_API_KEY) {
    throw new Error('OMDB API key not configured');
  }

  const response = await fetch(
    `${OMDB_API_URL}?i=${encodeURIComponent(imdbId)}&apikey=${OMDB_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`OMDB API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.Response === 'False') {
    throw new Error(data.Error || 'Failed to get movie details');
  }

  return data;
}

/**
 * Get movie details by title
 */
export async function getMovieByTitle(title: string): Promise<OMDBMovie> {
  if (!OMDB_API_KEY) {
    throw new Error('OMDB API key not configured');
  }

  const response = await fetch(
    `${OMDB_API_URL}?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`OMDB API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.Response === 'False') {
    throw new Error(data.Error || 'Failed to get movie details');
  }

  return data;
}

/**
 * Get popular/trending movies by searching for common popular terms
 * Note: OMDB doesn't have a direct trending API, so we search for popular movie titles
 */
export async function getPopularMovies(limit: number = 20) {
  // Popular movie search terms that tend to return good results
  const searchTerms = [
    '2024', // Recent year
    '2023',
    'action',
    'drama',
    'comedy',
  ];

  const allMovies: Array<{
    Title: string;
    Year: string;
    imdbID: string;
    Type: string;
    Poster: string;
  }> = [];

  try {
    // Try multiple searches to get variety
    for (const term of searchTerms.slice(0, 3)) {
      try {
        const result = await searchMovies(term, 1);
        if (result.Search) {
          // Filter for movies with posters
          const moviesWithPosters = result.Search.filter(
            m => m.Type === 'movie' && m.Poster && m.Poster !== 'N/A'
          );
          allMovies.push(...moviesWithPosters);
        }
        if (allMovies.length >= limit * 2) break;
      } catch (err) {
        // Continue to next search term if one fails
        continue;
      }
    }
  } catch (error) {
    console.error('Error fetching popular movies:', error);
  }

  // Remove duplicates and limit
  const uniqueMovies = Array.from(
    new Map(allMovies.map(m => [m.imdbID, m])).values()
  ).slice(0, limit);

  return uniqueMovies;
}

