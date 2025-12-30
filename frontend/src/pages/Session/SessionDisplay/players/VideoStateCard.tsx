import { Stack, Text } from '@mantine/core';
import { IconVideoOff, IconEyeOff } from '@tabler/icons-react';
import { cn } from '@/lib/cn';
import styles from '../styles/index.module.css';

type VideoState = 'none' | 'hidden';

type VideoStateCardProps = {
  state: VideoState;
};

/**
 * VideoStateCard - Placeholder card for video states that don't show a player
 *
 * 'none': Session has no video content (stream_mode is NONE)
 * 'hidden': Video is configured but temporarily disabled (show_video is false)
 */
export const VideoStateCard = ({ state }: VideoStateCardProps) => {
  if (state === 'none') {
    return (
      <div className={cn(styles.messageContainer)}>
        <Stack align='center' gap='lg' style={{ width: '100%', maxWidth: '500px' }}>
          {/* Video off icon with soft blue glass */}
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconVideoOff size={36} stroke={1.5} color='#3B82F6' />
          </div>

          <Text size='xl' fw={600} style={{ color: 'var(--color-text-primary)' }}>
            No Video Content
          </Text>

          <Text
            size='sm'
            ta='center'
            style={{ color: 'var(--color-text-secondary)', maxWidth: '400px' }}
          >
            This session does not include video. Please refer to the session description for more
            details.
          </Text>
        </Stack>
      </div>
    );
  }

  // 'hidden' state - video configured but temporarily disabled
  return (
    <div className={cn(styles.messageContainer)}>
      <Stack align='center' gap='lg' style={{ width: '100%', maxWidth: '500px' }}>
        {/* Eye off icon with soft gray glass */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'rgba(100, 116, 139, 0.08)',
            border: '1px solid rgba(100, 116, 139, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconEyeOff size={36} stroke={1.5} color='#64748B' />
        </div>

        <Text size='xl' fw={600} style={{ color: 'var(--color-text-primary)' }}>
          Video Temporarily Unavailable
        </Text>

        <Text
          size='sm'
          ta='center'
          style={{ color: 'var(--color-text-secondary)', maxWidth: '400px' }}
        >
          The video for this session is currently unavailable. Please check back later.
        </Text>
      </Stack>
    </div>
  );
};
