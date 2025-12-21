import { useEffect, useRef } from 'react';
// @ts-expect-error - @vimeo/player doesn't have type definitions
import Player from '@vimeo/player';
import { cn } from '@/lib/cn';
import styles from '../styles/index.module.css';

type VimeoPlayerProps = {
  videoId: string;
};

/**
 * VimeoPlayer - Simple Vimeo video player component
 */
export const VimeoPlayer = ({ videoId }: VimeoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    // Initialize Vimeo player
    playerRef.current = new Player(containerRef.current, {
      id: videoId,
      width: '100%',
      responsive: true,
    });

    // Cleanup on unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  return <div ref={containerRef} className={cn(styles.videoContainer)} />;
};
