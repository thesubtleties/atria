import { Card, Avatar, Text, Group, Badge } from '@mantine/core';
import { IconBriefcase, IconMicrophone, IconUser } from '@tabler/icons-react';
import styles from './SpeakerCard.module.css';

export const SpeakerCard = ({ speaker }) => {
  const { 
    full_name,
    first_name,
    last_name,
    speaker_title, // Event-specific title (takes priority)
    speaker_bio,   // Event-specific bio (takes priority)
    title,         // User's profile title (fallback)
    bio,           // User's profile bio (fallback)
    company_name,
    image_url,
    sessions = [] // sessions this speaker is presenting
  } = speaker;

  // Use event-specific fields with fallback to profile fields
  const displayName = full_name || `${first_name || ''} ${last_name || ''}`.trim() || 'Speaker';
  const displayBio = speaker_bio || bio;        // Event-specific takes priority
  
  // If we have a custom speaker_title, use it and hide company
  // Otherwise show profile title and company separately
  const hasCustomTitle = !!speaker_title;
  const displayTitle = speaker_title || title;
  const displayCompany = hasCustomTitle ? null : company_name;  // Hide company if custom title exists

  // Generate avatar initials
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card 
      className={styles.card}
      padding={0}
      radius="md"
      withBorder={false}
    >
      {/* Avatar section with gradient background */}
      <div className={styles.avatarSection}>
        <div className={styles.avatarGradient} />
        <Avatar
          size={120}
          radius="xl"
          className={styles.avatar}
          src={image_url}
        >
          {getInitials(displayName)}
        </Avatar>
      </div>

      {/* Content section */}
      <div className={styles.content}>
        <Text className={styles.speakerName}>{displayName}</Text>
        
        {/* Title and company */}
        <div className={styles.roleInfo}>
          {displayTitle && (
            <Group gap={6} className={styles.titleGroup}>
              <IconBriefcase size={14} className={styles.icon} />
              <Text className={styles.title}>{displayTitle}</Text>
            </Group>
          )}
          
          {displayCompany && (
            <Text className={styles.company}>{displayCompany}</Text>
          )}
        </div>

        {/* Bio */}
        {displayBio && (
          <Text className={styles.bio} lineClamp={3}>
            {displayBio}
          </Text>
        )}

        {/* Sessions count */}
        {sessions.length > 0 && (
          <div className={styles.sessionsInfo}>
            <Group gap={6}>
              <IconMicrophone size={16} className={styles.sessionIcon} />
              <Text className={styles.sessionText}>
                {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'}
              </Text>
            </Group>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SpeakerCard;