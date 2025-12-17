'use client';

import { useEffect, useState } from 'react';
import { getFavorites, updateFavoriteGames, updateFavoriteMovies, updateFavoriteTvShows } from '@/actions/favorites';
import { rateGame, getUserGameRatings } from '@/actions/gameRatings';
import { rateMovie, getUserMovieRatings } from '@/actions/movieRatings';
import { rateTvShow, getUserTvShowRatings } from '@/actions/tvShowRatings';
import StarRating from '@/components/StarRating';
import Image from 'next/image';

interface FavoriteGame {
  id: string;
  title: string;
  posterUrl?: string;
  platform?: string;
  igdbId?: number;
}

interface FavoriteMovie {
  id: string;
  title: string;
  posterUrl?: string;
  year?: number;
  tmdbId?: string;
}

interface FavoriteTvShow {
  id: string;
  title: string;
  posterUrl?: string;
  year?: number;
  tmdbId?: string;
}


export default function FavoritesSection() {
  const [favorites, setFavorites] = useState<{
    games: FavoriteGame[];
    movies: FavoriteMovie[];
    tvShows: FavoriteTvShow[];
  }>({ games: [], movies: [], tvShows: [] });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<'games' | 'movies' | 'tvShows' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gameRatings, setGameRatings] = useState<Record<string, number>>({});
  const [movieRatings, setMovieRatings] = useState<Record<string, number>>({});
  const [tvShowRatings, setTvShowRatings] = useState<Record<string, number>>({});
  const [ratingItems, setRatingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    const result = await getFavorites();
    if ((result as any)?.success) {
      const loadedFavorites = (result as any).favorites;
      setFavorites(loadedFavorites);
      // Load ratings after favorites are loaded
      if (loadedFavorites.games && loadedFavorites.games.length > 0) {
        await loadGameRatings(loadedFavorites.games);
      }
      if (loadedFavorites.movies && loadedFavorites.movies.length > 0) {
        await loadMovieRatings(loadedFavorites.movies);
      }
      if (loadedFavorites.tvShows && loadedFavorites.tvShows.length > 0) {
        await loadTvShowRatings(loadedFavorites.tvShows);
      }
    }
    setLoading(false);
  };

  const loadGameRatings = async (gamesList: FavoriteGame[]) => {
    try {
      const gameTitles = gamesList.map(g => g.title);
      if (gameTitles.length === 0) return;
      const result = await getUserGameRatings(gameTitles);
      if (result.ratings) {
        setGameRatings(result.ratings);
      }
    } catch (error) {
      console.error('Error loading game ratings:', error);
    }
  };

  const loadMovieRatings = async (moviesList: FavoriteMovie[]) => {
    try {
      const movieTitles = moviesList.map(m => m.title);
      if (movieTitles.length === 0) return;
      const result = await getUserMovieRatings(movieTitles);
      if (result.ratings) {
        setMovieRatings(result.ratings);
      }
    } catch (error) {
      console.error('Error loading movie ratings:', error);
    }
  };

  const loadTvShowRatings = async (tvShowsList: FavoriteTvShow[]) => {
    try {
      const showTitles = tvShowsList.map(s => s.title);
      if (showTitles.length === 0) return;
      const result = await getUserTvShowRatings(showTitles);
      if (result.ratings) {
        setTvShowRatings(result.ratings);
      }
    } catch (error) {
      console.error('Error loading TV show ratings:', error);
    }
  };

  const handleRateGame = async (gameName: string, rating: number) => {
    if (ratingItems.has(`game-${gameName}`)) return;
    
    setRatingItems(prev => new Set(prev).add(`game-${gameName}`));
    try {
      const result = await rateGame(gameName, rating);
      if (result.success && result.rating !== undefined) {
        setGameRatings(prev => ({ ...prev, [gameName]: result.rating }));
      }
    } catch (error) {
      console.error('Error rating game:', error);
    } finally {
      setRatingItems(prev => {
        const next = new Set(prev);
        next.delete(`game-${gameName}`);
        return next;
      });
    }
  };

  const handleRateMovie = async (movieName: string, rating: number) => {
    if (ratingItems.has(`movie-${movieName}`)) return;
    
    setRatingItems(prev => new Set(prev).add(`movie-${movieName}`));
    try {
      const result = await rateMovie(movieName, rating);
      if (result.success && result.rating !== undefined) {
        setMovieRatings(prev => ({ ...prev, [movieName]: result.rating }));
      }
    } catch (error) {
      console.error('Error rating movie:', error);
    } finally {
      setRatingItems(prev => {
        const next = new Set(prev);
        next.delete(`movie-${movieName}`);
        return next;
      });
    }
  };

  const handleRateTvShow = async (showName: string, rating: number) => {
    if (ratingItems.has(`tvshow-${showName}`)) return;
    
    setRatingItems(prev => new Set(prev).add(`tvshow-${showName}`));
    try {
      const result = await rateTvShow(showName, rating);
      if (result.success && result.rating !== undefined) {
        setTvShowRatings(prev => ({ ...prev, [showName]: result.rating }));
      }
    } catch (error) {
      console.error('Error rating TV show:', error);
    } finally {
      setRatingItems(prev => {
        const next = new Set(prev);
        next.delete(`tvshow-${showName}`);
        return next;
      });
    }
  };

  const handleSearch = async (type: 'games' | 'movies' | 'tvShows') => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const apiType = type === 'tvShows' ? 'tv' : type;
      const response = await fetch(`/api/search?type=${apiType}&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.success && data.results) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
    setSearchLoading(false);
  };

  const handleAddFavorite = async (item: any, type: 'games' | 'movies' | 'tvShows') => {
    const currentFavorites = favorites[type];
    if (currentFavorites.length >= 5) {
      alert(`Maximum 5 favorite ${type} allowed. Remove one first.`);
      return;
    }

    const newFavorite = {
      id: item.id,
      title: item.title,
      posterUrl: item.posterUrl || '',
      ...(type === 'games' ? { platform: item.platform || 'unknown', igdbId: item.igdbId } : {}),
      ...(type !== 'games' ? { year: item.year, tmdbId: item.tmdbId } : {}),
    };

    const updated = [...currentFavorites, newFavorite];
    setSaving(true);

    try {
      if (type === 'games') {
        await updateFavoriteGames(updated);
      } else if (type === 'movies') {
        await updateFavoriteMovies(updated);
      } else {
        await updateFavoriteTvShows(updated);
      }
      
      setFavorites({ ...favorites, [type]: updated });
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding favorite:', error);
      alert('Failed to add favorite');
    }
    setSaving(false);
  };

  const handleRemoveFavorite = async (index: number, type: 'games' | 'movies' | 'tvShows') => {
    const updated = favorites[type].filter((_, i) => i !== index);
    setSaving(true);

    try {
      if (type === 'games') {
        await updateFavoriteGames(updated);
      } else if (type === 'movies') {
        await updateFavoriteMovies(updated);
      } else {
        await updateFavoriteTvShows(updated);
      }
      
      setFavorites({ ...favorites, [type]: updated });
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Failed to remove favorite');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="text-center py-8 text-sky-700 font-medium">Loading favorites...</div>;
  }

  const renderFavorites = (type: 'games' | 'movies' | 'tvShows', title: string) => {
    const items = favorites[type];
    const isEditing = editing === type;

    return (
      <div className="glass-strong rounded-2xl shadow-xl p-6 border-2 border-cyan-300/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-sky-800">{title}</h3>
          <button
            onClick={() => {
              setEditing(isEditing ? null : type);
              setSearchQuery('');
              setSearchResults([]);
            }}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl glow-soft text-sm"
          >
            {isEditing ? 'Cancel' : items.length < 5 ? 'Add' : 'View'}
          </button>
        </div>

        {isEditing && items.length < 5 && (
          <div className="mb-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch(type);
                  }
                }}
                placeholder={`Search for ${type === 'games' ? 'games' : type === 'movies' ? 'movies' : 'TV shows'}...`}
                className="flex-1 glass-strong rounded-xl px-3 py-2 text-sky-900 placeholder-sky-600/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
              />
              <button
                onClick={() => handleSearch(type)}
                disabled={searchLoading || !searchQuery.trim()}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-2 px-4 rounded-xl disabled:opacity-50 transition-all shadow-lg hover:shadow-xl glow-soft"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2 glass rounded-xl p-3">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 hover:bg-white/20 rounded-lg cursor-pointer"
                    onClick={() => handleAddFavorite(item, type)}
                  >
                    <div className="flex items-center gap-3">
                      {item.posterUrl && (
                        <img
                          src={item.posterUrl}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <div className="font-semibold text-sky-800">{item.title}</div>
                        {item.year && (
                          <div className="text-xs text-sky-600">{item.year}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddFavorite(item, type);
                      }}
                      disabled={saving}
                      className="bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-white font-semibold py-1 px-3 rounded-lg disabled:opacity-50 transition-all text-sm"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {items.map((item, index) => (
            <div key={index} className="relative group cursor-pointer transition-transform hover:scale-105">
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-200 shadow-lg">
                {item.posterUrl ? (
                  <Image
                    src={item.posterUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm text-center p-2">
                    {item.title}
                  </div>
                )}
                {/* Star Rating Overlay for all media types */}
                <StarRating
                  rating={
                    type === 'games' 
                      ? gameRatings[item.title] || 0
                      : type === 'movies'
                      ? movieRatings[item.title] || 0
                      : tvShowRatings[item.title] || 0
                  }
                  onRatingChange={(rating) => {
                    if (type === 'games') {
                      handleRateGame(item.title, rating);
                    } else if (type === 'movies') {
                      handleRateMovie(item.title, rating);
                    } else {
                      handleRateTvShow(item.title, rating);
                    }
                  }}
                  variant="overlay"
                  size="md"
                />
                {/* Rating badge - top right corner */}
                {((type === 'games' && gameRatings[item.title]) ||
                  (type === 'movies' && movieRatings[item.title]) ||
                  (type === 'tvShows' && tvShowRatings[item.title])) && (
                  <div className="absolute top-2 right-2 bg-black/80 text-yellow-400 text-xs font-semibold px-2 py-1 rounded flex items-center gap-1 z-20 backdrop-blur-sm">
                    <span>⭐</span>
                    <span>{(
                      type === 'games' 
                        ? gameRatings[item.title]
                        : type === 'movies'
                        ? movieRatings[item.title]
                        : tvShowRatings[item.title]
                    ).toFixed(1)}</span>
                  </div>
                )}
                {isEditing && (
                  <button
                    onClick={() => handleRemoveFavorite(index, type)}
                    className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity z-40"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="mt-2 text-sm font-semibold text-sky-800 text-center line-clamp-2">
                {item.title}
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full text-center text-sky-600 py-8">
              No favorites yet. Click "Add" to add some!
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-2 drop-shadow-md">
          My Favorites
        </h2>
        <p className="text-sky-700 font-medium">
          Add up to 5 favorite games, movies, and TV shows to showcase on your profile.
        </p>
      </div>

      {renderFavorites('games', 'Favorite Games')}
      {renderFavorites('movies', 'Favorite Movies')}
      {renderFavorites('tvShows', 'Favorite TV Shows')}
    </div>
  );
}
