import { Button, Stack, Text, Alert } from '@mantine/core';
import { IconExternalLink, IconAlertCircle, IconVideo } from '@tabler/icons-react';
import { cn } from '@/lib/cn';
import styles from '../styles/index.module.css';

type OtherLinkCardProps = {
  streamUrl: string;
  isRecording?: boolean;
};

/**
 * OtherLinkCard - Card for generic external streaming/recording platform
 *
 * Used for platforms not natively supported (MS Teams, self-hosted Jitsi, custom solutions, etc.)
 * Set isRecording=true when displaying a recording link vs a live stream
 */
export const OtherLinkCard = ({ streamUrl, isRecording = false }: OtherLinkCardProps) => {
  const handleOpenLink = () => {
    // Open link in new window
    window.open(streamUrl, '_blank', 'noopener,noreferrer');
  };

  // Truncate very long URLs for display
  const truncateUrl = (url: string): string => {
    if (url.length <= 60) return url;
    return url.substring(0, 57) + '...';
  };

  // Dynamic content based on recording vs live stream
  const title = isRecording ? 'Session Recording' : 'External Streaming Platform';
  const buttonText = isRecording ? 'View Recording' : 'Open Stream';
  const disclaimer =
    isRecording ?
      'This recording is hosted on an external platform'
    : 'This link opens an external platform outside of Atria';

  // Use different icon for recording vs live stream
  const TopIcon = isRecording ? IconVideo : IconExternalLink;

  return (
    <div className={cn(styles.messageContainer)}>
      <Stack align='center' gap='lg' style={{ width: '100%', maxWidth: '500px' }}>
        {/* Icon with soft purple glass */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TopIcon size={36} stroke={1.5} color='#8B5CF6' />
        </div>

        <Text size='xl' fw={600} style={{ color: '#1E293B' }}>
          {title}
        </Text>

        <Text size='sm' ta='center' style={{ color: '#64748B', maxWidth: '400px' }}>
          {truncateUrl(streamUrl)}
        </Text>

        {/* Disclaimer about external platform */}
        <Alert
          icon={<IconAlertCircle size={18} />}
          color='violet'
          variant='light'
          style={{
            maxWidth: '400px',
            width: '100%',
            background: 'rgba(139, 92, 246, 0.04)',
            borderColor: 'rgba(139, 92, 246, 0.15)',
          }}
        >
          <Text size='xs' style={{ color: '#64748B' }}>
            {disclaimer}
          </Text>
        </Alert>

        <Button
          size='lg'
          onClick={handleOpenLink}
          style={{
            marginTop: 'var(--space-md)',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            border: 'none',
            height: '48px',
            paddingLeft: 'var(--space-xl)',
            paddingRight: 'var(--space-xl)',
            fontWeight: 600,
            fontSize: 'var(--text-base)',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
          }}
          styles={{
            root: {
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(139, 92, 246, 0.35)',
                background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
              },
            },
          }}
          leftSection={<IconExternalLink size={22} stroke={1.5} />}
        >
          {buttonText}
        </Button>
      </Stack>
    </div>
  );
};
