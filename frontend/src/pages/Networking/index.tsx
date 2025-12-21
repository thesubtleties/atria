import { useState, useEffect } from 'react';
import { Badge, Container } from '@mantine/core';
import { IconMessages, IconUsers, IconUserPlus } from '@tabler/icons-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/shared/components/PageHeader';
import { ChatArea } from './ChatArea';
import { AttendeesGrid } from './AttendeesGrid';
import { RequestsList } from './RequestsList';
import { useGetPendingConnectionsQuery } from '@/app/features/networking/api';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type TabType = 'chat' | 'attendees' | 'requests';

type PendingConnectionsResponse = {
  total_items?: number;
};

export function Networking() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    // Initialize from URL param or default based on device
    const tabParam = searchParams.get('tab') as TabType | null;
    // On mobile, default to 'attendees' since chat is in mobile container
    // On desktop, default to 'chat'
    return tabParam || (isMobile ? 'attendees' : 'chat');
  });

  // Get pending connections count for badge
  const { data: pendingData } = useGetPendingConnectionsQuery({
    page: 1,
    perPage: 1,
  });

  const typedPendingData = pendingData as PendingConnectionsResponse | undefined;
  const pendingCount = typedPendingData?.total_items || 0;

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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <div className={cn(styles.container, activeTab === 'chat' && !isMobile && styles.chatActive)}>
      {/* Background Shapes */}
      <div className={cn(styles.bgShape1)} />
      <div className={cn(styles.bgShape2)} />

      <Container size='xl' className={cn(styles.contentWrapper)}>
        <PageHeader
          title='Networking'
          subtitle='Connect with attendees, chat in rooms, and manage connection requests'
          className={cn(styles.headerSection)}
        />

        {/* Main Content Section */}
        <section className={cn(styles.mainContent)}>
          <div className={cn(styles.customTabsContainer)}>
            {/* Conditionally wrap tabs: glass wrapper for non-chat tabs */}
            {
              activeTab !== 'chat' || isMobile ?
                <div className={cn(styles.tabBarWrapper)}>
                  <div className={cn(styles.customTabsList)}>
                    {/* Only show Chat tab on desktop */}
                    {!isMobile && (
                      <button
                        type='button'
                        className={cn(
                          styles.customTab,
                          activeTab === 'chat' && styles.customTabActive,
                        )}
                        onClick={() => handleTabChange('chat')}
                      >
                        <IconMessages size={18} />
                        <span>Chat</span>
                      </button>
                    )}
                    <button
                      type='button'
                      className={cn(
                        styles.customTab,
                        activeTab === 'attendees' && styles.customTabActive,
                      )}
                      onClick={() => handleTabChange('attendees')}
                    >
                      <IconUsers size={18} />
                      <span>Attendees</span>
                    </button>
                    <button
                      type='button'
                      className={cn(
                        styles.customTab,
                        activeTab === 'requests' && styles.customTabActive,
                      )}
                      onClick={() => handleTabChange('requests')}
                    >
                      <IconUserPlus size={18} />
                      <span>Requests</span>
                      {pendingCount > 0 && (
                        <Badge size='xs' variant='light' className={cn(styles.customBadge)}>
                          {pendingCount}
                        </Badge>
                      )}
                    </button>
                  </div>
                </div>
                // Chat: tabs directly in container (no wrapper)
              : <div className={cn(styles.customTabsList)}>
                  {/* Only show Chat tab on desktop */}
                  {!isMobile && (
                    <button
                      type='button'
                      className={cn(styles.customTab, styles.customTabActive)}
                      onClick={() => handleTabChange('chat')}
                    >
                      <IconMessages size={18} />
                      <span>Chat</span>
                    </button>
                  )}
                  <button
                    type='button'
                    className={cn(styles.customTab)}
                    onClick={() => handleTabChange('attendees')}
                  >
                    <IconUsers size={18} />
                    <span>Attendees</span>
                  </button>
                  <button
                    type='button'
                    className={cn(styles.customTab)}
                    onClick={() => handleTabChange('requests')}
                  >
                    <IconUserPlus size={18} />
                    <span>Requests</span>
                    {pendingCount > 0 && (
                      <Badge size='xs' variant='light' className={cn(styles.customBadge)}>
                        {pendingCount}
                      </Badge>
                    )}
                  </button>
                </div>

            }

            {/* Custom Tab Panels */}
            <div className={cn(styles.customTabPanel)}>
              {activeTab === 'chat' && eventId && (
                <div className={cn(styles.chatWrapper)}>
                  <ChatArea eventId={eventId} />
                </div>
              )}
              {activeTab === 'attendees' && eventId && <AttendeesGrid eventId={eventId} />}
              {activeTab === 'requests' && <RequestsList />}
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
}
