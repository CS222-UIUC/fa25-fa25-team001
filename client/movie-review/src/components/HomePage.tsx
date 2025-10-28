"use client";

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Hero Section - Left Aligned */}
      <div className="container mx-auto px-8 py-20">
        <div className="max-w-2xl">
          <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Movie Reviews
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Discover and share your thoughts on the latest films
          </p>
          <div className="flex gap-4">
            <Link href="/auth/signin">
              <button className="px-8 py-4 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg">
                Sign In
              </button>
            </Link>
            <Link href="/auth/signup">
              <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg">
                Create an Account
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Trending Section */}
      <div className="container mx-auto px-8 py-12">
        <h2 className="text-3xl font-bold mb-6">Trending</h2>
        
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
                  <div className="aspect-[2/3] bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg mb-3 group-hover:ring-2 group-hover:ring-blue-500 transition-all transform group-hover:scale-105">
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      Movie {i}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold truncate">Movie Title {i}</h3>
                  <p className="text-xs text-gray-400">⭐ 4.5/5</p>
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

