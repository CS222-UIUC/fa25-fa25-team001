import { NextRequest, NextResponse } from 'next/server';

// In-memory cache
let cache: {
  movies: any[];
  tvShows: any[];
  games: any[];
  lastUpdated: Date | null;
} = {
  movies: [],
  tvShows: [],
  games: [],
  lastUpdated: null,
};

const CACHE_DURATION_MS = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

async function fetchTrendingMovies() {
  try {
    const response = await fetch(
      `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&s=avengers&type=movie`
    );
    const data = await response.json();
    
    if (data.Search) {
      const movies = await Promise.all(
        data.Search.slice(0, 12).map(async (movie: any) => {
          const detailResponse = await fetch(
            `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=${movie.imdbID}`
          );
          const details = await detailResponse.json();
          return {
            id: movie.imdbID,
            title: movie.Title,
            year: movie.Year,
            poster: movie.Poster,
            rating: details.imdbRating || 'N/A',
            type: 'movie',
          };
        })
      );
      return movies;
    }
    return [];
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    return [];
  }
}

async function fetchTrendingTvShows() {
  try {
    const response = await fetch(
      `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&s=game&type=series`
    );
    const data = await response.json();
    
    if (data.Search) {
      const shows = await Promise.all(
        data.Search.slice(0, 12).map(async (show: any) => {
          const detailResponse = await fetch(
            `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=${show.imdbID}`
          );
          const details = await detailResponse.json();
          return {
            id: show.imdbID,
            title: show.Title,
            year: show.Year,
            poster: show.Poster,
            rating: details.imdbRating || 'N/A',
            type: 'tvshow',
          };
        })
      );
      return shows;
    }
    return [];
  } catch (error) {
    console.error('Error fetching trending TV shows:', error);
    return [];
  }
}

async function fetchTrendingGames() {
  // Static list of popular games
  return [
    {
      id: 3498,
      title: 'Grand Theft Auto V',
      year: 2013,
      poster: 'https://media.rawg.io/media/games/20a/20aa03a10cda45239fe22d035c0ebe64.jpg',
      rating: 4.47,
      type: 'game',
    },
    {
      id: 41494,
      title: 'Cyberpunk 2077',
      year: 2020,
      poster: 'https://media.rawg.io/media/games/26d/26d4437715bee60138dab4a7c8c59c92.jpg',
      rating: 4.08,
      type: 'game',
    },
    {
      id: 3328,
      title: 'The Witcher 3: Wild Hunt',
      year: 2015,
      poster: 'https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg',
      rating: 4.66,
      type: 'game',
    },
    {
      id: 4200,
      title: 'Portal 2',
      year: 2011,
      poster: 'https://media.rawg.io/media/games/2ba/2bac0e87cf45e5b508f227d281c9252a.jpg',
      rating: 4.61,
      type: 'game',
    },
    {
      id: 5286,
      title: 'Tomb Raider (2013)',
      year: 2013,
      poster: 'https://media.rawg.io/media/games/021/021c4e21a1824d2526f925eff6324653.jpg',
      rating: 4.05,
      type: 'game',
    },
    {
      id: 13536,
      title: 'Portal',
      year: 2007,
      poster: 'https://media.rawg.io/media/games/7fa/7fa0b586293c5861ee32490e953a4996.jpg',
      rating: 4.51,
      type: 'game',
    },
    {
      id: 12020,
      title: 'Left 4 Dead 2',
      year: 2009,
      poster: 'https://media.rawg.io/media/games/d58/d588947d4286e7b5e0e12e1bea7d9844.jpg',
      rating: 4.09,
      type: 'game',
    },
    {
      id: 5679,
      title: 'The Elder Scrolls V: Skyrim',
      year: 2011,
      poster: 'https://media.rawg.io/media/games/7cf/7cfc9220b401b7a300e409e539c9afd5.jpg',
      rating: 4.42,
      type: 'game',
    },
    {
      id: 28,
      title: 'Red Dead Redemption 2',
      year: 2018,
      poster: 'https://media.rawg.io/media/games/511/5118aff5091cb3efec399c808f8c598f.jpg',
      rating: 4.59,
      type: 'game',
    },
    {
      id: 1030,
      title: "Limbo",
      year: 2010,
      poster: 'https://media.rawg.io/media/games/942/9424d6bb763dc38d9378b488603c87fa.jpg',
      rating: 4.14,
      type: 'game',
    },
    {
      id: 802,
      title: 'Borderlands 2',
      year: 2012,
      poster: 'https://media.rawg.io/media/games/49c/49c3dfa4ce2f6f140cc4825868e858cb.jpg',
      rating: 4.02,
      type: 'game',
    },
    {
      id: 58175,
      title: 'God of War',
      year: 2018,
      poster: 'https://media.rawg.io/media/games/4be/4be6a6ad0364751a96229c56bf69be59.jpg',
      rating: 4.57,
      type: 'game',
    },
  ];
}

async function updateCache() {
  console.log('Updating trending cache...');
  const [movies, tvShows, games] = await Promise.all([
    fetchTrendingMovies(),
    fetchTrendingTvShows(),
    fetchTrendingGames(),
  ]);

  cache = {
    movies,
    tvShows,
    games,
    lastUpdated: new Date(),
  };
  
  console.log('Cache updated successfully');
}

export async function GET(request: NextRequest) {
  try {
    // Check if cache needs updating
    const now = new Date();
    const needsUpdate = 
      !cache.lastUpdated || 
      (now.getTime() - cache.lastUpdated.getTime()) > CACHE_DURATION_MS;

    if (needsUpdate) {
      await updateCache();
    }

    return NextResponse.json({
      success: true,
      data: {
        movies: cache.movies,
        tvShows: cache.tvShows,
        games: cache.games,
      },
      lastUpdated: cache.lastUpdated,
    });
  } catch (error: any) {
    console.error('Get trending error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get trending content' },
      { status: 500 }
    );
  }
}
