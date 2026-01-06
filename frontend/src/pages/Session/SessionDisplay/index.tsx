import { useState, useEffect } from 'react';
import {
  VimeoPlayer,
  MuxPlayer,
  ZoomJoinCard,
  JitsiPlayer,
  OtherLinkCard,
  SessionWindowCard,
  VideoStateCard,
} from './players';
import { Alert, Loader } from '@mantine/core';
import type { SessionDetail, EventDetail } from '@/types/events';
import type { User } from '@/types/auth';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type SessionDisplayProps = {
  session: SessionDetail;
  event: EventDetail | undefined;
  currentUser: User | null;
};

type PlaybackData = {
  tokens?: {
    playback?: string;
    storyboard?: string;
    thumbnail?: string;
  };
  app_id?: string;
  room_name?: string;
  token?: string;
};

export const SessionDisplay = ({ session, event, currentUser }: SessionDisplayProps) => {
  const [playbackData, setPlaybackData] = useState<PlaybackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use the computed video state from backend - handles show_video, show_recording, timing, etc.
  // Values: 'none' | 'hidden' | 'pre' | 'live' | 'vod' | 'recording' | 'ended'
  const videoState = session?.current_video_state || 'none';

  /**
   * Render VOD player based on vod_platform/vod_url or fallback to stream_url
   * Priority:
   * 1. If vod_url + vod_platform set → use that specific platform
   * 2. If no vod_url but streaming_platform is VIMEO/MUX → use stream_url (auto-VOD)
   */
  const renderVodPlayer = () => {
    const { vod_url, vod_platform, streaming_platform, stream_url } = session || {};

    // Case 1: Explicit VOD URL with platform specified
    if (vod_url && vod_platform) {
      if (vod_platform === 'VIMEO') {
        return <VimeoPlayer videoId={vod_url} />;
      }
      if (vod_platform === 'MUX') {
        return (
          <MuxPlayer
            playbackId={vod_url}
            playbackPolicy='PUBLIC'
            session={session}
            event={event}
            currentUser={currentUser}
          />
        );
      }
      // OTHER platform - external recording link (YouTube, etc)
      return <OtherLinkCard streamUrl={vod_url} isRecording />;
    }

    // Case 2: VOD URL set but no platform - treat as external recording link
    if (vod_url && !vod_platform) {
      return <OtherLinkCard streamUrl={vod_url} isRecording />;
    }

    // Case 3: No VOD URL - use original stream_url (Vimeo/Mux/Other auto-VOD)
    if (streaming_platform === 'VIMEO' && stream_url) {
      return <VimeoPlayer videoId={stream_url} />;
    }
    if (streaming_platform === 'MUX' && stream_url) {
      return (
        <MuxPlayer
          playbackId={stream_url}
          playbackPolicy={session?.mux_playback_policy || 'PUBLIC'}
          session={session}
          event={event}
          currentUser={currentUser}
        />
      );
    }
    // OTHER platform - use stream_url as recording link
    if (streaming_platform === 'OTHER' && stream_url) {
      return <OtherLinkCard streamUrl={stream_url} isRecording />;
    }

    // No VOD available (Zoom/Jitsi or no URL) - show thank you card
    return <SessionWindowCard windowState='post' />;
  };

  // Fetch playback data for Mux SIGNED streams and Jitsi (both need JWT tokens)
  useEffect(() => {
    const fetchPlaybackData = async () => {
      // Fetch if:
      // 1. Mux with SIGNED policy (needs JWT tokens)
      // 2. Jitsi (always needs JWT tokens)
      const needsPlaybackData =
        (session?.streaming_platform === 'MUX' && session?.mux_playback_policy === 'SIGNED') ||
        session?.streaming_platform === 'JITSI';

      if (!needsPlaybackData) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/sessions/${session.id}/playback-data`, {
          credentials: 'include', // Send cookies for auth
        });

        if (!response.ok) {
          throw new Error('Failed to fetch playback data');
        }

        const data = await response.json();
        setPlaybackData(data);
      } catch (err) {
        console.error('Error fetching playback data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaybackData();
  }, [session?.id, session?.streaming_platform, session?.mux_playback_policy]);

  // Route to appropriate player/card based on current_video_state
  const renderPlayer = () => {
    // Handle video states computed by the backend
    // 'none' = no video configured (stream_mode is NONE)
    if (videoState === 'none') {
      return <VideoStateCard state='none' />;
    }

    // 'hidden' = video configured but temporarily disabled (show_video is false)
    if (videoState === 'hidden') {
      return <VideoStateCard state='hidden' />;
    }

    // 'pre' = before session visibility window opens
    if (videoState === 'pre') {
      return (
        <SessionWindowCard
          windowState='pre'
          sessionStartTime={session?.start_time}
          eventStartDate={event?.start_date}
          dayNumber={session?.day_number}
          eventTimezone={event?.timezone}
          visibilityMinutes={session?.effective_visibility_minutes}
        />
      );
    }

    // 'ended' = session ended, no recording available
    if (videoState === 'ended') {
      return <SessionWindowCard windowState='post' />;
    }

    // 'recording' = live session ended, recording available (show_recording is true)
    if (videoState === 'recording') {
      return renderVodPlayer();
    }

    // 'vod' = pre-recorded content, available after start time
    if (videoState === 'vod') {
      return renderVodPlayer();
    }

    // 'live' = session is active and video should show
    const platform = session?.streaming_platform;

    // Safety check: no platform configured (shouldn't happen if videoState is 'live')
    if (!platform) {
      return (
        <div className={cn(styles.messageContainer)}>
          <Alert
            color='blue'
            title='No stream available'
            styles={{
              root: {
                maxWidth: '500px',
                background: 'rgba(139, 92, 246, 0.06)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                padding: '1.5rem',
              },
              title: {
                color: '#1E293B',
                fontSize: '1.125rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
              },
              message: {
                color: '#64748B',
                fontSize: '0.9375rem',
                lineHeight: '1.5',
              },
            }}
          >
            This session does not have streaming configured yet.
          </Alert>
        </div>
      );
    }

    // Check platform-specific fields
    if (platform === 'VIMEO' && !session?.stream_url) {
      return (
        <div className={cn(styles.messageContainer)}>
          <Alert
            color='blue'
            title='No stream available'
            styles={{
              root: {
                maxWidth: '500px',
                background: 'rgba(139, 92, 246, 0.06)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                padding: '1.5rem',
              },
              title: {
                color: '#1E293B',
                fontSize: '1.125rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
              },
              message: {
                color: '#64748B',
                fontSize: '0.9375rem',
                lineHeight: '1.5',
              },
            }}
          >
            This Vimeo session does not have a video URL configured yet.
          </Alert>
        </div>
      );
    }

    if (platform === 'MUX' && !session?.stream_url) {
      return (
        <div className={cn(styles.messageContainer)}>
          <Alert
            color='blue'
            title='No stream available'
            styles={{
              root: {
                maxWidth: '500px',
                background: 'rgba(139, 92, 246, 0.06)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                padding: '1.5rem',
              },
              title: {
                color: '#1E293B',
                fontSize: '1.125rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
              },
              message: {
                color: '#64748B',
                fontSize: '0.9375rem',
                lineHeight: '1.5',
              },
            }}
          >
            This Mux session does not have a playback ID configured yet.
          </Alert>
        </div>
      );
    }

    if (platform === 'ZOOM' && !session?.zoom_meeting_id) {
      return (
        <div className={cn(styles.messageContainer)}>
          <Alert
            color='blue'
            title='No meeting URL available'
            styles={{
              root: {
                maxWidth: '500px',
                background: 'rgba(139, 92, 246, 0.06)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                padding: '1.5rem',
              },
              title: {
                color: '#1E293B',
                fontSize: '1.125rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
              },
              message: {
                color: '#64748B',
                fontSize: '0.9375rem',
                lineHeight: '1.5',
              },
            }}
          >
            This Zoom session does not have a meeting URL configured yet.
          </Alert>
        </div>
      );
    }

    // VIMEO
    if (platform === 'VIMEO') {
      return <VimeoPlayer videoId={session.stream_url as string} />;
    }

    // MUX
    if (platform === 'MUX') {
      const playbackPolicy = session.mux_playback_policy || 'PUBLIC';

      // For PUBLIC playback, no tokens needed
      if (playbackPolicy === 'PUBLIC') {
        return (
          <MuxPlayer
            playbackId={session.stream_url as string}
            playbackPolicy='PUBLIC'
            session={session}
            event={event}
            currentUser={currentUser}
          />
        );
      }

      // For SIGNED playback, need to fetch tokens
      if (loading) {
        return (
          <div className={cn(styles.messageContainer)}>
            <Loader size='lg' />
          </div>
        );
      }

      if (error) {
        return (
          <div className={cn(styles.messageContainer)}>
            <Alert
              color='red'
              title='Error loading stream'
              styles={{
                root: {
                  maxWidth: '500px',
                  background: 'rgba(220, 38, 38, 0.06)',
                  border: '1px solid rgba(220, 38, 38, 0.15)',
                  padding: '1.5rem',
                },
                title: {
                  color: '#1E293B',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                },
                message: {
                  color: '#64748B',
                  fontSize: '0.9375rem',
                  lineHeight: '1.5',
                },
              }}
            >
              {error}
            </Alert>
          </div>
        );
      }

      if (!playbackData?.tokens) {
        return (
          <div className={cn(styles.messageContainer)}>
            <Alert
              color='yellow'
              title='Stream not available'
              styles={{
                root: {
                  maxWidth: '500px',
                  background: 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  padding: '1.5rem',
                },
                title: {
                  color: '#1E293B',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                },
                message: {
                  color: '#64748B',
                  fontSize: '0.9375rem',
                  lineHeight: '1.5',
                },
              }}
            >
              Unable to load signed stream. Please try again later.
            </Alert>
          </div>
        );
      }

      return (
        <MuxPlayer
          playbackId={session.stream_url as string}
          playbackPolicy='SIGNED'
          tokens={playbackData.tokens}
          session={session}
          event={event}
          currentUser={currentUser}
        />
      );
    }

    // ZOOM
    if (platform === 'ZOOM') {
      return (
        <ZoomJoinCard
          joinUrl={session.zoom_meeting_id as string}
          passcode={session.zoom_passcode}
        />
      );
    }

    // JITSI
    if (platform === 'JITSI' && !session?.jitsi_room_name) {
      return (
        <div className={cn(styles.messageContainer)}>
          <Alert
            color='blue'
            title='No meeting configured'
            styles={{
              root: {
                maxWidth: '500px',
                background: 'rgba(139, 92, 246, 0.06)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                padding: '1.5rem',
              },
              title: {
                color: '#1E293B',
                fontSize: '1.125rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
              },
              message: {
                color: '#64748B',
                fontSize: '0.9375rem',
                lineHeight: '1.5',
              },
            }}
          >
            This Jitsi session does not have a room configured yet.
          </Alert>
        </div>
      );
    }

    if (platform === 'JITSI') {
      // Show loading state while fetching JWT tokens
      if (loading) {
        return (
          <div className={cn(styles.messageContainer)}>
            <Loader size='lg' />
          </div>
        );
      }

      // Show error state if fetch failed
      if (error) {
        return (
          <div className={cn(styles.messageContainer)}>
            <Alert
              color='red'
              title='Error loading meeting'
              styles={{
                root: {
                  maxWidth: '500px',
                  background: 'rgba(220, 38, 38, 0.06)',
                  border: '1px solid rgba(220, 38, 38, 0.15)',
                  padding: '1.5rem',
                },
                title: {
                  color: '#1E293B',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                },
                message: {
                  color: '#64748B',
                  fontSize: '0.9375rem',
                  lineHeight: '1.5',
                },
              }}
            >
              {error}
            </Alert>
          </div>
        );
      }

      // Verify we have the required playback data
      if (!playbackData?.app_id || !playbackData?.room_name || !playbackData?.token) {
        return (
          <div className={cn(styles.messageContainer)}>
            <Alert
              color='yellow'
              title='Meeting not available'
              styles={{
                root: {
                  maxWidth: '500px',
                  background: 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  padding: '1.5rem',
                },
                title: {
                  color: '#1E293B',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                },
                message: {
                  color: '#64748B',
                  fontSize: '0.9375rem',
                  lineHeight: '1.5',
                },
              }}
            >
              Unable to load Jitsi meeting. Please ensure the organization has JaaS credentials
              configured.
            </Alert>
          </div>
        );
      }

      // Render Jitsi player with playback data
      return (
        <JitsiPlayer
          appId={playbackData.app_id}
          roomName={playbackData.room_name}
          jwt={playbackData.token}
          session={session}
          currentUser={currentUser}
        />
      );
    }

    // OTHER (External link) - uses stream_url column
    if (platform === 'OTHER' && !session?.stream_url) {
      return (
        <div className={cn(styles.messageContainer)}>
          <Alert
            color='blue'
            title='No stream URL available'
            styles={{
              root: {
                maxWidth: '500px',
                background: 'rgba(139, 92, 246, 0.06)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                padding: '1.5rem',
              },
              title: {
                color: '#1E293B',
                fontSize: '1.125rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
              },
              message: {
                color: '#64748B',
                fontSize: '0.9375rem',
                lineHeight: '1.5',
              },
            }}
          >
            This session does not have an external stream URL configured yet.
          </Alert>
        </div>
      );
    }

    if (platform === 'OTHER') {
      return <OtherLinkCard streamUrl={session.stream_url as string} />;
    }

    // Unknown platform
    return (
      <div className={cn(styles.messageContainer)}>
        <Alert
          color='red'
          title='Unsupported platform'
          styles={{
            root: {
              maxWidth: '500px',
              background: 'rgba(220, 38, 38, 0.06)',
              border: '1px solid rgba(220, 38, 38, 0.15)',
              padding: '1.5rem',
            },
            title: {
              color: '#1E293B',
              fontSize: '1.125rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
            },
            message: {
              color: '#64748B',
              fontSize: '0.9375rem',
              lineHeight: '1.5',
            },
          }}
        >
          This streaming platform is not yet supported.
        </Alert>
      </div>
    );
  };

  return <div className={cn(styles.displayContainer)}>{renderPlayer()}</div>;
};
