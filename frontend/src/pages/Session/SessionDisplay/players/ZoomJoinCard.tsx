import { Button, Stack, Text, Paper } from '@mantine/core';
import { IconBrandZoom, IconLock } from '@tabler/icons-react';
import { cn } from '@/lib/cn';
import styles from '../styles/index.module.css';

type ZoomJoinCardProps = {
  joinUrl: string;
  passcode?: string | null;
};

/**
 * ZoomJoinCard - Card displaying Zoom meeting join button
 */
export const ZoomJoinCard = ({ joinUrl, passcode }: ZoomJoinCardProps) => {
  const handleJoinMeeting = () => {
    // Open Zoom meeting in new window
    window.open(joinUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={cn(styles.messageContainer)}>
      <Stack align='center' gap='lg' style={{ width: '100%', maxWidth: '500px' }}>
        {/* Zoom Logo Icon with brand color */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #2D8CFF 0%, #0B5CFF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(45, 140, 255, 0.3)',
          }}
        >
          <IconBrandZoom size={48} stroke={1.5} color='white' />
        </div>

        <Text size='xl' fw={600} style={{ color: '#1E293B' }}>
          This session is hosted on Zoom
        </Text>

        <Text size='sm' ta='center' style={{ color: '#64748B', maxWidth: '400px' }}>
          Click the button below to join the meeting in a new window
        </Text>

        {passcode && (
          <Paper
            p='md'
            withBorder
            style={{
              background: 'rgba(139, 92, 246, 0.04)',
              borderColor: 'rgba(139, 92, 246, 0.15)',
              borderRadius: 'var(--radius-md)',
              minWidth: '280px',
            }}
          >
            <Stack gap={8} align='center'>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconLock size={18} color='#8B5CF6' />
                <Text size='xs' fw={500} tt='uppercase' style={{ color: '#94A3B8' }}>
                  Meeting Passcode
                </Text>
              </div>
              <Text
                size='xl'
                fw={700}
                ff='monospace'
                style={{
                  color: '#1E293B',
                  letterSpacing: '0.15em',
                  userSelect: 'all', // Allow easy copy
                }}
              >
                {passcode}
              </Text>
            </Stack>
          </Paper>
        )}

        <Button
          size='lg'
          onClick={handleJoinMeeting}
          style={{
            marginTop: 'var(--space-md)',
            background: 'linear-gradient(135deg, #2D8CFF 0%, #0B5CFF 100%)',
            border: 'none',
            height: '48px',
            paddingLeft: 'var(--space-xl)',
            paddingRight: 'var(--space-xl)',
            fontWeight: 600,
            fontSize: 'var(--text-base)',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(45, 140, 255, 0.25)',
          }}
          styles={{
            root: {
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(45, 140, 255, 0.35)',
                background: 'linear-gradient(135deg, #3D9CFF 0%, #1B6CFF 100%)',
              },
            },
          }}
          leftSection={<IconBrandZoom size={22} stroke={1.5} />}
        >
          Join Zoom Meeting
        </Button>
      </Stack>
    </div>
  );
};
