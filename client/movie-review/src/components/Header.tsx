'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle search logic here
        console.log('Search query:', searchQuery);
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <Link href="/" className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                            MovieReview
                        </Link>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-lg mx-8">
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
                        </form>
                    </div>

                    {/* Navigation */}
                    <nav className="flex items-center space-x-4">
                        <Link
                            href="/profile"
                            className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-bold transition-colors"
                        >
                            Profile
                        </Link>
                        <Link
                            href="/signin"
                            className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-bold transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/signup"
                            className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-bold transition-colors"
                        >
                            Sign Up
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}
