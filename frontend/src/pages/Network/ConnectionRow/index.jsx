import { useState } from 'react';
import { Table, Avatar, Group, Text, Badge, Button, ActionIcon } from '@mantine/core';
import { IconBrandLinkedin, IconWorld, IconMessageCircle } from '@tabler/icons-react';
import { useCreateDirectMessageThreadMutation } from '@/app/features/networking/api';
import { useDispatch, useSelector } from 'react-redux';
import { openThread } from '@/app/store/chatSlice';
import { notifications } from '@mantine/notifications';
import styles from './styles/index.module.css';

export function ConnectionRow({ connection }) {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const [createThread, { isLoading: isCreatingThread }] = useCreateDirectMessageThreadMutation();
  const [isMessaging, setIsMessaging] = useState(false);

  // Determine the other user based on current user
  const otherUser = connection.requester.id === currentUser?.id 
    ? connection.recipient 
    : connection.requester;

  const handleMessage = async () => {
    setIsMessaging(true);
    try {
      const result = await createThread(otherUser.id).unwrap();
      console.log('Create thread result:', result);
      
      // Handle different response formats
      const threadId = result.thread_id || result.id || result.data?.thread_id || result.data?.id;
      
      if (threadId) {
        dispatch(openThread(threadId));
        
        notifications.show({
          title: 'Success',
          message: `Started conversation with ${otherUser.full_name}`,
          color: 'green',
        });
      } else {
        console.error('No thread ID in result:', result);
        throw new Error('Failed to get thread ID');
      }
    } catch (error) {
      console.error('Failed to create/open thread:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to start conversation. Please try again.',
        color: 'red',
      });
    } finally {
      setIsMessaging(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Table.Tr className={styles.row}>
      <Table.Td>
        <Group gap="sm">
          <Avatar
            src={otherUser.image_url}
            alt={otherUser.full_name}
            radius="xl"
            size={40}
          >
            {otherUser.full_name?.[0]?.toUpperCase()}
          </Avatar>
          <Text fw={500}>{otherUser.full_name}</Text>
        </Group>
      </Table.Td>
      
      <Table.Td>
        <div>
          {otherUser.title && (
            <Text size="sm">{otherUser.title}</Text>
          )}
          {otherUser.company_name && (
            <Text size="sm" c="dimmed">{otherUser.company_name}</Text>
          )}
        </div>
      </Table.Td>
      
      <Table.Td>
        {connection.originating_event ? (
          <Badge 
            variant="light" 
            size="md"
            radius="sm"
            color="blue"
          >
            {connection.originating_event.title}
          </Badge>
        ) : (
          <Text size="sm" c="dimmed">Direct connection</Text>
        )}
      </Table.Td>
      
      <Table.Td>
        <Group gap="xs">
          {otherUser.social_links?.linkedin && (
            <ActionIcon
              size="sm"
              variant="subtle"
              component="a"
              href={otherUser.social_links.linkedin}
              target="_blank"
              aria-label="LinkedIn"
            >
              <IconBrandLinkedin size={16} />
            </ActionIcon>
          )}
          {otherUser.social_links?.website && (
            <ActionIcon
              size="sm"
              variant="subtle"
              component="a"
              href={otherUser.social_links.website}
              target="_blank"
              aria-label="Website"
            >
              <IconWorld size={16} />
            </ActionIcon>
          )}
        </Group>
      </Table.Td>
      
      <Table.Td>
        {otherUser.email && otherUser.privacy_settings?.show_email !== false ? (
          <Text size="sm">
            <a href={`mailto:${otherUser.email}`} className={styles.emailLink}>
              {otherUser.email}
            </a>
          </Text>
        ) : (
          <Text size="sm" c="dimmed">-</Text>
        )}
      </Table.Td>
      
      <Table.Td>
        <Text size="sm" c="dimmed">
          {formatDate(connection.created_at)}
        </Text>
      </Table.Td>
      
      <Table.Td>
        <Group justify="center">
          <Button
            size="xs"
            variant="light"
            leftSection={<IconMessageCircle size={14} />}
            onClick={handleMessage}
            loading={isMessaging || isCreatingThread}
          >
            Message
          </Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}