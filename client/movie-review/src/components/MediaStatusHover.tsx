'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface MediaStatusHoverProps {
  mediaId: string;
  mediaType: 'movie' | 'tv' | 'game';
  mediaTitle: string;
  currentStatus?: string | null;
  onStatusChange?: () => void;
  children?: React.ReactNode;
}

export default function MediaStatusHover({
  mediaId,
  mediaType,
  mediaTitle,
  currentStatus,
  onStatusChange,
  children,
}: MediaStatusHoverProps) {
  const { data: session } = useSession();
  const [isHovered, setIsHovered] = useState(false);
  const [status, setStatus] = useState<string | null>(currentStatus || null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setStatus(currentStatus || null);
  }, [currentStatus]);

  // Fetch current status on mount if not provided
  useEffect(() => {
    if (currentStatus === undefined && session) {
      const fetchStatus = async () => {
        try {
          const endpoint = `/api/media/${mediaType}/status?${mediaId ? `mediaId=${mediaId}` : `title=${encodeURIComponent(mediaTitle)}`}`;
          const response = await fetch(endpoint);
          if (response.ok) {
            const data = await response.json();
            setStatus(data.status || null);
          }
        } catch (error) {
          console.error('Error fetching status:', error);
        }
      };
      fetchStatus();
    }
  }, [mediaId, mediaTitle, mediaType, session, currentStatus]);

  if (!session) return null;

  const getStatusOptions = () => {
    switch (mediaType) {
      case 'movie':
        return [
          { value: 'watched', label: 'Watched' },
          { value: 'dropped', label: 'Dropped' },
        ];
      case 'tv':
        return [
          { value: 'watched', label: 'Watched' },
          { value: 'currently_watching', label: 'Currently Watching' },
          { value: 'dropped', label: 'Dropped' },
        ];
      case 'game':
        return [
          { value: 'playing', label: 'Playing' },
          { value: 'have_played', label: 'Played' },
          { value: 'completed', label: 'Completed' },
          { value: 'dropped', label: 'Dropped' },
          { value: 'shelved', label: 'Shelved' },
        ];
      default:
        return [];
    }
  };

  const handleStatusClick = async (newStatus: string) => {
    if (isUpdating || newStatus === status) return;

    setIsUpdating(true);
    try {
      const endpoint = `/api/media/${mediaType}/status`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId,
          status: newStatus,
          title: mediaTitle,
        }),
      });

      if (response.ok) {
        setStatus(newStatus);
        if (onStatusChange) {
          onStatusChange();
        }
        // Dispatch event to refresh counts on profile page
        console.log('Dispatching mediaStatusUpdated event');
        window.dispatchEvent(new CustomEvent('mediaStatusUpdated'));
      } else {
        let errorData: any = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : { error: `HTTP ${response.status}: ${response.statusText}` };
        } catch (e) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('Failed to update status:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        alert(`Failed to update status: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
      setIsHovered(false);
    }
  };

  const handleRemoveStatus = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const endpoint = `/api/media/${mediaType}/status`;
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, title: mediaTitle }),
      });

      if (response.ok) {
        setStatus(null);
        if (onStatusChange) {
          onStatusChange();
        }
        // Dispatch event to refresh counts on profile page
        window.dispatchEvent(new CustomEvent('mediaStatusUpdated'));
      }
    } catch (error) {
      console.error('Error removing status:', error);
    } finally {
      setIsUpdating(false);
      setIsHovered(false);
    }
  };

  const statusOptions = getStatusOptions();
  const currentStatusLabel = statusOptions.find((opt) => opt.value === status)?.label;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 rounded-xl p-4 shadow-2xl max-w-xs w-full mx-4 pointer-events-auto">
            <h4 className="font-semibold text-sky-800 mb-3 text-center text-sm">{mediaTitle}</h4>
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusClick(option.value)}
                  disabled={isUpdating}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    status === option.value
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white'
                      : 'bg-sky-100 text-sky-800 hover:bg-sky-200'
                  } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {option.label}
                </button>
              ))}
              {status && (
                <button
                  onClick={handleRemoveStatus}
                  disabled={isUpdating}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all bg-rose-100 text-rose-800 hover:bg-rose-200 ${
                    isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Remove Status
                </button>
              )}
            </div>
            {currentStatusLabel && (
              <p className="text-xs text-sky-600 mt-3 text-center">
                Current: {currentStatusLabel}
              </p>
            )}
          </div>
        </div>
      )}
      {status && !isHovered && (
        <div className="absolute top-2 right-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg z-10">
          {currentStatusLabel}
        </div>
      )}
    </div>
  );
}

