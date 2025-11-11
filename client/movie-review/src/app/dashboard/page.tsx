"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getUserProfile } from "@/actions/user";
import { getMyReviews, getMyWatchlist } from "@/actions/media";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<{ name: string; email: string; image: string }>({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    image: session?.user?.image || "/default.jpg",
  });
  const [recentReviews, setRecentReviews] = useState<Array<{ id: string; movieTitle: string; rating: number; comment: string; date: string }>>([]);
  const [watchlistPreview, setWatchlistPreview] = useState<Array<{ id: string; title: string; year: number | null }>>([]);

  // Load fresh profile/reviews/watchlist and subscribe to profile updates
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [p, r, w] = await Promise.all([
          getUserProfile(),
          getMyReviews(),
          getMyWatchlist(),
        ]);
        if (!mounted) return;
        if ((p as any)?.success && (p as any).user) {
          const u = (p as any).user;
          setProfile({ name: u.username, email: u.email, image: u.profilePicture || "/default.jpg" });
        }
        if ((r as any)?.reviews) {
          setRecentReviews(((r as any).reviews as any[]).slice(0, 3));
        }
        if ((w as any)?.items) {
          setWatchlistPreview(((w as any).items as any[]).slice(0, 3));
        }
      } catch {}
    };
    load();

    const onProfileUpdated = async () => {
      const res = await getUserProfile();
      if ((res as any)?.success && (res as any).user) {
        const u = (res as any).user;
        // cache-bust image to avoid stale avatar
        const img = (u.profilePicture || "/default.jpg") + `?t=${Date.now()}`;
        setProfile({ name: u.username, email: u.email, image: img });
      }
    };
    window.addEventListener("profileUpdated", onProfileUpdated as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener("profileUpdated", onProfileUpdated as EventListener);
    };
  }, [session?.user?.id]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-whitebg-gray-900">
        <div className="text-xl text-gray-900text-white">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-whitebg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900text-white">Please sign in to access your dashboard</h1>
          <Link href="/auth/signin" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-cyan-200 to-teal-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent drop-shadow-md">Welcome to your Dashboard</h1>
          <p className="text-sky-700 mt-2 font-medium">Manage your movie reviews and preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="glass-strong rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all">
            <h2 className="text-sky-800 text-xl font-semibold mb-4">Profile</h2>
            <div className="flex items-center space-x-4 mb-4">
              <img src={profile.image || "/default.jpg"} alt="Profile" className="w-16 h-16 rounded-full ring-2 ring-cyan-300/50" />
              <div>
                <h3 className="text-sky-800 font-semibold">{profile.name}</h3>
                <p className="text-sky-600 text-sm">{profile.email}</p>
              </div>
            </div>
            <Link
              href="/user/profile"
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl glow-soft inline-block"
            >
              View Profile
            </Link>
          </div>

          {/* Recent Reviews Card */}
          <div className="glass-strong rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all">
            <h2 className="text-sky-800 text-xl font-semibold mb-4">Recent Reviews</h2>
            {recentReviews.length === 0 ? (
              <p className="text-sky-600">No reviews yet</p>
            ) : (
              <ul className="divide-y divide-white/20">
                {recentReviews.map((r) => (
                  <li key={r.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-sky-800">{r.movieTitle}</p>
                        <p className="text-sm text-sky-600">{r.comment}</p>
                      </div>
                      <div className="text-amber-500 ml-4">{"⭐".repeat(r.rating)}</div>
                    </div>
                    <p className="text-xs text-sky-500 mt-1">{r.date}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex gap-2">
              <Link href="/user/profile" className="bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl glow-soft inline-block">
                Write a Review
              </Link>
            </div>
          </div>

          {/* Watchlist Card */}
          <div className="glass-strong rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all">
            <h2 className="text-sky-800 text-xl font-semibold mb-4">Watchlist</h2>
            {watchlistPreview.length === 0 ? (
              <p className="text-sky-600">Your watchlist is empty</p>
            ) : (
              <ul className="space-y-2">
                {watchlistPreview.map((i) => (
                  <li key={i.id} className="flex items-center justify-between text-sm">
                    <span className="text-sky-800 font-medium">{i.title}</span>
                    <span className="text-sky-600">{i.year ?? ""}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex gap-2">
              <Link href="/user/profile" className="bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-300 hover:to-pink-300 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl glow-soft inline-block">
                Manage Watchlist
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}