import { useState } from 'react';
import { Avatar, Group, Text, Badge, Button, ActionIcon } from '@mantine/core';
import { IconBrandLinkedin, IconWorld, IconMessageCircle } from '@tabler/icons-react';
import { useCreateDirectMessageThreadMutation } from '@/app/features/networking/api';
import { useDispatch, useSelector } from 'react-redux';
import { openThread } from '@/app/store/chatSlice';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import styles from './styles/index.module.css';

export function ConnectionCard({ connection }) {
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
    <div className={styles.card}>
      {/* Header with avatar and basic info */}
      <div className={styles.cardHeader}>
        <div className={styles.userInfo}>
          <Avatar
            src={otherUser.image_url}
            alt={otherUser.full_name}
            radius="xl"
            size={50}
            className={styles.avatar}
          >
            {otherUser.full_name?.[0]?.toUpperCase()}
          </Avatar>
          <div className={styles.userDetails}>
            <Text 
              fw={600} 
              className={styles.userName}
              onClick={() => navigate(`/app/users/${otherUser.id}`)}
            >
              {otherUser.full_name}
            </Text>
            {otherUser.title && (
              <Text size="sm" className={styles.userTitle}>
                {otherUser.title}
              </Text>
            )}
            {otherUser.company_name && (
              <Text size="sm" className={styles.userCompany}>
                {otherUser.company_name}
              </Text>
            )}
          </div>
        </div>
      </div>

      {/* Connection info */}
      <div className={styles.connectionInfo}>
        <div className={styles.connectionEvent}>
          {connection.originating_event ? (
            <Badge 
              variant="light" 
              size="sm"
              radius="sm"
              className={styles.eventBadge}
            >
              {connection.originating_event.title}
            </Badge>
          ) : (
            <Text size="sm" className={styles.directConnection}>
              Direct connection
            </Text>
          )}
        </div>
        <Text size="xs" className={styles.connectionDate}>
          Connected {formatDate(connection.created_at)}
        </Text>
      </div>

      {/* Social links and email */}
      <div className={styles.contactInfo}>
        {/* Social Links */}
        <div className={styles.socialLinks}>
          {otherUser.social_links?.linkedin && (
            <ActionIcon
              size="sm"
              variant="subtle"
              component="a"
              href={otherUser.social_links.linkedin}
              target="_blank"
              aria-label="LinkedIn"
              className={styles.socialLink}
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
              className={styles.socialLink}
            >
              <IconWorld size={16} />
            </ActionIcon>
          )}
        </div>

        {/* Email */}
        {otherUser.email && otherUser.privacy_settings?.show_email !== false && (
          <Text size="xs" className={styles.email}>
            <a href={`mailto:${otherUser.email}`} className={styles.emailLink}>
              {otherUser.email}
            </a>
          </Text>
        )}
      </div>

      {/* Actions */}
      <div className={styles.cardActions}>
        <Button
          size="sm"
          variant="filled"
          color="violet"
          leftSection={<IconMessageCircle size={16} />}
          onClick={handleMessage}
          loading={isMessaging || isCreatingThread}
          className={styles.messageButton}
          fullWidth
        >
          Message
        </Button>
      </div>
    </div>
  );
}