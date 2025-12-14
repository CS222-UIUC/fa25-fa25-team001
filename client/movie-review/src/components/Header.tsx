"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { searchEverything } from '@/actions/search';
import { Search, User, LogOut, Film, Tv, Gamepad2, Menu, X, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
    const { data: session, status } = useSession();
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [movies, setMovies] = useState<Array<{id: string; title: string; year?: number; source?: string}>>([]);
    const [tvShows, setTVShows] = useState<Array<{id: string; title: string; year?: string}>>([]);
    const [games, setGames] = useState<Array<{id: number; name: string}>>([]);
    const [users, setUsers] = useState<Array<{id: string; username: string}>>([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

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
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setShowResults(false);
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-4">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <Film className="h-5 w-5" />
                            </div>
                            <span className="hidden text-xl font-bold tracking-tight sm:inline-block">
                                MovieReview
                            </span>
                        </Link>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-md mx-auto hidden md:block" ref={containerRef}>
                        <form onSubmit={handleSearch} className="relative group">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    className="w-full h-10 rounded-full border border-input bg-secondary/50 px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-secondary/80 focus:bg-background"
                                    placeholder="Search movies, shows, games..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                                />
                            </div>

                            {/* Search Results Dropdown */}
                            {showResults && (
                                <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-popover p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                    {isLoading ? (
                                        <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
                                    ) : (
                                        <div className="max-h-[60vh] overflow-y-auto space-y-4 p-2 custom-scrollbar">
                                            {movies.length > 0 && (
                                                <div>
                                                    <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Movies</h3>
                                                    {movies.map(movie => (
                                                        <Link key={movie.id} href={`/movie/${movie.id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors" onClick={() => setShowResults(false)}>
                                                            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/10 text-blue-500">
                                                                <Film className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <p className="truncate text-sm font-medium">{movie.title}</p>
                                                                <p className="text-xs text-muted-foreground">{movie.year}</p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {tvShows.length > 0 && (
                                                <div>
                                                    <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">TV Shows</h3>
                                                    {tvShows.map(show => (
                                                        <Link key={show.id} href={`/tv/${show.id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors" onClick={() => setShowResults(false)}>
                                                            <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-500/10 text-purple-500">
                                                                <Tv className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <p className="truncate text-sm font-medium">{show.title}</p>
                                                                <p className="text-xs text-muted-foreground">{show.year}</p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}

                                            {games.length > 0 && (
                                                <div>
                                                    <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Games</h3>
                                                    {games.map(game => (
                                                        <Link key={game.id} href={`/game/${game.id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors" onClick={() => setShowResults(false)}>
                                                            <div className="flex h-8 w-8 items-center justify-center rounded bg-green-500/10 text-green-500">
                                                                <Gamepad2 className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <p className="truncate text-sm font-medium">{game.name}</p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}

                                            {users.length > 0 && (
                                                <div>
                                                    <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Users</h3>
                                                    {users.map(user => (
                                                        <Link key={user.id} href={`/profile/${user.username}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors" onClick={() => setShowResults(false)}>
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                                                                <User className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <p className="truncate text-sm font-medium">{user.username}</p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}

                                            {movies.length === 0 && tvShows.length === 0 && games.length === 0 && users.length === 0 && (
                                                <div className="p-4 text-center text-sm text-muted-foreground">
                                                    No results found.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        {status === 'authenticated' ? (
                            <>
                                <Link href="/profile" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
                                        {session.user?.image ? (
                                            <img src={session.user.image} alt={session.user.name || 'User'} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-4 w-4" />
                                        )}
                                    </div>
                                    <span>{session.user?.name || 'Profile'}</span>
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                                    title="Sign out"
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href="/auth/signin">
                                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                                        Sign In
                                    </button>
                                </Link>
                                <Link href="/auth/signup">
                                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                                        Sign Up
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? (
                            <X className="block h-6 w-6" />
                        ) : (
                            <Menu className="block h-6 w-6" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-border bg-background">
                    <div className="space-y-1 px-2 pb-3 pt-2">
                        <form onSubmit={handleSearch} className="mb-4 px-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    className="w-full h-10 rounded-md border border-input bg-secondary/50 px-10 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </form>
                        {status === 'authenticated' ? (
                            <>
                                <Link
                                    href="/profile"
                                    className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Profile
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/auth/signin"
                                    className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
