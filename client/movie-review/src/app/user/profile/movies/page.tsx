'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import MediaStatusHover from '@/components/MediaStatusHover';
import { getMyMovies } from '@/actions/media';

export default function MyMoviesPage() {
  const { data: session } = useSession();
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [movieDetails, setMovieDetails] = useState<Record<string, { poster?: string; year?: number }>>({});

  useEffect(() => {
    const loadMovies = async () => {
      const res = await getMyMovies();
      if (!(res as any)?.error && (res as any).movies) {
        const moviesList = (res as any).movies;
        setMovies(moviesList);
        
        // Fetch movie details from OMDB
        if (moviesList.length > 0) {
          const titles = moviesList.map((m: any) => m.title).filter((title: string) => title);
          if (titles.length > 0) {
            try {
              const detailsRes = await fetch(`/api/movies/details?titles=${encodeURIComponent(titles.join(','))}`);
              const detailsData = await detailsRes.json();
              if (detailsData.success && detailsData.movies) {
                setMovieDetails(detailsData.movies);
              }
            } catch (error) {
              console.error('Error fetching movie details:', error);
            }
          }
        }
      }
      setLoading(false);
    };
    if (session) {
      loadMovies();
    }
  }, [session]);

  const getDefaultPoster = () => 'https://via.placeholder.com/300x450?text=No+Poster';

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
        <div className="text-center glass-strong rounded-3xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Please sign in to view your movies</h1>
          <Link href="/auth/signin" className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl glow-soft inline-block">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent drop-shadow-md mb-2">
            My Movies
          </h1>
          <p className="text-sky-700 font-medium">Movies you've watched or dropped</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-strong rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[2/3] bg-gradient-to-br from-cyan-200 to-teal-200" />
                <div className="p-4">
                  <div className="h-4 bg-sky-200 rounded mb-2" />
                  <div className="h-3 bg-sky-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="glass-strong rounded-2xl p-12 text-center">
            <p className="text-sky-700 text-lg mb-4">You haven't marked any movies yet.</p>
            <Link
              href="/movies"
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-2 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl inline-block"
            >
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <MediaStatusHover
                key={movie.id}
                mediaId={movie.id}
                mediaType="movie"
                mediaTitle={movie.title}
                currentStatus={movie.status}
              >
                <div className="group glass-strong rounded-2xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105 relative">
                  <Link href={`/movies/${movie.id}`}>
                    <div className="aspect-[2/3] bg-gradient-to-br from-cyan-100 to-teal-100 overflow-hidden rounded-t-2xl">
                      <img
                        src={movieDetails[movie.title]?.poster || getDefaultPoster()}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sky-800 mb-1 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                        {movie.title}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-sky-600">
                        <div className="flex items-center gap-2">
                          {(movieDetails[movie.title]?.year || movie.year) && (
                            <p>{movieDetails[movie.title]?.year || movie.year}</p>
                          )}
                          {movie.status && (
                            <span className="text-xs bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-2 py-1 rounded-full">
                              {movie.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </MediaStatusHover>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

