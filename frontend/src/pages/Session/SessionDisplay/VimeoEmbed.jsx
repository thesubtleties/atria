import { useEffect, useRef } from 'react';
import Player from '@vimeo/player';
import styles from './styles/index.module.css';

export const VimeoEmbed = ({ url }) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!url || !containerRef.current) return;

    // Extract video ID from URL
    const videoId = url.split('/').pop();

    // Initialize player
    playerRef.current = new Player(containerRef.current, {
      id: videoId,
      width: '100%',
      responsive: true,
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [url]);

  return <div ref={containerRef} className={styles.videoContainer} />;
};
