import { Tabs, Badge, Container } from '@mantine/core';
import { IconMessages, IconUsers, IconUserPlus } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { ChatArea } from './ChatArea';
import { AttendeesGrid } from './AttendeesGrid';
import { RequestsList } from './RequestsList';
import { useGetPendingConnectionsQuery } from '@/app/features/networking/api';
import styles from './styles/index.module.css';

export function Networking() {
  const { eventId } = useParams();
  
  // Get pending connections count for badge
  const { data: pendingData } = useGetPendingConnectionsQuery({
    page: 1,
    perPage: 1,
  });
  
  const pendingCount = pendingData?.total_items || 0;

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
          <Tabs defaultValue="chat" className={styles.tabsContainer}>
            <Tabs.List className={styles.tabsList}>
              <Tabs.Tab 
                value="chat" 
                className={styles.tab}
                leftSection={<IconMessages size={18} />}
              >
                Chat
              </Tabs.Tab>
              <Tabs.Tab 
                value="attendees" 
                className={styles.tab}
                leftSection={<IconUsers size={18} />}
              >
                Attendees
              </Tabs.Tab>
              <Tabs.Tab
                value="requests"
                className={styles.tab}
                leftSection={<IconUserPlus size={18} />}
                rightSection={
                  pendingCount > 0 ? (
                    <Badge size="xs" variant="light">
                      {pendingCount}
                    </Badge>
                  ) : null
                }
              >
                Requests
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="chat" className={styles.tabPanel}>
              <ChatArea eventId={eventId} />
            </Tabs.Panel>

            <Tabs.Panel value="attendees" className={styles.tabPanel}>
              <AttendeesGrid eventId={eventId} />
            </Tabs.Panel>

            <Tabs.Panel value="requests" className={styles.tabPanel}>
              <RequestsList eventId={eventId} />
            </Tabs.Panel>
          </Tabs>
        </section>
      </Container>
    </div>
  );
}