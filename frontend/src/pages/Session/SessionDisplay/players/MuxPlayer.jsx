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
 * @param {object} session - Session object for analytics metadata
 * @param {object} event - Event object for analytics metadata
 * @param {object} currentUser - Current user for viewer analytics
 */
export const MuxPlayer = ({ playbackId, playbackPolicy, tokens, session, event, currentUser }) => {
  // Build analytics metadata for Mux
  const metadata = {
    // Viewer info
    viewer_user_id: currentUser?.id?.toString(),
    viewer_user_name: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Anonymous',

    // Video/Session info
    video_id: session?.id?.toString(),
    video_title: session?.title || 'Untitled Session',
    video_series: event?.title || 'Unknown Event',
    session_type: session?.session_type || 'UNKNOWN',
    session_day: session?.day_number ? `Day ${session.day_number}` : 'N/A',

    // Context
    page_type: 'session',
    platform: 'Atria Events',
    event_id: event?.id?.toString(),
    organization_id: event?.organization_id?.toString(),
  };
  // For SIGNED playback, pass tokens to player
  if (playbackPolicy === 'SIGNED' && tokens) {
    return (
      <div className={styles.videoContainer}>
        <MuxPlayerReact
          playbackId={playbackId}
          tokens={tokens}
          metadata={metadata}
          accentColor="#8B5CF6"
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
        metadata={metadata}
        accentColor="#8B5CF6"
        controls
        style={{ width: '100%', aspectRatio: '16/9' }}
      />
    </div>
  );
};
