'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import MediaStatusHover from './MediaStatusHover';

interface TrendingMediaScrollProps {
  mediaType: 'movie' | 'tv' | 'game';
  apiEndpoint: string;
  getPosterUrl: (item: any) => string;
  getTitle: (item: any) => string;
  getYear: (item: any) => string | number | null;
  getMediaId: (item: any) => string;
  getDetailUrl: (item: any) => string;
  aspectRatio?: string;
}

export default function TrendingMediaScroll({
  mediaType,
  apiEndpoint,
  getPosterUrl,
  getTitle,
  getYear,
  getMediaId,
  getDetailUrl,
  aspectRatio = 'aspect-[2/3]',
}: TrendingMediaScrollProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await fetch(apiEndpoint);
        const data = await response.json();
        
        if (data.success) {
          const mediaItems = mediaType === 'movie' ? data.movies : mediaType === 'tv' ? data.shows : data.games;
          setItems(mediaItems || []);
        }
      } catch (error) {
        console.error(`Error fetching trending ${mediaType}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [apiEndpoint, mediaType]);

  // Auto-scroll animation
  useEffect(() => {
    if (loading || items.length === 0 || isPaused) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollSpeed = 0.5; // pixels per frame
    let animationFrameId: number;

    const scroll = () => {
      if (isPaused) return;
      
      container.scrollLeft += scrollSpeed;
      
      // Reset scroll position when reaching the end
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
        container.scrollLeft = 0;
      }
      
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [loading, items.length, isPaused]);

  const getDefaultPoster = () => {
    if (mediaType === 'game') {
      return 'https://via.placeholder.com/300x400?text=No+Cover';
    }
    return 'https://via.placeholder.com/300x450?text=No+Poster';
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-sky-800">Trending {mediaType === 'movie' ? 'Movies' : mediaType === 'tv' ? 'TV Shows' : 'Games'}</h2>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-48 glass-strong rounded-2xl overflow-hidden animate-pulse">
              <div className={`${aspectRatio} bg-gradient-to-br from-cyan-200 to-teal-200`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <h2 className="text-2xl font-semibold mb-4 text-sky-800">
        Trending {mediaType === 'movie' ? 'Movies' : mediaType === 'tv' ? 'TV Shows' : 'Games'}
      </h2>
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {items.map((item, index) => {
          const posterUrl = getPosterUrl(item);
          const title = getTitle(item);
          const year = getYear(item);
          const mediaId = getMediaId(item);
          const detailUrl = getDetailUrl(item);

          return (
            <div
              key={`${mediaId}-${index}`}
              className="flex-shrink-0 w-48 group glass-strong rounded-2xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105 relative"
            >
              <Link href={detailUrl}>
                <div className={`${aspectRatio} bg-gradient-to-br from-cyan-100 to-teal-100 overflow-hidden rounded-t-2xl`}>
                  <img
                    src={posterUrl && posterUrl !== 'N/A' ? posterUrl : getDefaultPoster()}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sky-800 mb-1 line-clamp-2 group-hover:text-cyan-600 transition-colors text-sm">
                    {title}
                  </h3>
                  <p className="text-xs text-sky-600">{year}</p>
                </div>
              </Link>
              <MediaStatusHover
                mediaId={mediaId}
                mediaType={mediaType}
                mediaTitle={title}
                currentStatus={null}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

