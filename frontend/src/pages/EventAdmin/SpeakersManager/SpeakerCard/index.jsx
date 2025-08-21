import { Group, Text, Avatar, Menu, ActionIcon, Badge, Tooltip, Stack, Alert, Collapse } from '@mantine/core';
import {
  IconDots,
  IconUserCircle,
  IconEdit,
  IconMicrophone,
  IconTrash,
  IconMessage,
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { openConfirmationModal } from '@/shared/components/modals/ConfirmationModal';
import { useUpdateEventUserMutation } from '@/app/features/events/api';
import styles from './styles.module.css';

const SpeakerCard = ({
  speaker,
  onEditSpeaker,
  currentUserRole,
  organizationId,
}) => {
  const navigate = useNavigate();
  const [updateUser] = useUpdateEventUserMutation();
  const [sessionsExpanded, setSessionsExpanded] = useState(false);

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const handleRemoveSpeaker = () => {
    openConfirmationModal({
      title: 'Remove Speaker Role',
      confirmLabel: 'Remove Speaker',
      cancelLabel: 'Cancel',
      isDangerous: true,
      children: (
        <Stack spacing="md">
          <Text size="sm">
            Remove {speaker.full_name} as a speaker? They will become a regular attendee.
          </Text>
          {speaker.session_count > 0 && (
            <Alert 
              icon={<IconAlertCircle size={16} />} 
              color="red" 
              variant="light"
            >
              <Text size="sm" fw={500}>
                Warning: Session Removal
              </Text>
              <Text size="sm" mt="xs">
                This will also remove them from {speaker.session_count} session{speaker.session_count > 1 ? 's' : ''} they are currently assigned to speak at.
                This action cannot be undone automatically.
              </Text>
            </Alert>
          )}
        </Stack>
      ),
      onConfirm: async () => {
        try {
          await updateUser({
            eventId: speaker.event_id,
            userId: speaker.user_id,
            role: 'ATTENDEE',
          }).unwrap();
          
          notifications.show({
            title: 'Success',
            message: `${speaker.full_name} is no longer a speaker`,
            color: 'green',
          });
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: error.data?.message || 'Failed to update role',
            color: 'red',
          });
        }
      },
    });
  };

  const truncateBio = (bio, maxLength = 80) => {
    if (!bio) return 'No bio provided';
    if (bio.length <= maxLength) return bio;
    return bio.substring(0, maxLength) + '...';
  };

  const canManage = ['ADMIN', 'ORGANIZER'].includes(currentUserRole);
  const displayTitle = speaker.speaker_title || speaker.title || 'No title';
  const displayBio = speaker.speaker_bio || speaker.bio || '';

  return (
    <div className={styles.card}>
      {/* Card Actions - Top right corner */}
      {canManage && (
        <div className={styles.cardActions}>
          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" className={styles.actionButton}>
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconUserCircle size={16} />}
                onClick={() => navigate(`/app/users/${speaker.user_id}`)}
              >
                View Profile
              </Menu.Item>
              
              <Menu.Item
                leftSection={<IconEdit size={16} />}
                onClick={() => onEditSpeaker(speaker)}
              >
                Edit Speaker Info
              </Menu.Item>
              
              <Menu.Item
                leftSection={<IconMicrophone size={16} />}
                onClick={() => navigate(`/app/organizations/${organizationId}/events/${speaker.event_id}/admin/sessions`)}
              >
                Manage Sessions
              </Menu.Item>
              
              <Menu.Divider />
              
              <Menu.Item
                leftSection={<IconTrash size={16} />}
                color="red"
                onClick={handleRemoveSpeaker}
              >
                Remove Speaker Role
              </Menu.Item>
              
              <Menu.Item
                leftSection={<IconMessage size={16} />}
                onClick={() => {
                  notifications.show({
                    title: 'Coming Soon',
                    message: 'Direct messaging will be available soon',
                    color: 'blue',
                  });
                }}
              >
                Send Message
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      )}

      {/* User Info Section */}
      <div className={styles.userInfo}>
        <Avatar
          src={speaker.image_url}
          alt={speaker.full_name}
          radius="xl"
          size={50}
          className={styles.avatar}
        >
          {speaker.first_name?.[0]}{speaker.last_name?.[0]}
        </Avatar>
        <div className={styles.userDetails}>
          <Text fw={600} className={styles.userName}>
            {speaker.full_name}
          </Text>
          <Text size="sm" className={styles.userEmail}>
            {speaker.email}
          </Text>
        </div>
      </div>

      {/* Title and Company Section */}
      <div className={styles.professionalInfo}>
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" className={styles.titleText}>
            {displayTitle}
          </Text>
          {speaker.speaker_title && speaker.title && speaker.speaker_title !== speaker.title && (
            <Tooltip label={`Profile title: ${speaker.title}`}>
              <Badge 
                size="xs" 
                variant="light" 
                color="blue"
                radius="sm"
                className={styles.customBadge}
              >
                Custom
              </Badge>
            </Tooltip>
          )}
        </Group>
        {speaker.company_name && (
          <Text size="sm" className={styles.companyText}>
            {speaker.company_name}
          </Text>
        )}
      </div>

      {/* Sessions Section */}
      <div className={styles.sessionsSection}>
        <Text size="sm" fw={500} className={styles.sessionLabel}>
          Sessions
        </Text>
        {speaker.session_count > 0 ? (
          <Badge 
            variant="light" 
            color="green" 
            radius="sm" 
            className={styles.sessionBadge}
            style={{ cursor: 'pointer' }}
            onClick={() => setSessionsExpanded(!sessionsExpanded)}
            rightSection={
              sessionsExpanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />
            }
          >
            {speaker.session_count} Session{speaker.session_count > 1 ? 's' : ''}
          </Badge>
        ) : (
          <Badge 
            variant="light" 
            color="gray" 
            radius="sm" 
            className={styles.sessionBadge}
          >
            No Sessions
          </Badge>
        )}
      </div>

      {/* Expandable Sessions List */}
      {speaker.session_count > 0 && (
        <Collapse in={sessionsExpanded}>
          <div className={styles.sessionsList}>
            {speaker.sessions?.map((session) => (
              <div key={session.id} className={styles.sessionItem}>
                <Text size="sm" fw={500} className={styles.sessionTitle}>
                  {session.title}
                </Text>
                <Text size="xs" c="dimmed" className={styles.sessionDetails}>
                  {session.day_number ? `Day ${session.day_number}` : 'Day TBD'}
                  {session.start_time && session.end_time && (
                    <> • {formatTime(session.start_time)} - {formatTime(session.end_time)}</>
                  )}
                  {session.session_type && <> • {capitalizeWords(session.session_type)}</>}
                  {session.role && <> • {capitalizeWords(session.role)}</>}
                </Text>
              </div>
            ))}
          </div>
        </Collapse>
      )}

      {/* Bio Section */}
      {displayBio && (
        <div className={styles.bioSection}>
          <Tooltip label={displayBio} multiline maw={300}>
            <Text size="sm" className={styles.bioText}>
              {truncateBio(displayBio)}
            </Text>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default SpeakerCard;