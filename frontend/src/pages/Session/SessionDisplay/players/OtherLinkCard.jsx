import { Button, Stack, Text, Alert } from '@mantine/core';
import { IconExternalLink, IconAlertCircle } from '@tabler/icons-react';
import styles from '../styles/index.module.css';

/**
 * OtherLinkCard - Card for generic external streaming platform
 *
 * Used for platforms not natively supported (MS Teams, self-hosted Jitsi, custom solutions, etc.)
 *
 * @param {string} streamUrl - External streaming platform URL
 */
export const OtherLinkCard = ({ streamUrl }) => {
  const handleOpenStream = () => {
    // Open stream in new window
    window.open(streamUrl, '_blank', 'noopener,noreferrer');
  };

  // Truncate very long URLs for display
  const truncateUrl = (url) => {
    if (url.length <= 60) return url;
    return url.substring(0, 57) + '...';
  };

  return (
    <div className={styles.messageContainer}>
      <Stack align='center' spacing='lg' style={{ width: '100%', maxWidth: '500px' }}>
        {/* External Link Icon with Atria purple gradient */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)',
          }}
        >
          <IconExternalLink size={48} stroke={1.5} color='white' />
        </div>

        <Text size='xl' fw={600} style={{ color: '#1E293B' }}>
          External Streaming Platform
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
            This link opens an external platform outside of Atria
          </Text>
        </Alert>

        <Button
          size='lg'
          onClick={handleOpenStream}
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
          Open Stream
        </Button>
      </Stack>
    </div>
  );
};
