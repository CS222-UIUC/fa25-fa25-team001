"use client";

import { useEffect, useState } from 'react';
import { addToWatchlist, getMyWatchlist, removeFromWatchlist } from '@/actions/media';

interface Movie {
  id: string;
  title: string;
  year: number;
  poster: string;
}

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<Movie[]>([]);

  const [newMovie, setNewMovie] = useState({
    title: '',
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyWatchlist();
        const items = ((data as any).items || []).map((i: any) => ({ id: i.id, title: i.title, year: i.year, poster: '/placeholder-movie.jpg' }));
        setWatchlist(items);
      } catch {}
    })();
  }, []);

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovie.title.trim()) return;

    try {
      const data = await addToWatchlist({ title: newMovie.title, year: newMovie.year });
      if ((data as any)?.item) {
        const item = (data as any).item;
        setWatchlist([...watchlist, { id: item.id, title: item.title, year: item.year, poster: '/placeholder-movie.jpg' }]);
        setNewMovie({ title: '', year: new Date().getFullYear() });
      }
    } catch {}
  };

  const handleRemoveMovie = async (id: string) => {
    try { await removeFromWatchlist(id); } catch {}
    setWatchlist(watchlist.filter(movie => movie.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">My Watchlist</h1>

      {/* Add Movie Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add to Watchlist</h2>
        <form onSubmit={handleAddMovie} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={newMovie.title}
              onChange={(e) => setNewMovie({...newMovie, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Movie title"
              required
            />
          </div>
          <div className="w-32">
            <input
              type="number"
              value={newMovie.year}
              onChange={(e) => setNewMovie({...newMovie, year: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1900"
              max={new Date().getFullYear() + 5}
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Add
          </button>
        </form>
      </div>

      {/* Watchlist */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {watchlist.map(movie => (
          <div key={movie.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="aspect-[2/3] bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">Movie Poster</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{movie.title}</h3>
              <p className="text-gray-600 mb-4">{movie.year}</p>
              <button
                onClick={() => handleRemoveMovie(movie.id)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {watchlist.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Your watchlist is empty</p>
          <p className="text-gray-400">Add some movies to get started!</p>
        </div>
      )}
    </div>
  );
}