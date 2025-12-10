'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
    const { data: session } = useSession();
    const [avatarOverride, setAvatarOverride] = useState<string | undefined>(undefined);

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
                                    href="/tv"
                                    className="text-sky-800 hover:text-cyan-600 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/20"
                                >
                                    TV Shows
                                </Link>
                                <Link
                                    href="/games"
                                    className="text-sky-800 hover:text-cyan-600 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/20"
                                >
                                    Games
                                </Link>
                                <Link
                                    href="/lists"
                                    className="text-sky-800 hover:text-cyan-600 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/20"
                                >
                                    My Lists
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
                                    href="/tv"
                                    className="text-sky-800 hover:text-cyan-600 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/20"
                                >
                                    TV Shows
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
