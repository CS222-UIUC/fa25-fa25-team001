"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getUserProfile } from "@/actions/user";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [username, setUsername] = useState<string>("");

  // Load username
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const p = await getUserProfile();
        if (!mounted) return;
        if ((p as any)?.success && (p as any).user) {
          const u = (p as any).user;
          setUsername(u.username || "");
        }
      } catch {}
    };
    if (session) {
      load();
    }

    const onProfileUpdated = async () => {
      const res = await getUserProfile();
      if ((res as any)?.success && (res as any).user) {
        const u = (res as any).user;
        setUsername(u.username || "");
      }
    };
    window.addEventListener("profileUpdated", onProfileUpdated as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener("profileUpdated", onProfileUpdated as EventListener);
    };
  }, [session]);

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
        <div className="mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent drop-shadow-md">
            Welcome, {username || "User"}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Movies Block */}
          <Link
            href="/movies"
            className="group glass-strong rounded-3xl shadow-xl p-12 hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-full bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center py-8 mb-6 group-hover:scale-105 transition-transform">
                <h2 className="text-4xl font-bold text-white">Movies</h2>
              </div>
              <p className="text-sky-600 text-lg">Search and discover movies</p>
            </div>
          </Link>

          {/* TV Shows Block */}
          <Link
            href="/tv"
            className="group glass-strong rounded-3xl shadow-xl p-12 hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-full bg-gradient-to-br from-purple-400 to-indigo-500 rounded-2xl flex items-center justify-center py-8 mb-6 group-hover:scale-105 transition-transform">
                <h2 className="text-4xl font-bold text-white">TV Shows</h2>
              </div>
              <p className="text-sky-600 text-lg">Explore TV series and shows</p>
            </div>
          </Link>

          {/* Games Block */}
          <Link
            href="/games"
            className="group glass-strong rounded-3xl shadow-xl p-12 hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-full bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center py-8 mb-6 group-hover:scale-105 transition-transform">
                <h2 className="text-4xl font-bold text-white">Games</h2>
              </div>
              <p className="text-sky-600 text-lg">Browse video games</p>
            </div>
          </Link>

          {/* My Lists Block */}
          <Link
            href="/lists"
            className="group glass-strong rounded-3xl shadow-xl p-12 hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-full bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center py-8 mb-6 group-hover:scale-105 transition-transform">
                <h2 className="text-4xl font-bold text-white">My Lists</h2>
              </div>
              <p className="text-sky-600 text-lg">Manage your custom lists</p>
            </div>
          </Link>

          {/* Reviews Block */}
          <Link
            href="/dashboard/reviews"
            className="group glass-strong rounded-3xl shadow-xl p-12 hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-full bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center py-8 mb-6 group-hover:scale-105 transition-transform">
                <h2 className="text-4xl font-bold text-white">Reviews</h2>
              </div>
              <p className="text-sky-600 text-lg">Share and read reviews</p>
            </div>
          </Link>

          {/* Friends Block */}
          <Link
            href="/dashboard/friends"
            className="group glass-strong rounded-3xl shadow-xl p-12 hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-full bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center py-8 mb-6 group-hover:scale-105 transition-transform">
                <h2 className="text-4xl font-bold text-white">Friends</h2>
              </div>
              <p className="text-sky-600 text-lg">Connect with other users</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}