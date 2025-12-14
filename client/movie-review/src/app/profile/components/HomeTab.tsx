"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Star, Activity, User, Film, Gamepad2, Tv, Clock, Heart, ArrowRight, Sparkles } from 'lucide-react';

interface User {
  id?: string;
  username: string;
  bio: string | null;
  profilePicture: string;
  followersCount: number;
}

interface HomeTabProps {
  user: User;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  image?: string;
  rating?: number;
}

interface FavoriteItem {
  id: string;
  title: string;
  image?: string;
  type: 'movie' | 'tv' | 'game';
}

interface ListItem {
  id: string;
  title: string;
  count: number;
}

export default function HomeTab({ user }: HomeTabProps) {
  const { data: session } = useSession();
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [lists, setLists] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = session?.user?.id === user.id;

  useEffect(() => {
    if (user.id) {
      loadData();
    }
  }, [user.id]);

  const loadData = async () => {
    try {
      // Load recent activity
      const activityRes = await fetch(`/api/users/activity?userId=${user.id}&limit=5`);
      if (activityRes.ok) {
        const data = await activityRes.json();
        setRecentActivity(data.activities || []);
      }

      // Load favorites preview
      const favRes = await fetch(`/api/users/favorites?userId=${user.id}`);
      if (favRes.ok) {
        const data = await favRes.json();
        const favs: FavoriteItem[] = [];
        
        // Get top 2 of each
        if (data.favoriteMovies) {
          data.favoriteMovies.slice(0, 2).forEach((m: any) => favs.push({
            id: m.id, title: m.title, image: m.poster, type: 'movie'
          }));
        }
        if (data.favoriteTvShows) {
          data.favoriteTvShows.slice(0, 2).forEach((t: any) => favs.push({
            id: t.id, title: t.title, image: t.poster, type: 'tv'
          }));
        }
        if (data.favoriteGames) {
          data.favoriteGames.slice(0, 2).forEach((g: any) => favs.push({
            id: g.id, title: g.name, image: g.background_image || g.cover, type: 'game'
          }));
        }
        setFavorites(favs);
      }

      // Load lists preview
      const listsRes = await fetch(`/api/lists?userId=${user.id}`);
      if (listsRes.ok) {
        const data = await listsRes.json();
        setLists(data.lists.slice(0, 3).map((l: any) => ({
          id: l.id,
          title: l.title,
          count: l._count.items
        })));
      }

    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} 
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome / Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-8 border border-primary/10">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {isOwnProfile ? `Welcome back, ${user.username}!` : `${user.username}'s Overview`}
            </h2>
            <p className="text-muted-foreground max-w-xl">
              {user.bio || "No bio yet."}
            </p>
          </div>
          <div className="hidden md:block">
            <Sparkles className="h-12 w-12 text-primary/40" />
          </div>
        </div>
        
        {/* Quick Stats / Actions */}
        <div className="flex gap-4 mt-6">
          <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-full border border-border/50">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="font-medium">{favorites.length} Favorites</span>
          </div>
          <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-full border border-border/50">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{lists.length} Lists</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Favorites Preview */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Top Favorites
            </h3>
          </div>
          
          {favorites.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {favorites.map((item) => (
                <Link 
                  key={`${item.type}-${item.id}`} 
                  href={`/${item.type === 'game' ? 'game' : item.type === 'movie' ? 'movie' : 'tv'}/${item.id}`}
                  className="group relative aspect-video bg-secondary rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all"
                >
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {item.type === 'movie' ? <Film /> : item.type === 'tv' ? <Tv /> : <Gamepad2 />}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
                    <p className="text-white font-medium text-sm truncate">{item.title}</p>
                    <p className="text-white/70 text-xs capitalize">{item.type}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground">
              No favorites added yet.
            </div>
          )}
        </section>

        {/* Lists Preview */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Lists
            </h3>
          </div>

          <div className="space-y-3">
            {lists.length > 0 ? (
              lists.map((list) => (
                <div key={list.id} className="group bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">{list.title}</h4>
                      <p className="text-xs text-muted-foreground">{list.count} items</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              ))
            ) : (
              <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground">
                No lists created yet.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Recent Activity */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </h3>
        </div>

        {recentActivity.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recentActivity.map((item) => (
              <div key={item.id} className="group relative aspect-[2/3] bg-secondary rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Activity className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-white font-medium text-sm truncate">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
            No recent activity.
          </div>
        )}
      </section>
    </div>
  );
}
