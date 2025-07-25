import { Text, Avatar, Group, Button, ActionIcon, Stack } from '@mantine/core';
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
    <div className={styles.card}>
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
          <Text size="sm" c="dimmed" className={styles.title}>
            {title}
          </Text>
        )}
        
        {showCompany && company && (
          <Text size="sm" c="dimmed">
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
                <div className={styles.linkedinIcon}>
                  <ActionIcon 
                    size="md" 
                    variant="subtle" 
                    component="a" 
                    href={linkedin} 
                    target="_blank"
                    aria-label="LinkedIn"
                  >
                    <IconBrandLinkedin size={20} />
                  </ActionIcon>
                </div>
              )}
              {website && (
                <ActionIcon 
                  size="md" 
                  variant="subtle" 
                  component="a" 
                  href={website} 
                  target="_blank"
                  aria-label="Website"
                >
                  <IconWorld size={20} />
                </ActionIcon>
              )}
              {showEmail && email && (
                <ActionIcon 
                  size="md" 
                  variant="subtle" 
                  component="a" 
                  href={`mailto:${email}`}
                  aria-label="Email"
                >
                  <IconMail size={20} />
                </ActionIcon>
              )}
            </>
          )}
          
          {showActions && currentUser?.id !== person.id && (
            <div className={styles.actionButtonWrapper}>
              {connectionStatus === 'connected' || connectionStatus === 'accepted' || connectionStatus === 'ACCEPTED' ? (
                <Button
                  size="xs"
                  variant="filled"
                  color="violet"
                  leftIcon={<IconMessageCircle size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMessage?.(person);
                  }}
                  className={styles.messageButton}
                >
                  Message
                </Button>
              ) : connectionStatus === 'pending' || connectionStatus === 'PENDING' ? (
                <Button
                  size="xs"
                  variant="light"
                  color="yellow"
                  disabled
                  className={styles.pendingButton}
                >
                  Pending
                </Button>
              ) : (
                <Button
                  size="xs"
                  variant="light"
                  color="violet"
                  leftIcon={<IconUserPlus size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onConnect?.(person);
                  }}
                  className={styles.connectButton}
                >
                  Connect
                </Button>
              )}
            </div>
          )}
        </Group>
      </Stack>
    </div>
  );
}