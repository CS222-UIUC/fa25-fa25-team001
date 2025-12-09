"use client";

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface TrendingItem {
  id: string | number;
  title: string;
  year: string | number;
  poster: string;
  rating: string | number;
  type: 'movie' | 'tvshow' | 'game';
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trendingMovies, setTrendingMovies] = useState<TrendingItem[]>([]);
  const [trendingTvShows, setTrendingTvShows] = useState<TrendingItem[]>([]);
  const [trendingGames, setTrendingGames] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect to profile if user has valid session
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.replace('/profile');
    }
  }, [session, status, router]);

  // Fetch trending content
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await fetch('/api/trending');
        if (response.ok) {
          const data = await response.json();
          setTrendingMovies(data.data.movies || []);
          setTrendingTvShows(data.data.tvShows || []);
          setTrendingGames(data.data.games || []);
        }
      } catch (error) {
        console.error('Error fetching trending:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status !== 'loading' && status !== 'authenticated') {
      fetchTrending();
    }
  }, [status]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // If authenticated, show loading while redirecting
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Your Entertainment Hub
          </h1>
          <p className="text-2xl text-gray-300 mb-12">
            Discover, review, and track movies, TV shows, and games all in one place
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signup">
              <button className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-2xl">
                Get Started Free
              </button>
            </Link>
            <Link href="/auth/signin">
              <button className="px-10 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg border border-gray-600">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Trending Movies Section */}
      <TrendingSection
        title="🎬 Trending Movies"
        items={trendingMovies}
        loading={loading}
        type="movie"
      />

      {/* Trending TV Shows Section */}
      <TrendingSection
        title="📺 Trending TV Shows"
        items={trendingTvShows}
        loading={loading}
        type="tv"
      />

      {/* Trending Games Section */}
      <TrendingSection
        title="🎮 Trending Games"
        items={trendingGames}
        loading={loading}
        type="game"
      />

      {/* Features Section */}
      <div className="container mx-auto px-8 py-20">
        <h2 className="text-4xl font-bold mb-12 text-center">Why Join Us?</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            icon="⭐"
            title="Review & Rate"
            description="Share your thoughts on movies, TV shows, and games with detailed reviews and ratings"
          />
          <FeatureCard
            icon="📊"
            title="Track Your Progress"
            description="Keep track of what you've watched and played with smart lists and activity tracking"
          />
          <FeatureCard
            icon="🎮"
            title="Connect Platforms"
            description="Sync your Steam and Xbox accounts to automatically track your gaming activity"
          />
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 py-16">
        <div className="container mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-gray-300 mb-8">Join thousands of users tracking their entertainment</p>
          <Link href="/auth/signup">
            <button className="px-12 py-5 bg-white text-blue-900 hover:bg-gray-100 rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-2xl">
              Create Your Account
            </button>
          </Link>
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
          animation: scroll 40s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

function TrendingSection({ 
  title, 
  items, 
  loading,
  type 
}: { 
  title: string; 
  items: TrendingItem[]; 
  loading: boolean;
  type: string;
}) {
  if (loading) {
    return (
      <div className="container mx-auto px-8 py-12">
        <h2 className="text-3xl font-bold mb-6">{title}</h2>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-48">
              <div className="aspect-[2/3] bg-gray-700 rounded-lg mb-3 animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-700 rounded w-2/3 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-8 py-12">
      <h2 className="text-3xl font-bold mb-6">{title}</h2>
      
      <div className="relative overflow-hidden">
        <div className="flex gap-6 animate-scroll">
          {/* Duplicate items for seamless loop */}
          {[...items, ...items].map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex-shrink-0 w-48 group cursor-pointer"
            >
              <div className="aspect-[2/3] bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg mb-3 group-hover:ring-2 group-hover:ring-purple-500 transition-all transform group-hover:scale-105 overflow-hidden shadow-lg">
                {item.poster && item.poster !== 'N/A' ? (
                  <img 
                    src={item.poster} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    {item.title}
                  </div>
                )}
              </div>
              <h3 className="text-sm font-semibold truncate">{item.title}</h3>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{item.year}</span>
                <span className="text-yellow-400">⭐ {item.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: string; 
  title: string; 
  description: string;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-8 text-center hover:bg-gray-750 transition-all transform hover:scale-105 shadow-xl border border-gray-700">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

