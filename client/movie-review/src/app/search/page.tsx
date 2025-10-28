"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Movie {
  id: string;
  title: string;
  year: number;
  rating?: number;
  poster?: string;
}

interface User {
  id: string;
  username: string;
  profilePicture?: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'movies' | 'users'>('movies');

  // Mock data for demonstration
  const mockMovies: Movie[] = [
    { id: '1', title: 'The Dark Knight', year: 2008, rating: 9.0 },
    { id: '2', title: 'Inception', year: 2010, rating: 8.8 },
    { id: '3', title: 'Interstellar', year: 2014, rating: 8.6 },
    { id: '4', title: 'The Matrix', year: 1999, rating: 8.7 },
    { id: '5', title: 'Pulp Fiction', year: 1994, rating: 8.9 },
  ];

  const mockUsers: User[] = [
    { id: '1', username: 'moviebuff123', profilePicture: '/default.jpg' },
    { id: '2', username: 'cinemafan', profilePicture: '/default.jpg' },
    { id: '3', username: 'filmcritic', profilePicture: '/default.jpg' },
  ];

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchTerm: string) => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Filter mock data based on search term
    const filteredMovies = mockMovies.filter(movie =>
      movie.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const filteredUsers = mockUsers.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setMovies(filteredMovies);
    setUsers(filteredUsers);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.history.pushState({}, '', `/search?q=${encodeURIComponent(searchQuery)}`);
      performSearch(searchQuery);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search</h1>
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for movies, users..."
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </form>
        </div>

        {query && (
          <>
            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('movies')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'movies'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Movies ({movies.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'users'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Users ({users.length})
                  </button>
                </nav>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-xl text-gray-600">Searching...</div>
              </div>
            ) : (
              <>
                {/* Movies Tab */}
                {activeTab === 'movies' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {movies.map(movie => (
                      <div key={movie.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-[2/3] bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500">Movie Poster</span>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2">{movie.title}</h3>
                          <p className="text-gray-600 mb-2">{movie.year}</p>
                          {movie.rating && (
                            <div className="flex items-center">
                              <span className="text-yellow-500">⭐</span>
                              <span className="ml-1 text-sm font-medium">{movie.rating}/10</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map(user => (
                      <div key={user.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center space-x-4">
                          <img
                            src={user.profilePicture || '/default.jpg'}
                            alt={user.username}
                            className="w-12 h-12 rounded-full"
                          />
                          <div>
                            <h3 className="font-semibold text-lg">{user.username}</h3>
                            <p className="text-gray-600 text-sm">Movie Enthusiast</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {!loading && activeTab === 'movies' && movies.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No movies found for "{query}"</p>
                  </div>
                )}

                {!loading && activeTab === 'users' && users.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No users found for "{query}"</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!query && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Enter a search term to find movies and users</p>
          </div>
        )}
      </div>
    </div>
  );
}