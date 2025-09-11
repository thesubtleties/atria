import { useState } from 'react';
import { Table, Avatar, Group, Text, Badge, Button, ActionIcon } from '@mantine/core';
import { IconBrandLinkedin, IconBrandTwitter, IconWorld, IconMessageCircle } from '@tabler/icons-react';
import { useCreateDirectMessageThreadMutation } from '@/app/features/networking/api';
import { useDispatch, useSelector } from 'react-redux';
import { openThread } from '@/app/store/chatSlice';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import styles from './styles/index.module.css';

export function ConnectionRow({ connection }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
          <Text 
            fw={500} 
            className={styles.clickableName}
            onClick={() => navigate(`/app/users/${otherUser.id}`)}
            style={{ cursor: 'pointer', color: '#6366f1' }}
          >
            {otherUser.full_name}
          </Text>
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
      
      <Table.Td style={{ textAlign: 'center' }}>
        {connection.originating_event ? (
          <Badge 
            variant="light" 
            size="md"
            radius="sm"
            color="gray"
          >
            {connection.originating_event.title}
          </Badge>
        ) : (
          <Text size="sm" c="dimmed">Direct connection</Text>
        )}
      </Table.Td>
      
      <Table.Td>
        <Group gap={0} justify="flex-start" className={styles.socialLinks}>
          {/* LinkedIn - always render space */}
          {otherUser.social_links?.linkedin ? (
            <div className={styles.linkedinIcon}>
              <ActionIcon
                size="md"
                variant="subtle"
                component="a"
                href={otherUser.social_links.linkedin}
                target="_blank"
                aria-label="LinkedIn"
              >
                <IconBrandLinkedin size={18} />
              </ActionIcon>
            </div>
          ) : (
            <div className={styles.iconPlaceholder} />
          )}
          
          {/* Twitter - always render space */}
          {otherUser.social_links?.twitter ? (
            <div className={styles.twitterIcon}>
              <ActionIcon
                size="md"
                variant="subtle"
                component="a"
                href={otherUser.social_links.twitter}
                target="_blank"
                aria-label="Twitter"
              >
                <IconBrandTwitter size={18} />
              </ActionIcon>
            </div>
          ) : (
            <div className={styles.iconPlaceholder} />
          )}
          
          {/* Website - always render space */}
          {otherUser.social_links?.website ? (
            <div className={styles.websiteIcon}>
              <ActionIcon
                size="md"
                variant="subtle"
                component="a"
                href={otherUser.social_links.website}
                target="_blank"
                aria-label="Website"
              >
                <IconWorld size={18} />
              </ActionIcon>
            </div>
          ) : (
            <div className={styles.iconPlaceholder} />
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
      
      <Table.Td style={{ textAlign: 'center' }}>
        <Text size="sm" c="dimmed">
          {formatDate(connection.created_at)}
        </Text>
      </Table.Td>
      
      <Table.Td>
        <Group justify="center">
          <Button
            size="xs"
            variant="filled"
            color="violet"
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