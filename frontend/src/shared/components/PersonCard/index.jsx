import { Card, Text, Avatar, Group, Badge, Button, ActionIcon, Stack } from '@mantine/core';
import { IconBrandLinkedin, IconWorld, IconMail, IconMessageCircle, IconUserPlus } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import styles from './styles/index.module.css';

export function PersonCard({ 
  person, 
  variant = 'attendee', // 'speaker' | 'attendee'
  role, // User's actual role: ADMIN, ORGANIZER, SPEAKER, ATTENDEE
  onConnect,
  onMessage,
  showActions = true 
}) {
  const currentUser = useSelector((state) => state.auth.user);
  const { 
    firstName, 
    lastName, 
    title, 
    company, 
    bio, 
    avatarUrl,
    linkedin,
    website,
    email,
    connectionStatus,
    privacySettings = {}
  } = person;

  const fullName = `${firstName || ''} ${lastName || ''}`.trim();
  const initial = firstName?.[0]?.toUpperCase() || '?';
  
  // Privacy controls - what info to show
  const showEmail = privacySettings.showEmail ?? (variant === 'speaker');
  const showCompany = privacySettings.showCompany ?? true;
  const showSocials = privacySettings.showSocials ?? true;

  return (
    <Card className={styles.card} padding="lg" radius="md" withBorder>
      <div className={styles.header}>
        <Avatar 
          src={avatarUrl} 
          size={64} 
          radius="xl"
          className={styles.avatar}
        >
          {!avatarUrl && initial}
        </Avatar>
      </div>
      
      {role && (
        <div className={`${styles.roleBadge} ${styles[role?.toLowerCase() || '']}`}>
          {role?.charAt(0) + role?.slice(1).toLowerCase()}
        </div>
      )}

      <Stack gap="xs" className={styles.content}>
        <Text size="lg" weight={600} className={styles.name}>
          {fullName}
        </Text>
        
        {title && (
          <Text size="sm" color="dimmed" className={styles.title}>
            {title}
          </Text>
        )}
        
        {showCompany && company && (
          <Text size="sm" color="dimmed">
            {company}
          </Text>
        )}
        
        {bio && (
          <Text size="sm" className={styles.bio} lineClamp={3}>
            {bio}
          </Text>
        )}

        <Group gap="xs" className={styles.socials}>
          {showSocials && (
            <>
              {linkedin && (
                <ActionIcon 
                  size="sm" 
                  variant="subtle" 
                  component="a" 
                  href={linkedin} 
                  target="_blank"
                  aria-label="LinkedIn"
                >
                  <IconBrandLinkedin size={16} />
                </ActionIcon>
              )}
              {website && (
                <ActionIcon 
                  size="sm" 
                  variant="subtle" 
                  component="a" 
                  href={website} 
                  target="_blank"
                  aria-label="Website"
                >
                  <IconWorld size={16} />
                </ActionIcon>
              )}
              {showEmail && email && (
                <ActionIcon 
                  size="sm" 
                  variant="subtle" 
                  component="a" 
                  href={`mailto:${email}`}
                  aria-label="Email"
                >
                  <IconMail size={16} />
                </ActionIcon>
              )}
            </>
          )}
          
          {showActions && currentUser?.id !== person.id && (
            <div className={styles.actionButtonWrapper}>
              {connectionStatus === 'connected' ? (
                <Button
                  size="xs"
                  variant="light"
                  color="blue"
                  leftIcon={<IconMessageCircle size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMessage?.(person);
                  }}
                  className={styles.actionButton}
                >
                  Message
                </Button>
              ) : connectionStatus === 'pending' ? (
                <Button
                  size="xs"
                  variant="light"
                  color="yellow"
                  disabled
                  className={styles.actionButton}
                >
                  Pending
                </Button>
              ) : (
                <Button
                  size="xs"
                  variant="light"
                  color="blue"
                  leftIcon={<IconUserPlus size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onConnect?.(person);
                  }}
                  className={styles.actionButton}
                >
                  Connect
                </Button>
              )}
            </div>
          )}
        </Group>
      </Stack>
    </Card>
  );
}