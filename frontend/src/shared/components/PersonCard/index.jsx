import { Card, Text, Avatar, Group, Badge, ActionIcon, Stack } from '@mantine/core';
import { IconBrandLinkedin, IconWorld, IconMail, IconMessageCircle } from '@tabler/icons-react';
import styles from './styles/index.module.css';

export function PersonCard({ 
  person, 
  variant = 'attendee', // 'speaker' | 'attendee'
  onConnect,
  onMessage,
  showActions = true 
}) {
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

  const fullName = `${firstName} ${lastName}`;
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
        
        {variant === 'speaker' && (
          <Badge color="blue" variant="light" className={styles.badge}>
            Speaker
          </Badge>
        )}
      </div>

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

        {showSocials && (linkedin || website || (showEmail && email)) && (
          <Group gap="xs" className={styles.socials}>
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
          </Group>
        )}

        {variant === 'attendee' && showActions && (
          <Group gap="xs" className={styles.actions}>
            {connectionStatus === 'connected' ? (
              <ActionIcon 
                variant="filled" 
                color="blue" 
                size="md"
                onClick={() => onMessage?.(person)}
                aria-label="Send message"
              >
                <IconMessageCircle size={16} />
              </ActionIcon>
            ) : (
              <Badge 
                variant="light" 
                color={connectionStatus === 'pending' ? 'yellow' : 'blue'}
                className={styles.connectBadge}
                onClick={() => !connectionStatus && onConnect?.(person)}
                style={{ cursor: connectionStatus ? 'default' : 'pointer' }}
              >
                {connectionStatus === 'pending' ? 'Pending' : 'Connect'}
              </Badge>
            )}
          </Group>
        )}
      </Stack>
    </Card>
  );
}