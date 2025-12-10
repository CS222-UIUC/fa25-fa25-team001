"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface WishlistButtonProps {
  type: 'game' | 'movie' | 'tv';
  itemId: string;
  itemName: string;
  itemCover?: string;
  itemYear?: number;
  onToggle?: (isInWishlist: boolean) => void;
}

export default function WishlistButton({ 
  type, 
  itemId, 
  itemName, 
  itemCover, 
  itemYear,
  onToggle 
}: WishlistButtonProps) {
  const { data: session } = useSession();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (session) {
      checkWishlistStatus();
    } else {
      setChecking(false);
    }
  }, [session, itemId, type]);

  const checkWishlistStatus = async () => {
    if (!session) return;
    
    try {
      const response = await fetch(`/api/wishlist/${type}/check?itemId=${encodeURIComponent(itemId)}`);
      const data = await response.json();
      setIsInWishlist(data.isInWishlist || false);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleToggle = async () => {
    if (!session) {
      alert('Please sign in to add items to your wishlist');
      return;
    }

    setLoading(true);
    try {
      if (isInWishlist) {
        // Remove from wishlist
        const response = await fetch(`/api/wishlist/${type}/remove`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId }),
        });
        const data = await response.json();
        if (data.success) {
          setIsInWishlist(false);
          onToggle?.(false);
        }
      } else {
        // Add to wishlist
        const response = await fetch(`/api/wishlist/${type}/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId,
            itemName,
            itemCover,
            itemYear,
          }),
        });
        const data = await response.json();
        if (data.success) {
          setIsInWishlist(true);
          onToggle?.(true);
        } else if (data.error) {
          alert(data.error);
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      alert('Failed to update wishlist');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
      >
        Loading...
      </button>
    );
  }

  if (!session) {
    return null; // Don't show button if not logged in
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        isInWishlist
          ? 'bg-rose-500 hover:bg-rose-600 text-white'
          : 'bg-cyan-500 hover:bg-cyan-600 text-white'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? (
        '...'
      ) : isInWishlist ? (
        '❤️ Remove from Wishlist'
      ) : (
        '🤍 Add to Wishlist'
      )}
    </button>
  );
}


