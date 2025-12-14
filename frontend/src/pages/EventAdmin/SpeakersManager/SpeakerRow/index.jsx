import {
  Table,
  Group,
  Text,
  Avatar,
  Menu,
  ActionIcon,
  Badge,
  Tooltip,
  Stack,
  Alert,
} from '@mantine/core';
import {
  IconDots,
  IconUserCircle,
  IconEdit,
  IconMicrophone,
  IconTrash,
  IconMessage,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { openConfirmationModal } from '@/shared/components/modals/ConfirmationModal';
import { useUpdateEventUserMutation } from '@/app/features/events/api';
import { formatTime, capitalizeWords, truncateText } from '@/shared/utils/formatting';
import styles from './styles.module.css';

const SpeakerRow = ({ speaker, onEditSpeaker, currentUserRole }) => {
  const navigate = useNavigate();
  const [updateUser] = useUpdateEventUserMutation();

  const handleRemoveSpeaker = () => {
    openConfirmationModal({
      title: 'Remove Speaker Role',
      confirmLabel: 'Remove Speaker',
      cancelLabel: 'Cancel',
      isDangerous: true,
      children: (
        <Stack spacing='md'>
          <Text size='sm'>
            Remove {speaker.full_name} as a speaker? They will become a regular attendee.
          </Text>
          {speaker.session_count > 0 && (
            <Alert icon={<IconAlertCircle size={16} />} color='red' variant='light'>
              <Text size='sm' fw={500}>
                Warning: Session Removal
              </Text>
              <Text size='sm' mt='xs'>
                This will also remove them from {speaker.session_count} session
                {speaker.session_count > 1 ? 's' : ''} they are currently assigned to speak at. This
                action cannot be undone automatically.
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

  const canManage = ['ADMIN', 'ORGANIZER'].includes(currentUserRole);

  // Display the speaker-specific title/bio or fall back to user profile
  const displayTitle = speaker.speaker_title || speaker.title || 'No title';
  const displayBio = speaker.speaker_bio || speaker.bio || '';

  return (
    <Table.Tr>
      <Table.Td>
        <Group gap='sm' wrap='nowrap'>
          <Avatar
            src={speaker.image_url}
            alt={speaker.full_name}
            radius='xl'
            size='md'
            className={styles.userAvatar}
          >
            {speaker.first_name?.[0]}
            {speaker.last_name?.[0]}
          </Avatar>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Text size='sm' fw={500} truncate>
              {speaker.full_name}
            </Text>
            <Text size='xs' c='dimmed' truncate>
              {speaker.email}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap='xs' wrap='nowrap'>
          <Text size='sm' className={styles.titleText}>
            {displayTitle}
          </Text>
          {speaker.speaker_title && speaker.title && speaker.speaker_title !== speaker.title && (
            <Tooltip label={`Profile title: ${speaker.title}`}>
              <Badge
                size='xs'
                variant='light'
                color='blue'
                radius='sm'
                styles={{
                  root: {
                    textTransform: 'none',
                    fontWeight: 400,
                    fontSize: '11px',
                    padding: '2px 6px',
                    height: 'auto',
                  },
                }}
              >
                Custom
              </Badge>
            </Tooltip>
          )}
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size='sm'>{speaker.company_name || '-'}</Text>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        {speaker.session_count > 0 ?
          <Tooltip
            label={
              <Stack gap='xs'>
                {speaker.sessions?.map((session) => (
                  <div key={session.id}>
                    <Text size='sm' fw={500}>
                      {session.title}
                    </Text>
                    <Text size='xs' c='dimmed'>
                      {session.day_number ? `Day ${session.day_number}` : 'Day TBD'}
                      {session.start_time && session.end_time && (
                        <>
                          {' '}
                          • {formatTime(session.start_time)} - {formatTime(session.end_time)}
                        </>
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
              variant='light'
              color='green'
              radius='sm'
              className={styles.sessionBadge}
              style={{ cursor: 'pointer' }}
            >
              {speaker.session_count}
            </Badge>
          </Tooltip>
        : <Badge
            variant='light'
            color='gray'
            radius='sm'
            className={`${styles.sessionBadge} ${styles.unassigned}`}
          >
            0
          </Badge>
        }
      </Table.Td>
      <Table.Td>
        <Tooltip label={displayBio} multiline maw={300}>
          <Text size='sm' lineClamp={2} className={styles.bioText}>
            {truncateText(displayBio, {
              maxLength: 100,
              fallback: 'No bio provided',
              wordBoundary: true,
            })}
          </Text>
        </Tooltip>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <Menu shadow='md' width={200} position='bottom-end'>
          <Menu.Target>
            <ActionIcon variant='subtle' color='gray' className={styles.actionButton}>
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
                  onClick={() => navigate(`/app/events/${speaker.event_id}/admin/sessions`)}
                >
                  Manage Sessions
                </Menu.Item>

                <Menu.Divider />

                <Menu.Item
                  leftSection={<IconTrash size={16} />}
                  color='red'
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
