import MuxPlayerReact from '@mux/mux-player-react';
import styles from '../styles/index.module.css';

/**
 * MuxPlayer - Mux video player component with support for signed playback
 *
 * Mux Player automatically detects stream type (live vs on-demand) so no need to specify.
 *
 * @param {string} playbackId - Mux playback ID (normalized, stored in DB)
 * @param {string} playbackPolicy - 'PUBLIC' or 'SIGNED'
 * @param {object} tokens - JWT tokens for signed playback (optional, required if policy is SIGNED)
 * @param {string} tokens.playback - Playback token
 * @param {string} tokens.thumbnail - Thumbnail token
 * @param {string} tokens.storyboard - Storyboard token
 */
export const MuxPlayer = ({ playbackId, playbackPolicy, tokens }) => {
  // For SIGNED playback, pass tokens to player
  if (playbackPolicy === 'SIGNED' && tokens) {
    return (
      <div className={styles.videoContainer}>
        <MuxPlayerReact
          playbackId={playbackId}
          tokens={tokens}
          controls
          style={{ width: '100%', aspectRatio: '16/9' }}
        />
      </div>
    );
  }

  // For PUBLIC playback, no tokens needed
  return (
    <div className={styles.videoContainer}>
      <MuxPlayerReact
        playbackId={playbackId}
        controls
        style={{ width: '100%', aspectRatio: '16/9' }}
      />
    </div>
  );
};
