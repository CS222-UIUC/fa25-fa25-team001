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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to access your dashboard</h1>
          <Link href="/auth/signin" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to your Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your movie reviews and preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-black text-xl font-semibold mb-4">Profile</h2>
            <div className="flex items-center space-x-4 mb-4">
              <img src={profile.image || "/default.jpg"} alt="Profile" className="w-16 h-16 rounded-full" />
              <div>
                <h3 className=" text-black font-medium">{profile.name}</h3>
                <p className=" text-black text-sm">{profile.email}</p>
              </div>
            </div>
            <Link
              href="/user/profile"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
            >
              View Profile
            </Link>
          </div>

          {/* Recent Reviews Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-black text-xl font-semibold mb-4">Recent Reviews</h2>
            {recentReviews.length === 0 ? (
              <p className="text-gray-600">No reviews yet</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {recentReviews.map((r) => (
                  <li key={r.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{r.movieTitle}</p>
                        <p className="text-sm text-gray-600">{r.comment}</p>
                      </div>
                      <div className="text-yellow-500 ml-4">{"⭐".repeat(r.rating)}</div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{r.date}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex gap-2">
              <Link href="/user/profile" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm">
                Write a Review
              </Link>
            </div>
          </div>

          {/* Watchlist Card */}
          <div className="text-black bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Watchlist</h2>
            {watchlistPreview.length === 0 ? (
              <p className="text-gray-600">Your watchlist is empty</p>
            ) : (
              <ul className="space-y-2">
                {watchlistPreview.map((i) => (
                  <li key={i.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-900">{i.title}</span>
                    <span className="text-gray-500">{i.year ?? ""}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex gap-2">
              <Link href="/user/profile" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-sm">
                Manage Watchlist
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}