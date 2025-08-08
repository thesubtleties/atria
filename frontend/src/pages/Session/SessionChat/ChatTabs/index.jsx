import { useState, useMemo } from 'react';
import { Tabs, Badge, Center, Text, Loader } from '@mantine/core';
import { IconUsers, IconUserShield } from '@tabler/icons-react';
import { useSendMessageMutation } from '@/app/features/chat/api';
import { ChatRoomView } from '../ChatRoomView';
import styles from './styles/index.module.css';

export function ChatTabs({ 
  chatRooms, 
  sessionData,
  isLoading,
  error,
  canModerate 
}) {
  const [activeTab, setActiveTab] = useState('public');
  const [inputValues, setInputValues] = useState({});
  const [sendMessage] = useSendMessageMutation();

  // Get public and backstage rooms
  const publicRoom = useMemo(() => 
    chatRooms?.find(room => room.room_type === 'PUBLIC'), 
    [chatRooms]
  );
  
  const backstageRoom = useMemo(() => 
    chatRooms?.find(room => room.room_type === 'BACKSTAGE'), 
    [chatRooms]
  );

  const handleSendMessage = async (roomId) => {
    const content = inputValues[roomId]?.trim();
    if (!content) return;

    try {
      await sendMessage({ chatRoomId: roomId, content }).unwrap();
      setInputValues(prev => ({ ...prev, [roomId]: '' }));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleInputChange = (roomId, value) => {
    setInputValues(prev => ({ ...prev, [roomId]: value }));
  };

  if (isLoading) {
    return (
      <Center className={styles.loadingState} py="xl">
        <Loader size="sm" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center className={styles.errorState} py="xl">
        <Text size="sm" c="dimmed">Error loading chat rooms</Text>
      </Center>
    );
  }

  if (!chatRooms || chatRooms.length === 0) {
    return (
      <Center className={styles.emptyState} py="xl">
        <Text size="sm" c="dimmed">No chat rooms available</Text>
      </Center>
    );
  }

  return (
    <Tabs 
      value={activeTab} 
      onChange={setActiveTab}
      className={styles.tabs}
      variant="default"
    >
      <Tabs.List className={styles.tabsList}>
        <Tabs.Tab 
          value="public" 
          leftSection={<IconUsers size={16} />}
        >
          Chat
          {publicRoom?.message_count > 0 && (
            <Badge size="xs" variant="light" color="violet" ml="xs">
              {publicRoom.message_count}
            </Badge>
          )}
        </Tabs.Tab>
        {backstageRoom && (
          <Tabs.Tab 
            value="backstage" 
            leftSection={<IconUserShield size={16} />}
          >
            Backstage
            {backstageRoom.message_count > 0 && (
              <Badge size="xs" variant="light" color="violet" ml="xs">
                {backstageRoom.message_count}
              </Badge>
            )}
          </Tabs.Tab>
        )}
      </Tabs.List>

      <Tabs.Panel value="public" className={styles.tabPanel}>
        <ChatRoomView
          room={publicRoom}
          sessionData={sessionData}
          inputValue={inputValues[publicRoom?.id] || ''}
          onInputChange={(value) => handleInputChange(publicRoom?.id, value)}
          onSendMessage={() => handleSendMessage(publicRoom?.id)}
          isActive={activeTab === 'public'}
          canModerate={canModerate}
        />
      </Tabs.Panel>

      {backstageRoom && (
        <Tabs.Panel value="backstage" className={styles.tabPanel}>
          <ChatRoomView
            room={backstageRoom}
            sessionData={sessionData}
            inputValue={inputValues[backstageRoom.id] || ''}
            onInputChange={(value) => handleInputChange(backstageRoom.id, value)}
            onSendMessage={() => handleSendMessage(backstageRoom.id)}
            isActive={activeTab === 'backstage'}
            canModerate={canModerate}
          />
        </Tabs.Panel>
      )}
    </Tabs>
  );
}