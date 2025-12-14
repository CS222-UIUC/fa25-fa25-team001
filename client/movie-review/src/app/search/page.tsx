"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { searchEverything } from '@/actions/search';
import Link from 'next/link';
import { Film, Tv, Gamepad2, Filter, Search as SearchIcon, Star } from 'lucide-react';

interface SearchResults {
  games: Array<{id: number; name: string; cover?: string; rating?: number}>;
  movies: Array<{id: string; title: string; year?: number; poster?: string; source: string}>;
  tvShows: Array<{id: string; title: string; year?: string; poster?: string}>;
}

function SearchContent() {
  const router = useRouter();
  const [results, setResults] = useState<SearchResults>({ games: [], movies: [], tvShows: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const typeFilter = searchParams.get('type') || 'all';

  useEffect(() => {
    if (query.trim().length >= 2) {
      handleSearch();
    } else if (typeFilter !== 'all' && query.trim().length === 0) {
        // If only type filter is present (e.g. from "View All" on home), we might want to fetch trending or just wait for query
        // For now, let's just clear results if no query
        setResults({ games: [], movies: [], tvShows: [] });
    }
  }, [query]);

  const deduplicateMovies = (movies: SearchResults['movies']) => {
    const seen = new Map<string, SearchResults['movies'][0]>();
    
    movies.forEach((movie) => {
      const key = movie.title.toLowerCase().trim();
      const existing = seen.get(key);
      
      if (!existing) {
        seen.set(key, movie);
      } else {
        // Prefer local source, or prefer ones with posters
        if (movie.source === 'local' || (movie.poster && movie.poster !== 'N/A' && !existing.poster)) {
          seen.set(key, movie);
        }
      }
    });
    
    return Array.from(seen.values());
  };

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchEverything(query.trim()) as any;
      const dedupedMovies = deduplicateMovies(data.movies || []);
      setResults({
        games: data.games || [],
        movies: dedupedMovies,
        tvShows: data.tvShows || [],
      });
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilter = (newType: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', newType);
    router.push(`/search?${params.toString()}`);
  };

  const filteredResults = {
    movies: (typeFilter === 'all' || typeFilter === 'movie') ? results.movies : [],
    tvShows: (typeFilter === 'all' || typeFilter === 'tv') ? results.tvShows : [],
    games: (typeFilter === 'all' || typeFilter === 'game') ? results.games : [],
  };

  const hasResults = 
    filteredResults.movies.length > 0 || 
    filteredResults.tvShows.length > 0 || 
    filteredResults.games.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-lg font-semibold">
                <Filter className="h-5 w-5" />
                <h2>Filters</h2>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => updateFilter('all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    typeFilter === 'all' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>All Results</span>
                  <span className="bg-background/20 px-2 py-0.5 rounded text-xs">
                    {results.movies.length + results.tvShows.length + results.games.length}
                  </span>
                </button>
                
                <button
                  onClick={() => updateFilter('movie')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    typeFilter === 'movie' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4" />
                    <span>Movies</span>
                  </div>
                  <span className="bg-background/20 px-2 py-0.5 rounded text-xs">{results.movies.length}</span>
                </button>

                <button
                  onClick={() => updateFilter('tv')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    typeFilter === 'tv' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tv className="h-4 w-4" />
                    <span>TV Shows</span>
                  </div>
                  <span className="bg-background/20 px-2 py-0.5 rounded text-xs">{results.tvShows.length}</span>
                </button>

                <button
                  onClick={() => updateFilter('game')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    typeFilter === 'game' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4" />
                    <span>Games</span>
                  </div>
                  <span className="bg-background/20 px-2 py-0.5 rounded text-xs">{results.games.length}</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">
                {query ? `Search results for "${query}"` : 'Search'}
              </h1>
              <p className="text-muted-foreground">
                Found {results.movies.length + results.tvShows.length + results.games.length} matches
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-[2/3] bg-secondary rounded-xl animate-pulse"></div>
                    <div className="h-4 bg-secondary rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-secondary rounded w-1/2 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : !hasResults && query ? (
              <div className="text-center py-20 bg-card rounded-xl border border-border">
                <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters to find what you're looking for.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Movies Section */}
                {filteredResults.movies.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Film className="h-5 w-5 text-blue-500" /> Movies
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredResults.movies.map((movie) => (
                        <Link href={`/movie/${movie.id}`} key={movie.id} className="group">
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary mb-3 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-[1.02] group-hover:ring-2 group-hover:ring-primary/50">
                            {movie.poster && movie.poster !== 'N/A' ? (
                              <img 
                                src={movie.poster} 
                                alt={movie.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary p-4 text-center">
                                <span className="text-sm">{movie.title}</span>
                              </div>
                            )}
                          </div>
                          <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">{movie.title}</h3>
                          <p className="text-xs text-muted-foreground">{movie.year}</p>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* TV Shows Section */}
                {filteredResults.tvShows.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Tv className="h-5 w-5 text-purple-500" /> TV Shows
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredResults.tvShows.map((show) => (
                        <Link href={`/tv/${show.id}`} key={show.id} className="group">
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary mb-3 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-[1.02] group-hover:ring-2 group-hover:ring-primary/50">
                            {show.poster && show.poster !== 'N/A' ? (
                              <img 
                                src={show.poster} 
                                alt={show.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary p-4 text-center">
                                <span className="text-sm">{show.title}</span>
                              </div>
                            )}
                          </div>
                          <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">{show.title}</h3>
                          <p className="text-xs text-muted-foreground">{show.year}</p>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Games Section */}
                {filteredResults.games.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Gamepad2 className="h-5 w-5 text-green-500" /> Games
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredResults.games.map((game) => (
                        <Link href={`/game/${game.id}`} key={game.id} className="group">
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary mb-3 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-[1.02] group-hover:ring-2 group-hover:ring-primary/50">
                            {game.cover ? (
                              <img 
                                src={game.cover} 
                                alt={game.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary p-4 text-center">
                                <span className="text-sm">{game.name}</span>
                              </div>
                            )}
                            {game.rating && (
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                                <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                                  <Star className="h-3 w-3 fill-current" />
                                  <span>{Math.round(game.rating)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">{game.name}</h3>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
