"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { searchEverything } from '@/actions/search';

export default function Header() {
    const { data: session, status } = useSession();
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [movies, setMovies] = useState<Array<{id: string; title: string; year?: number; source?: string}>>([]);
    const [tvShows, setTVShows] = useState<Array<{id: string; title: string; year?: string}>>([]);
    const [games, setGames] = useState<Array<{id: number; name: string}>>([]);
    const [users, setUsers] = useState<Array<{id: string; username: string}>>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, []);



    // Debounced search
    useEffect(() => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            setMovies([]);
            setTVShows([]);
            setGames([]);
            setUsers([]);
            return;
        }
        setIsLoading(true);
        const t = setTimeout(async () => {
            try {
                const data = await searchEverything(searchQuery.trim());
                
                // Filter duplicates by ID
                const uniqueMovies = ((data as any).movies || []).filter((movie: any, index: number, self: any[]) => 
                    self.findIndex(m => m.id === movie.id) === index
                );
                const uniqueTVShows = ((data as any).tvShows || []).filter((show: any, index: number, self: any[]) => 
                    self.findIndex(s => s.id === show.id) === index
                );
                const uniqueGames = ((data as any).games || []).filter((game: any, index: number, self: any[]) => 
                    self.findIndex(g => g.id === game.id) === index
                );
                const uniqueUsers = ((data as any).users || []).filter((user: any, index: number, self: any[]) => 
                    self.findIndex(u => u.id === user.id) === index
                );
                
                setMovies(uniqueMovies);
                setTVShows(uniqueTVShows);
                setGames(uniqueGames);
                setUsers(uniqueUsers);
                setShowResults(true);
            } catch {}
            setIsLoading(false);
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Keep user on current page, just open results dropdown
        if (searchQuery.trim()) {
            setShowResults(true);
        }
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center space-x-6">
                        <Link href="/" className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                            MovieReview
                        </Link>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-lg mx-8" ref={containerRef}>
                        <form onSubmit={handleSearch} className="relative">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg
                                        className="h-5 w-5 text-gray-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
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
                                    placeholder="Search movies, users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            {/* Results dropdown */}
                            {showResults && (
                                <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                                    {isLoading ? (
                                        <div className="p-4 text-sm text-gray-500">Searching...</div>
                                    ) : (
                                        <div className="max-h-80 overflow-auto">
                                            {/* Games */}
                                            <div className="p-2">
                                                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Games</div>
                                                {games.length === 0 ? (
                                                    <div className="px-2 py-2 text-sm text-gray-500">No games found</div>
                                                ) : (
                                                    games.slice(0,3).map((g) => (
                                                        <div key={g.id} className="px-2 py-2 hover:bg-gray-50 cursor-pointer text-sm" onClick={() => setShowResults(false)}>
                                                            🎮 {g.name}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <hr />
                                            {/* Movies */}
                                            <div className="p-2">
                                                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Movies</div>
                                                {movies.length === 0 ? (
                                                    <div className="px-2 py-2 text-sm text-gray-500">No movies found</div>
                                                ) : (
                                                    movies.slice(0,3).map((m, index) => (
                                                        <div key={`movie-${m.id || index}`} className="px-2 py-2 hover:bg-gray-50 cursor-pointer text-sm" onClick={() => setShowResults(false)}>
                                                            🎬 {m.title} {m.year && `(${m.year})`}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <hr />
                                            {/* TV Shows */}
                                            <div className="p-2">
                                                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">TV Shows</div>
                                                {tvShows.length === 0 ? (
                                                    <div className="px-2 py-2 text-sm text-gray-500">No TV shows found</div>
                                                ) : (
                                                    tvShows.slice(0,3).map((s) => (
                                                        <div key={s.id} className="px-2 py-2 hover:bg-gray-50 cursor-pointer text-sm" onClick={() => setShowResults(false)}>
                                                            📺 {s.title} {s.year && `(${s.year})`}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <hr />
                                            {/* Users */}
                                            <div className="p-2">
                                                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Users</div>
                                                {users.length === 0 ? (
                                                    <div className="px-2 py-2 text-sm text-gray-500">No users found</div>
                                                ) : (
                                                    users.slice(0,3).map((u) => (
                                                        <div key={u.id} className="px-2 py-2 hover:bg-gray-50 cursor-pointer text-sm" onClick={() => setShowResults(false)}>
                                                            👤 {u.username}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <div className="p-2 border-t">
                                                <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} className="block text-center text-sm text-indigo-600 hover:text-indigo-700" onClick={() => setShowResults(false)}>
                                                    See all results
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Navigation */}
                    <nav className="flex items-center space-x-4">
                        {session ? (
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/profile"
                                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-bold transition-colors"
                                >
                                    {session.user?.name || 'Profile'}
                                </Link>
                                <img
                                    src={session.user?.image || '/default.jpg'}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full cursor-pointer"
                                    onClick={() => window.location.href = '/profile'}
                                />
                                <button
                                    onClick={async () => {
                                        await signOut({ redirect: false });
                                        window.location.href = '/';
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-bold transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link
                                    href="/auth/signin"
                                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-bold transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-bold transition-colors"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
}
