import { Tabs, Badge } from '@mantine/core';
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
      <Tabs defaultValue="chat" className={styles.tabs}>
        <Tabs.List>
          <Tabs.Tab value="chat" leftSection={<IconMessages size={20} />}>
            Chat
          </Tabs.Tab>
          <Tabs.Tab value="attendees" leftSection={<IconUsers size={20} />}>
            Attendees
          </Tabs.Tab>
          <Tabs.Tab
            value="requests"
            leftSection={<IconUserPlus size={20} />}
            rightSection={
              pendingCount > 0 ? (
                <Badge size="sm" color="red" variant="filled">
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
    </div>
  );
}