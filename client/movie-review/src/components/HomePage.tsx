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

      {/* Trending Section */}
      <div className="container mx-auto px-8 py-12 relative z-10">
        <h2 className="text-3xl font-bold mb-6 text-sky-800 drop-shadow-md">Trending</h2>
        
        {/* Scrolling Movie Bar */}
        <div className="relative overflow-hidden">
          <div className="flex gap-6 animate-scroll">
            {/* Placeholder Movie Cards - Duplicated for seamless loop */}
            {[...Array(2)].map((_, setIndex) => (
              [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={`${setIndex}-${i}`}
                  className="flex-shrink-0 w-48 group cursor-pointer"
                >
                  <div className="aspect-[2/3] glass-strong rounded-2xl mb-3 group-hover:ring-2 group-hover:ring-cyan-400/50 transition-all transform group-hover:scale-105 shadow-lg hover:shadow-xl">
                    <div className="w-full h-full flex items-center justify-center text-sky-700 font-medium">
                      Movie {i}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold truncate text-sky-800">Movie Title {i}</h3>
                  <p className="text-xs text-sky-600">⭐ 4.5/5</p>
                </div>
              ))
            ))}
          </div>
        </div>
      </div>

      {/* CSS for scroll animation */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

