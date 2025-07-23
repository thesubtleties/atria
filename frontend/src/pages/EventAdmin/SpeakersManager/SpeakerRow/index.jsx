import { Table, Group, Text, Avatar, Menu, ActionIcon, Badge, Tooltip, Stack } from '@mantine/core';
import {
  IconDots,
  IconUserCircle,
  IconEdit,
  IconMicrophone,
  IconTrash,
  IconMessage,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useUpdateEventUserMutation } from '@/app/features/events/api';
import styles from './styles.module.css';

const SpeakerRow = ({
  speaker,
  onEditSpeaker,
  currentUserRole,
  organizationId,
}) => {
  const navigate = useNavigate();
  const [updateUser] = useUpdateEventUserMutation();
  
  // Format time from 24hr to 12hr with AM/PM
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Capitalize first letter of each word
  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const handleRemoveSpeaker = async () => {
    if (!window.confirm(`Remove ${speaker.full_name} as a speaker? They will become a regular attendee.`)) {
      return;
    }

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
  };

  // Truncate bio for display
  const truncateBio = (bio, maxLength = 100) => {
    if (!bio) return 'No bio provided';
    if (bio.length <= maxLength) return bio;
    return bio.substring(0, maxLength) + '...';
  };

  const canManage = ['ADMIN', 'ORGANIZER'].includes(currentUserRole);

  // Display the speaker-specific title/bio or fall back to user profile
  const displayTitle = speaker.speaker_title || speaker.title || 'No title';
  const displayBio = speaker.speaker_bio || speaker.bio || '';

  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="sm">
          <Avatar
            src={speaker.image_url}
            alt={speaker.full_name}
            radius="xl"
            size="md"
            className={styles.userAvatar}
          >
            {speaker.first_name?.[0]}{speaker.last_name?.[0]}
          </Avatar>
          <div>
            <Text size="sm" fw={500}>
              {speaker.full_name}
            </Text>
            <Text size="xs" c="dimmed">
              {speaker.email}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
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
                styles={{
                  root: { 
                    textTransform: 'none',
                    fontWeight: 400,
                    fontSize: '11px',
                    padding: '2px 6px',
                    height: 'auto'
                  }
                }}
              >
                Custom
              </Badge>
            </Tooltip>
          )}
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{speaker.company_name || '-'}</Text>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        {speaker.session_count > 0 ? (
          <Tooltip
            label={
              <Stack gap="xs">
                {speaker.sessions?.map((session) => (
                  <div key={session.id}>
                    <Text size="sm" fw={500}>{session.title}</Text>
                    <Text size="xs" c="dimmed">
                      {session.day_number ? `Day ${session.day_number}` : 'Day TBD'}
                      {session.start_time && session.end_time && (
                        <> • {formatTime(session.start_time)} - {formatTime(session.end_time)}</>
                      )}
                      {session.session_type && <> • {capitalizeWords(session.session_type)}</>}
                      {session.role && <> • {capitalizeWords(session.role)}</>}
                    </Text>
                  </div>
                ))}
              </Stack>
            }
            multiline
            maw={400}
            withArrow
          >
            <Badge 
              variant="light" 
              color="green" 
              radius="sm" 
              className={styles.sessionBadge}
              style={{ cursor: 'pointer' }}
            >
              {speaker.session_count}
            </Badge>
          </Tooltip>
        ) : (
          <Badge variant="light" color="gray" radius="sm" className={`${styles.sessionBadge} ${styles.unassigned}`}>
            0
          </Badge>
        )}
      </Table.Td>
      <Table.Td>
        <Tooltip label={displayBio} multiline maw={300}>
          <Text size="sm" lineClamp={2} className={styles.bioText}>
            {truncateBio(displayBio)}
          </Text>
        </Tooltip>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <Menu 
          shadow="md" 
          width={200} 
          position="bottom-end"
        >
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" className={styles.actionButton}>
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
            
            {canManage && (
              <>
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
              </>
            )}
            
            <Menu.Item
              leftSection={<IconMessage size={16} />}
              onClick={() => {
                // TODO: Implement direct message
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
      </Table.Td>
    </Table.Tr>
  );
};

export default SpeakerRow;