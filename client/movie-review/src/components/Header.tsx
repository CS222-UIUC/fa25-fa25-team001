'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { searchEverything } from '@/actions/search';

export default function Header() {
    const [searchQuery, setSearchQuery] = useState('');
    const { data: session } = useSession();
    const [showResults, setShowResults] = useState(false);
    const [avatarOverride, setAvatarOverride] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [movies, setMovies] = useState<Array<{id: string; title: string}>>([]);
    const [games, setGames] = useState<Array<{id: string; title: string}>>([]);
    const [tvShows, setTvShows] = useState<Array<{id: string; title: string}>>([]);
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

    // Listen for profile updates to refresh avatar immediately
    useEffect(() => {
        const handler = (e: Event) => {
            const ce = e as CustomEvent<{ image?: string }>;
            if (ce.detail?.image) {
                // Cache-bust
                setAvatarOverride(`${ce.detail.image}?t=${Date.now()}`);
            }
        };
        window.addEventListener('profileUpdated', handler as EventListener);
        return () => window.removeEventListener('profileUpdated', handler as EventListener);
    }, []);

    // Debounced search
    useEffect(() => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            setMovies([]);
            setUsers([]);
            setGames([]);
            setTvShows([]);
            return;
        }
        setIsLoading(true);
        const t = setTimeout(async () => {
            try {
                const data = await searchEverything(searchQuery.trim());
                setMovies((data as any).movies || []);
                setUsers((data as any).users || []);
                setGames((data as any).games || []);
                setTvShows((data as any).tvShows || []);
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
        <header className="glass-strong sticky top-0 z-50 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-teal-500 bg-clip-text text-transparent hover:from-cyan-500 hover:to-teal-400 transition-all">
                            Media Review
                        </Link>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-lg mx-8 " ref={containerRef}>
                        <form onSubmit={handleSearch} className="relative">
                            <div className="relative">
                                <Link
                                    href={`/search${searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : ''}`}
                                    aria-label="Go to search"
                                    className="absolute inset-y-0 left-0 pl-3 flex items-center"
                                >
                                    <svg
                                        className="h-5 w-5 text-gray-400 hover:text-sky-500 transition-colors"
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
                                </Link>
                                <input
                                    type="text"
                                    placeholder="Search media, users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-white/30 rounded-xl leading-5 glass placeholder-sky-700/60 text-sky-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-300 sm:text-sm transition-all"
                                />
                            </div>
                            {/* Results dropdown */}
                            {showResults && (
                                <div className="absolute z-50 mt-2 w-full rounded-2xl shadow-xl bg-white/95">
                                    {isLoading ? (
                                        <div className="p-4 text-sm text-sky-700 font-medium">Searching...</div>
                                    ) : (
                                        <div className="max-h-80 overflow-auto">
                                            {/* Movies */}
                                            <div className="p-2">
                                                <div className="px-2 py-1 text-xs font-semibold text-sky-600 uppercase">Movies</div>
                                                {movies.length === 0 ? (
                                                    <div className="px-2 py-2 text-sm text-sky-600">No movies found</div>
                                                ) : (
                                                    movies.slice(0,5).map((m) => (
                                                        <div key={m.id} className="px-2 py-2 hover:bg-sky-600/10 cursor-pointer text-sm text-sky-800 rounded-lg transition-all" onClick={() => setShowResults(false)}>
                                                            {m.title}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            {/* Games */}
                                            <div className="p-2">
                                                <div className="px-2 py-1 text-xs font-semibold text-sky-600 uppercase">Games</div>
                                                {games.length === 0 ? (
                                                    <div className="px-2 py-2 text-sm text-sky-600">No games found</div>
                                                ) : (
                                                    games.slice(0,5).map((g) => (
                                                        <div key={g.id} className="px-2 py-2 hover:bg-sky-600/10 cursor-pointer text-sm text-sky-800 rounded-lg transition-all" onClick={() => setShowResults(false)}>
                                                            {g.title}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            {/* TV Shows */}
                                            <div className="p-2">
                                                <div className="px-2 py-1 text-xs font-semibold text-sky-600 uppercase">TV Shows</div>
                                                {tvShows.length === 0 ? (
                                                    <div className="px-2 py-2 text-sm text-sky-600">No TV shows found</div>
                                                ) : (
                                                    tvShows.slice(0,5).map((t) => (
                                                        <div key={t.id} className="px-2 py-2 hover:bg-sky-600/10 cursor-pointer text-sm text-sky-800 rounded-lg transition-all" onClick={() => setShowResults(false)}>
                                                            {t.title}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <hr className="border-white/20" />
                                            {/* Users */}
                                            <div className="p-2">
                                                <div className="px-2 py-1 text-xs font-semibold text-sky-600 uppercase">Users</div>
                                                {users.length === 0 ? (
                                                    <div className="px-2 py-2 text-sm text-sky-600">No users found</div>
                                                ) : (
                                                    users.slice(0,5).map((u) => (
                                                        <div key={u.id} className="px-2 py-2 hover:bg-sky-600/10 cursor-pointer text-sm text-sky-800 rounded-lg transition-all" onClick={() => setShowResults(false)}>
                                                            {u.username}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <div className="p-2 border-t border-white/20">
                                                <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} className="block text-center text-sm text-cyan-600 hover:text-cyan-500 font-semibold transition-colors" onClick={() => setShowResults(false)}>
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
                                    href="/movies"
                                    className="text-sky-800 hover:text-cyan-600 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/20"
                                >
                                    Movies
                                </Link>
                                <Link
                                    href="/games"
                                    className="text-sky-800 hover:text-cyan-600 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/20"
                                >
                                    Games
                                </Link>
                                <Link
                                    href="/dashboard"
                                    className="text-sky-800 hover:text-cyan-600 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/20"
                                >
                                    Dashboard
                                </Link>
                                <img
                                    src={avatarOverride || session.user?.image || '/default.jpg'}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full cursor-pointer"
                                    onClick={() => window.location.href = '/user/profile'}
                                />
                                <button
                                    onClick={async () => {
                                        await signOut({ redirect: false });
                                        window.location.href = '/';
                                    }}
                                    className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl glow-soft"
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link
                                    href="/movies"
                                    className="text-sky-800 hover:text-cyan-600 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/20"
                                >
                                    Movies
                                </Link>
                                <Link
                                    href="/games"
                                    className="text-sky-800 hover:text-cyan-600 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/20"
                                >
                                    Games
                                </Link>
                                <Link
                                    href="/auth/signin"
                                    className="text-sky-800 hover:text-cyan-600 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/20"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl glow-soft"
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
