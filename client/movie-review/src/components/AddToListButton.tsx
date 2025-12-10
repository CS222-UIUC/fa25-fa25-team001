"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface AddToListButtonProps {
  itemType: 'game' | 'movie' | 'tv';
  itemId: string;
  itemName: string;
  itemCover?: string;
  itemYear?: number;
}

interface List {
  id: string;
  title: string;
  itemCount: number;
  mediaType?: string;
}

export default function AddToListButton({
  itemType,
  itemId,
  itemName,
  itemCover,
  itemYear,
}: AddToListButtonProps) {
  const { data: session } = useSession();
  const [lists, setLists] = useState<List[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session && showDropdown) {
      loadLists();
    }
  }, [session, showDropdown]);

  const loadLists = async () => {
    try {
      const response = await fetch('/api/lists');
      const data = await response.json();
      if (data.success) {
        // Filter lists by media type if specified, or show all
        const filteredLists = (data.lists || []).filter((list: List) => 
          !list.mediaType || list.mediaType === itemType || list.mediaType === ''
        );
        setLists(filteredLists);
      }
    } catch (error) {
      console.error('Error loading lists:', error);
    }
  };

  const handleAddToList = async (listId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType,
          externalId: itemId,
          itemName,
          itemCover,
          itemYear,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const listTitle = lists.find(l => l.id === listId)?.title || 'list';
        setShowDropdown(false);
        // Simple notification - user can navigate to list themselves
        const notification = document.createElement('div');
        notification.textContent = `✓ Added to "${listTitle}"!`;
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 20px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-weight: 500;';
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.style.transition = 'opacity 0.3s';
          notification.style.opacity = '0';
          setTimeout(() => notification.remove(), 300);
        }, 2000);
      } else {
        alert(data.error || 'Failed to add to list');
      }
    } catch (error) {
      console.error('Error adding to list:', error);
      alert(`Failed to add to list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading}
        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
      >
        {loading ? '...' : '+ Add to List'}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full mt-2 right-0 w-64 glass-strong rounded-xl shadow-2xl z-20 max-h-96 overflow-y-auto">
            {lists.length === 0 ? (
              <div className="p-4 text-center text-sky-600">
                <p className="mb-2">No lists yet</p>
                <a
                  href="/lists"
                  className="text-cyan-600 hover:text-cyan-500 text-sm font-medium"
                >
                  Create a list
                </a>
              </div>
            ) : (
              <div className="p-2">
                {lists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => handleAddToList(list.id)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/20 text-sky-800 text-sm transition-all"
                  >
                    <div className="font-semibold">{list.title}</div>
                    <div className="text-xs text-sky-600">{list.itemCount} items</div>
                  </button>
                ))}
                <div className="border-t border-white/20 mt-2 pt-2">
                  <a
                    href="/lists"
                    className="block text-center px-3 py-2 text-cyan-600 hover:text-cyan-500 text-sm font-medium"
                    onClick={() => setShowDropdown(false)}
                  >
                    + Create New List
                  </a>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

