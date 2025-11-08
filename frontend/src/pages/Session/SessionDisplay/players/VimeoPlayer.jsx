import { useEffect, useRef } from 'react';
import Player from '@vimeo/player';
import styles from '../styles/index.module.css';

/**
 * VimeoPlayer - Simple Vimeo video player component
 *
 * @param {string} videoId - Vimeo video ID (normalized, stored in DB)
 */
export const VimeoPlayer = ({ videoId }) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

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

  return <div ref={containerRef} className={styles.videoContainer} />;
};
