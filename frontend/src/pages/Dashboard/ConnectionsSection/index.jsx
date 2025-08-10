import React, { useState } from 'react';
import { Avatar } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useCreateDirectMessageThreadMutation } from '@/app/features/networking/api';
import { useDispatch } from 'react-redux';
import { openThread } from '@/app/store/chatSlice';
import { notifications } from '@mantine/notifications';
import { IconMessageCircle } from '@tabler/icons-react';
import { Button } from '@/shared/components/buttons';
import styles from './styles/index.module.css';

export const ConnectionsSection = ({ connections }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [createThread, { isLoading: isCreatingThread }] = useCreateDirectMessageThreadMutation();
  const [messagingUserId, setMessagingUserId] = useState(null);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarGradient = (index) => {
    const gradients = [
      'linear-gradient(45deg, #EC4899, #F472B6)',
      'linear-gradient(45deg, #06B6D4, #0891B2)',
      'linear-gradient(45deg, #F59E0B, #EAB308)',
      'linear-gradient(45deg, #10B981, #059669)',
      'linear-gradient(45deg, #8B5CF6, #A855F7)',
    ];
    return gradients[index % gradients.length];
  };

  const handleMessage = async (userId, userName) => {
    setMessagingUserId(userId);
    try {
      const result = await createThread(userId).unwrap();
      const threadId = result.thread_id || result.id || result.data?.thread_id || result.data?.id;
      
      if (threadId) {
        dispatch(openThread(threadId));
        notifications.show({
          title: 'Success',
          message: `Started conversation with ${userName}`,
          color: 'green',
        });
      } else {
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
      setMessagingUserId(null);
    }
  };

  return (
    <section className={styles.dashboardSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Recent Connections</h2>
        <Button 
          variant="secondary"
          onClick={() => navigate('/app/network')}
        >
          View All
        </Button>
      </div>

      {connections && connections.length > 0 ? (
        <div className={styles.connectionsList}>
          {connections.map((connection, index) => (
            <div key={connection.id} className={styles.connectionItem}>
              <Avatar
                src={connection.user.avatar_url}
                alt={connection.user.display_name || connection.user.username}
                size={35}
                radius={6}
                className={styles.connectionAvatar}
                styles={{
                  placeholder: {
                    background: getAvatarGradient(index),
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }
                }}
              >
                {getInitials(connection.user.display_name || connection.user.username)}
              </Avatar>
              <div className={styles.connectionInfo}>
                <div 
                  className={styles.connectionName}
                  onClick={() => navigate(`/app/users/${connection.user.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {connection.user.display_name || connection.user.username}
                </div>
                <div className={styles.connectionRole}>
                  {connection.title && connection.company 
                    ? `${connection.title} at ${connection.company}`
                    : connection.title || connection.company || ''
                  }
                </div>
              </div>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => handleMessage(
                  connection.user.id, 
                  connection.user.display_name || connection.user.username
                )}
                loading={messagingUserId === connection.user.id || isCreatingThread}
                className={styles.messageButton}
              >
                <IconMessageCircle size={16} />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>No connections yet. Start networking at events!</p>
          <Button 
            className={styles.btnPrimary}
            onClick={() => navigate('/app/events')}
          >
            Find Events
          </Button>
        </div>
      )}
    </section>
  );
};