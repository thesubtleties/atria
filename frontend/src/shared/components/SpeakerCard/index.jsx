import { Card, Avatar, Text, Group, Badge } from '@mantine/core';
import { IconBriefcase, IconMicrophone, IconUser } from '@tabler/icons-react';
import styles from './SpeakerCard.module.css';

export const SpeakerCard = ({ speaker }) => {
  const { 
    user_name, 
    speaker_title, 
    speaker_bio,
    speaker_company,
    sessions = [] // sessions this speaker is presenting
  } = speaker;

  // Generate avatar initials
  const getInitials = (name) => {
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
          src={speaker.image_url}
        >
          {getInitials(user_name)}
        </Avatar>
      </div>

      {/* Content section */}
      <div className={styles.content}>
        <Text className={styles.speakerName}>{user_name}</Text>
        
        {/* Title and company */}
        <div className={styles.roleInfo}>
          {speaker_title && (
            <Group gap={6} className={styles.titleGroup}>
              <IconBriefcase size={14} className={styles.icon} />
              <Text className={styles.title}>{speaker_title}</Text>
            </Group>
          )}
          
          {speaker_company && (
            <Text className={styles.company}>{speaker_company}</Text>
          )}
        </div>

        {/* Bio */}
        {speaker_bio && (
          <Text className={styles.bio} lineClamp={3}>
            {speaker_bio}
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