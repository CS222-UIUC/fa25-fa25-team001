"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { UserMinus, Users, Search } from 'lucide-react';

interface User {
  id: string;
  username: string;
  profilePicture: string;
}

interface FriendsTabProps {
  user: User;
}

export default function FriendsTab({ user }: FriendsTabProps) {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<'followers' | 'following'>('followers');

  // Global user search (only meaningful on own profile)
  const [findQuery, setFindQuery] = useState('');
  const [findResults, setFindResults] = useState<User[]>([]);
  const [isFinding, setIsFinding] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadUsers();
  }, [user.id, mode]);

  useEffect(() => {
    const sessionUserId = session?.user?.id;
    if (!sessionUserId) return;
    if (sessionUserId !== user.id) return;

    const loadFollowingIds = async () => {
      try {
        const response = await fetch(`/api/following/list?userId=${sessionUserId}`);
        if (!response.ok) return;
        const data = await response.json();
        const ids = new Set<string>((data.following || []).map((u: any) => u.id));
        setFollowingIds(ids);
      } catch {
        // ignore
      }
    };

    loadFollowingIds();
  }, [session?.user?.id, user.id]);

  const loadUsers = async () => {
    try {
      const response = await fetch(
        mode === 'followers'
          ? `/api/followers/list?userId=${user.id}`
          : `/api/following/list?userId=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setUsers((mode === 'followers' ? data.followers : data.following) || []);
      }
    } catch (error) {
      console.error('Failed to load followers/following:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (!confirm('Unfollow this user?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/followers/unfollow?userId=${encodeURIComponent(targetUserId)}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== targetUserId));
      }
    } catch (error) {
      console.error('Failed to unfollow:', error);
    }
  };

  const filteredUsers = users.filter((u) => u.username.toLowerCase().includes(searchQuery.toLowerCase()));

  const isOwnProfile = session?.user?.id === user.id;

  const handleFindUsers = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isOwnProfile) return;
    if (!findQuery.trim()) {
      setFindResults([]);
      return;
    }

    setIsFinding(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(findQuery.trim())}&limit=12`);
      if (response.ok) {
        const data = await response.json();
        const results = (data.users || [])
          .filter((u: any) => u.id !== session?.user?.id)
          .map((u: any) => ({
            id: u.id,
            username: u.username,
            profilePicture: u.profilePicture,
          }));
        setFindResults(results);
      }
    } catch (error) {
      console.error('User search failed:', error);
    } finally {
      setIsFinding(false);
    }
  };

  const handleFollowToggle = async (target: User) => {
    if (!isOwnProfile || !session?.user?.id) return;
    const currentlyFollowing = followingIds.has(target.id);

    try {
      const response = currentlyFollowing
        ? await fetch(`/api/followers/unfollow?userId=${encodeURIComponent(target.id)}`, { method: 'DELETE' })
        : await fetch('/api/followers/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: target.id }),
          });

      if (!response.ok) return;

      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (currentlyFollowing) next.delete(target.id);
        else next.add(target.id);
        return next;
      });
    } catch (error) {
      console.error('Follow toggle failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">{mode === 'followers' ? 'Followers' : 'Following'} ({users.length})</h2>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            setLoading(true);
            setMode('followers');
          }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
            mode === 'followers'
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-secondary border-transparent hover:bg-secondary/80'
          }`}
        >
          Followers
        </button>
        <button
          onClick={() => {
            setLoading(true);
            setMode('following');
          }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
            mode === 'following'
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-secondary border-transparent hover:bg-secondary/80'
          }`}
        >
          Following
        </button>
      </div>

      {isOwnProfile && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold mb-3">Find users</h3>
          <form onSubmit={handleFindUsers} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users by username..."
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              className="w-full bg-secondary border border-input rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </form>

          {isFinding ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : findResults.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {findResults.map((u) => (
                <div
                  key={u.id}
                  className="bg-secondary/30 border border-border rounded-lg p-3 flex items-center gap-3"
                >
                  <Link href={`/profile/${encodeURIComponent(u.username)}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-border bg-secondary flex-shrink-0">
                      <img
                        src={u.profilePicture || '/uploads/profiles/default.png'}
                        alt={u.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{u.username}</div>
                      <div className="text-xs text-muted-foreground truncate">View profile</div>
                    </div>
                  </Link>

                  <button
                    onClick={() => handleFollowToggle(u)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      followingIds.has(u.id)
                        ? 'bg-secondary border-border hover:bg-secondary/80 text-foreground'
                        : 'bg-primary/10 border-primary text-primary hover:bg-primary/15'
                    }`}
                  >
                    {followingIds.has(u.id) ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          ) : findQuery.trim() ? (
            <div className="mt-4 text-sm text-muted-foreground">No users found</div>
          ) : null}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={`Filter ${mode === 'followers' ? 'followers' : 'following'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-secondary border border-input rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredUsers.map((u) => (
            <div key={u.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/50 transition-colors group">
              <Link href={`/profile/${encodeURIComponent(u.username)}`} className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-border group-hover:ring-2 group-hover:ring-primary transition-all">
                  <img
                    src={u.profilePicture || '/uploads/profiles/default.png'}
                    alt={u.username}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>
              
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${encodeURIComponent(u.username)}`} className="font-semibold hover:text-primary truncate block">
                  {u.username}
                </Link>
                <p className="text-xs text-muted-foreground truncate">
                  View Profile
                </p>
              </div>

              {isOwnProfile && mode === 'following' && (
                <button
                  onClick={() => handleUnfollow(u.id)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Unfollow"
                >
                  <UserMinus className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">
            {searchQuery ? 'No users found' : mode === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery 
              ? `No users match "${searchQuery}"`
              : isOwnProfile
                ? mode === 'followers'
                  ? "When people follow you, they'll show up here."
                  : "Users you follow will show up here."
                : mode === 'followers'
                  ? "This user doesn't have any followers yet."
                  : "This user isn't following anyone yet."}
          </p>
        </div>
      )}
    </div>
  );
}
