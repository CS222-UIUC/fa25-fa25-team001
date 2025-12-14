"use client";

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Star, Film, Tv, Gamepad2, BarChart2, Share2, Zap } from 'lucide-react';
import Header from './Header';

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
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background z-0"></div>
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            Your Ultimate <br /> Entertainment Tracker
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Discover, review, and track movies, TV shows, and games all in one place. 
            Join a community of entertainment enthusiasts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <button className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-primary/25">
                Get Started Free
              </button>
            </Link>
            <Link href="/auth/signin">
              <button className="w-full sm:w-auto px-8 py-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full font-semibold text-lg transition-all border border-border">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Sections */}
      <div className="space-y-16 pb-20">
        <TrendingSection
          title="Trending Movies"
          icon={<Film className="h-6 w-6 text-blue-500" />}
          items={trendingMovies}
          loading={loading}
          type="movie"
        />

        <TrendingSection
          title="Trending TV Shows"
          icon={<Tv className="h-6 w-6 text-purple-500" />}
          items={trendingTvShows}
          loading={loading}
          type="tv"
        />

        <TrendingSection
          title="Trending Games"
          icon={<Gamepad2 className="h-6 w-6 text-green-500" />}
          items={trendingGames}
          loading={loading}
          type="game"
        />
      </div>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Join MovieReview?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We provide the best tools to track your entertainment journey across all platforms.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Star className="h-10 w-10 text-yellow-500" />}
              title="Rate & Review"
              description="Share your detailed thoughts on movies, TV shows, and games with our community."
            />
            <FeatureCard
              icon={<BarChart2 className="h-10 w-10 text-blue-500" />}
              title="Track Progress"
              description="Keep track of what you've watched and played with smart lists and activity tracking."
            />
            <FeatureCard
              icon={<Zap className="h-10 w-10 text-orange-500" />}
              title="Sync Platforms"
              description="Connect Steam and Xbox to automatically sync your gaming library and achievements."
            />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 z-0"></div>
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to start tracking?</h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of users building their personal entertainment library.
          </p>
          <Link href="/auth/signup">
            <button className="px-10 py-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-bold text-lg transition-all shadow-xl hover:shadow-primary/25">
              Create Your Account
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function TrendingSection({ 
  title, 
  icon,
  items, 
  loading,
  type 
}: { 
  title: string; 
  icon: React.ReactNode;
  items: TrendingItem[]; 
  loading: boolean;
  type: string;
}) {
  if (loading) {
    return (
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          {icon}
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[2/3] bg-secondary rounded-xl animate-pulse"></div>
              <div className="h-4 bg-secondary rounded w-3/4 animate-pulse"></div>
              <div className="h-3 bg-secondary rounded w-1/2 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <Link href={`/search?type=${type}`} className="text-sm font-medium text-primary hover:underline">
          View All
        </Link>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.slice(0, 6).map((item) => (
          <Link href={`/${type === 'tv' ? 'tv' : type}/${item.id}`} key={item.id} className="group">
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary mb-3 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-[1.02] group-hover:ring-2 group-hover:ring-primary/50">
              {item.poster && item.poster !== 'N/A' ? (
                <img 
                  src={item.poster} 
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary">
                  <span className="text-xs text-center px-2">{item.title}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{item.rating}</span>
                </div>
              </div>
            </div>
            <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.year}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="bg-card text-card-foreground rounded-2xl p-8 text-center hover:bg-accent/50 transition-all duration-300 border border-border hover:border-primary/20 shadow-sm hover:shadow-md">
      <div className="mb-6 flex justify-center">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
