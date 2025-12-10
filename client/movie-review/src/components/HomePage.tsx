"use client";

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300 relative overflow-hidden">
      {/* Decorative bubbles */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-white/20 rounded-full blur-xl float-animation"></div>
      <div className="absolute top-40 right-20 w-48 h-48 bg-cyan-300/30 rounded-full blur-2xl float-animation" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-teal-300/25 rounded-full blur-xl float-animation" style={{ animationDelay: '4s' }}></div>
      
      {/* Hero Section - Left Aligned */}
      <div className="container mx-auto px-8 py-20 relative z-10">
        <div className="max-w-2xl">
          <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-600 via-teal-500 to-sky-600 bg-clip-text text-transparent drop-shadow-lg">
            Media Reviews
          </h1>
          <p className="text-xl text-sky-800 mb-8 font-medium">
            Discover and share your thoughts on movies, TV shows, and games
          </p>
          <div className="flex gap-4">
            <Link href="/auth/signin">
              <button className="px-8 py-4 glass-strong rounded-2xl font-semibold text-lg text-sky-800 transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl hover:bg-white/40">
                Sign In
              </button>
            </Link>
            <Link href="/auth/signup">
              <button className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white rounded-2xl font-semibold text-lg transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl glow-soft">
                Create an Account
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Lists Section */}
      <div className="container mx-auto px-8 py-12 relative z-10">
        <h2 className="text-3xl font-bold mb-6 text-sky-800 drop-shadow-md">Create Custom Lists</h2>
        <p className="text-lg text-sky-700 mb-8 max-w-2xl">
          Organize your favorite movies, TV shows, and games into custom lists. Create ranked lists like "Top 5 Games with the Best Battle Systems" or "Top 5 Movies with the Best Art Direction".
        </p>
        <Link href="/lists">
          <button className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white rounded-2xl font-semibold text-lg transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl glow-soft">
            View My Lists
          </button>
        </Link>
      </div>
    </div>
  );
}

