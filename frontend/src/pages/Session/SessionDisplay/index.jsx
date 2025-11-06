// pages/Session/SessionDisplay/index.jsx
import { useState, useEffect } from 'react';
import { VimeoPlayer, MuxPlayer, ZoomJoinCard } from './players';
import { Alert, Loader } from '@mantine/core';
import styles from './styles/index.module.css';

export const SessionDisplay = ({ session, event, currentUser }) => {
  const [playbackData, setPlaybackData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch playback data for Mux SIGNED streams
  useEffect(() => {
    const fetchPlaybackData = async () => {
      // Only fetch if Mux with SIGNED policy
      if (
        session?.streaming_platform !== 'MUX' ||
        session?.mux_playback_policy !== 'SIGNED'
      ) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/sessions/${session.id}/playback-data`,
          {
            credentials: 'include', // Send cookies for auth
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch playback data');
        }

        const data = await response.json();
        setPlaybackData(data);
      } catch (err) {
        console.error('Error fetching playback data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaybackData();
  }, [session?.id, session?.streaming_platform, session?.mux_playback_policy]);

  // Route to appropriate player based on platform
  const renderPlayer = () => {
    const platform = session?.streaming_platform;

    // No streaming configured
    if (!platform) {
      return (
        <div className={styles.messageContainer}>
          <Alert
            color="blue"
            title="No stream available"
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
        <div className={styles.messageContainer}>
          <Alert
            color="blue"
            title="No stream available"
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
        <div className={styles.messageContainer}>
          <Alert
            color="blue"
            title="No stream available"
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
        <div className={styles.messageContainer}>
          <Alert
            color="blue"
            title="No meeting URL available"
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
      return <VimeoPlayer videoId={session.stream_url} />;
    }

    // MUX
    if (platform === 'MUX') {
      const playbackPolicy = session.mux_playback_policy || 'PUBLIC';

      // For PUBLIC playback, no tokens needed
      if (playbackPolicy === 'PUBLIC') {
        return (
          <MuxPlayer
            playbackId={session.stream_url}
            playbackPolicy="PUBLIC"
            session={session}
            event={event}
            currentUser={currentUser}
          />
        );
      }

      // For SIGNED playback, need to fetch tokens
      if (loading) {
        return (
          <div className={styles.messageContainer}>
            <Loader size="lg" />
          </div>
        );
      }

      if (error) {
        return (
          <div className={styles.messageContainer}>
            <Alert
              color="red"
              title="Error loading stream"
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
          <div className={styles.messageContainer}>
            <Alert
              color="yellow"
              title="Stream not available"
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
          playbackId={session.stream_url}
          playbackPolicy="SIGNED"
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
          joinUrl={session.zoom_meeting_id}
          passcode={session.zoom_passcode}
        />
      );
    }

    // Unknown platform
    return (
      <div className={styles.messageContainer}>
        <Alert
          color="red"
          title="Unsupported platform"
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

  return <div className={styles.displayContainer}>{renderPlayer()}</div>;
};
