"use client";

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300 relative overflow-hidden">
      {/* Decorative bubbles */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-white/20 rounded-full blur-xl float-animation"></div>
      <div className="absolute top-40 right-20 w-48 h-48 bg-cyan-300/30 rounded-full blur-2xl float-animation" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-teal-300/25 rounded-full blur-xl float-animation" style={{ animationDelay: '4s' }}></div>
      
      {/* Hero Section - Centered */}
      <div className="container mx-auto px-8 py-20 relative z-10 flex items-center justify-center min-h-screen">
        <div className="max-w-2xl text-center">
          <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-600 via-teal-500 to-sky-600 bg-clip-text text-transparent drop-shadow-lg">
            Media Review
          </h1>
          <p className="text-xl text-sky-800 mb-8 font-medium">
            Discover and share your thoughts on movies, TV shows, and video games
          </p>
          <div className="flex gap-4 justify-center">
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
    </div>
  );
}

