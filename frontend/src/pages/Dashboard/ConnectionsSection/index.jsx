import React from 'react';
import { Avatar } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/buttons';
import styles from './styles/index.module.css';

export const ConnectionsSection = ({ connections }) => {
  const navigate = useNavigate();

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
                <div className={styles.connectionName}>
                  {connection.user.display_name || connection.user.username}
                </div>
                <div className={styles.connectionRole}>
                  {connection.title && connection.company 
                    ? `${connection.title} at ${connection.company}`
                    : connection.title || connection.company || 'No title set'
                  }
                </div>
              </div>
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