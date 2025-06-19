import { Tabs } from '@mantine/core';
import { IconMessages, IconUsers } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { ChatArea } from './ChatArea';
import { AttendeesGrid } from './AttendeesGrid';
import styles from './styles/index.module.css';

export function Networking() {
  const { eventId } = useParams();

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
        </Tabs.List>

        <Tabs.Panel value="chat" className={styles.tabPanel}>
          <ChatArea eventId={eventId} />
        </Tabs.Panel>

        <Tabs.Panel value="attendees" className={styles.tabPanel}>
          <AttendeesGrid eventId={eventId} />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}