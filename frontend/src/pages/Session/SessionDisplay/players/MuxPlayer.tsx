import MuxPlayerReact from '@mux/mux-player-react';
import type { SessionDetail, EventDetail } from '@/types/events';
import type { User } from '@/types/auth';
import { cn } from '@/lib/cn';
import styles from '../styles/index.module.css';

type MuxTokens = {
  playback?: string;
  storyboard?: string;
  thumbnail?: string;
};

type MuxPlayerProps = {
  playbackId: string;
  playbackPolicy: 'PUBLIC' | 'SIGNED';
  tokens?: MuxTokens;
  session: SessionDetail;
  event: EventDetail | undefined;
  currentUser: User | null;
};

/**
 * MuxPlayer - Mux video player component with support for signed playback
 *
 * Mux Player automatically detects stream type (live vs on-demand) so no need to specify.
 */
export const MuxPlayer = ({
  playbackId,
  playbackPolicy,
  tokens,
  session,
  event,
  currentUser,
}: MuxPlayerProps) => {
  // Build analytics metadata for Mux
  const metadata = {
    // Viewer info
    viewer_user_id: currentUser?.id?.toString(),
    viewer_user_name:
      currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Anonymous',

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
      <div className={cn(styles.videoContainer)}>
        <MuxPlayerReact
          playbackId={playbackId}
          tokens={tokens}
          metadata={metadata}
          accentColor='#8B5CF6'
          style={{ width: '100%', aspectRatio: '16/9' }}
        />
      </div>
    );
  }

  // For PUBLIC playback, no tokens needed
  return (
    <div className={cn(styles.videoContainer)}>
      <MuxPlayerReact
        playbackId={playbackId}
        metadata={metadata}
        accentColor='#8B5CF6'
        style={{ width: '100%', aspectRatio: '16/9' }}
      />
    </div>
  );
};
