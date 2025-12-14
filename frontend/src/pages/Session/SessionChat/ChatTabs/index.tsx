import { useState, useMemo } from 'react';
import { Tabs, Badge, Center, Text } from '@mantine/core';
import { LoadingContent } from '../../../../shared/components/loading';
import { IconUsers, IconUserShield } from '@tabler/icons-react';
import { useSendMessageMutation } from '@/app/features/chat/api';
import { ChatRoomView } from '../ChatRoomView';
import type { SessionChatRoom } from '@/types/chat';
import type { Session } from '@/types/events';
import styles from './styles/index.module.css';

interface ChatTabsProps {
  chatRooms: SessionChatRoom[] | undefined;
  sessionData?: Session | undefined;
  isLoading: boolean;
  error: unknown;
  canModerate: boolean;
}

type TabValue = 'public' | 'backstage';

interface InputValues {
  [roomId: number]: string;
}

export function ChatTabs({ chatRooms, sessionData, isLoading, error, canModerate }: ChatTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('public');
  const [inputValues, setInputValues] = useState<InputValues>({});
  const [sendMessage] = useSendMessageMutation();

  const publicRoom = useMemo(
    () => chatRooms?.find((room) => room.room_type === 'PUBLIC'),
    [chatRooms],
  );

  const backstageRoom = useMemo(
    () => chatRooms?.find((room) => room.room_type === 'BACKSTAGE'),
    [chatRooms],
  );

  const handleSendMessage = async (roomId: number | undefined): Promise<void> => {
    if (roomId === undefined) return;
    const content = inputValues[roomId]?.trim();
    if (!content) return;

    try {
      await sendMessage({ chatRoomId: roomId, content }).unwrap();
      setInputValues((prev) => ({ ...prev, [roomId]: '' }));
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleInputChange = (roomId: number | undefined, value: string): void => {
    if (roomId === undefined) return;
    setInputValues((prev) => ({ ...prev, [roomId]: value }));
  };

  const handleTabChange = (value: string | null): void => {
    if (value === 'public' || value === 'backstage') {
      setActiveTab(value);
    }
  };

  if (isLoading) {
    return (
      <Center className={styles.loadingState ?? ''} py='xl'>
        <LoadingContent message='Loading chat rooms...' size='sm' />
      </Center>
    );
  }

  if (error) {
    return (
      <Center className={styles.errorState ?? ''} py='xl'>
        <Text size='sm' c='dimmed'>
          Error loading chat rooms
        </Text>
      </Center>
    );
  }

  if (!chatRooms || chatRooms.length === 0) {
    return (
      <Center className={styles.emptyState ?? ''} py='xl'>
        <Text size='sm' c='dimmed'>
          No chat rooms available
        </Text>
      </Center>
    );
  }

  return (
    <Tabs
      value={activeTab}
      onChange={handleTabChange}
      className={styles.tabs ?? ''}
      variant='default'
    >
      <Tabs.List className={styles.tabsList ?? ''}>
        <Tabs.Tab value='public' leftSection={<IconUsers size={16} />}>
          Chat
          {publicRoom && publicRoom.message_count > 0 && (
            <Badge size='xs' variant='light' color='violet' ml='xs'>
              {publicRoom.message_count}
            </Badge>
          )}
        </Tabs.Tab>
        {backstageRoom && (
          <Tabs.Tab value='backstage' leftSection={<IconUserShield size={16} />}>
            Backstage
            {backstageRoom.message_count > 0 && (
              <Badge size='xs' variant='light' color='violet' ml='xs'>
                {backstageRoom.message_count}
              </Badge>
            )}
          </Tabs.Tab>
        )}
      </Tabs.List>

      <Tabs.Panel value='public' className={styles.tabPanel ?? ''}>
        <ChatRoomView
          room={publicRoom}
          sessionData={sessionData}
          inputValue={inputValues[publicRoom?.id ?? -1] ?? ''}
          onInputChange={(value: string) => handleInputChange(publicRoom?.id, value)}
          onSendMessage={() => handleSendMessage(publicRoom?.id)}
          isActive={activeTab === 'public'}
          canModerate={canModerate}
        />
      </Tabs.Panel>

      {backstageRoom && (
        <Tabs.Panel value='backstage' className={styles.tabPanel ?? ''}>
          <ChatRoomView
            room={backstageRoom}
            sessionData={sessionData}
            inputValue={inputValues[backstageRoom.id] ?? ''}
            onInputChange={(value: string) => handleInputChange(backstageRoom.id, value)}
            onSendMessage={() => handleSendMessage(backstageRoom.id)}
            isActive={activeTab === 'backstage'}
            canModerate={canModerate}
          />
        </Tabs.Panel>
      )}
    </Tabs>
  );
}
