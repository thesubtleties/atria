import { useState, useEffect } from 'react';
import { Badge, Container } from '@mantine/core';
import { IconMessages, IconUsers, IconUserPlus } from '@tabler/icons-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ChatArea } from './ChatArea';
import { AttendeesGrid } from './AttendeesGrid';
import { RequestsList } from './RequestsList';
import { useGetPendingConnectionsQuery } from '@/app/features/networking/api';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import styles from './styles/index.module.css';

export function Networking() {
  const { eventId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize from URL param or default based on device
    const tabParam = searchParams.get('tab');
    // On mobile, default to 'attendees' since chat is in mobile container
    // On desktop, default to 'chat'
    return tabParam || (isMobile ? 'attendees' : 'chat');
  });
  
  // Get pending connections count for badge
  const { data: pendingData } = useGetPendingConnectionsQuery({
    page: 1,
    perPage: 1,
  });
  
  const pendingCount = pendingData?.total_items || 0;

  // Sync URL params when tab changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', activeTab);
    
    // Remove room param if not on chat tab
    if (activeTab !== 'chat') {
      newParams.delete('room');
    }
    // Keep existing room param if we're on chat tab
    
    setSearchParams(newParams, { replace: true });
  }, [activeTab, searchParams, setSearchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className={styles.container}>
      {/* Background Shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />
      
      <Container size="xl" className={styles.contentWrapper}>
        {/* Header Section */}
        <section className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Networking</h1>
          <p className={styles.pageSubtitle}>
            Connect with attendees, chat in rooms, and manage connection requests
          </p>
        </section>

        {/* Main Content Section */}
        <section className={styles.mainContent}>
          <div className={styles.customTabsContainer}>
            {/* Custom Tab List */}
            <div className={styles.customTabsList}>
              {/* Only show Chat tab on desktop */}
              {!isMobile && (
                <button 
                  className={`${styles.customTab} ${activeTab === 'chat' ? styles.customTabActive : ''}`}
                  onClick={() => handleTabChange('chat')}
                >
                  <IconMessages size={18} />
                  <span>Chat</span>
                </button>
              )}
              <button 
                className={`${styles.customTab} ${activeTab === 'attendees' ? styles.customTabActive : ''}`}
                onClick={() => handleTabChange('attendees')}
              >
                <IconUsers size={18} />
                <span>Attendees</span>
              </button>
              <button
                className={`${styles.customTab} ${activeTab === 'requests' ? styles.customTabActive : ''}`}
                onClick={() => handleTabChange('requests')}
              >
                <IconUserPlus size={18} />
                <span>Requests</span>
                {pendingCount > 0 && (
                  <Badge size="xs" variant="light" className={styles.customBadge}>
                    {pendingCount}
                  </Badge>
                )}
              </button>
            </div>

            {/* Custom Tab Panels */}
            <div className={styles.customTabPanel}>
              {activeTab === 'chat' && (
                <div className={styles.chatWrapper}>
                  <ChatArea eventId={eventId} />
                </div>
              )}
              {activeTab === 'attendees' && <AttendeesGrid eventId={eventId} />}
              {activeTab === 'requests' && <RequestsList eventId={eventId} />}
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
}