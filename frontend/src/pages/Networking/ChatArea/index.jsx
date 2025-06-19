import { useState, useEffect } from 'react';
import { Tabs, ScrollArea, TextInput, ActionIcon, Group, Text, Avatar, Stack, Loader, Center } from '@mantine/core';
import { IconSend, IconHash } from '@tabler/icons-react';
import { useGetChatRoomsQuery, useSendMessageMutation } from '@/app/features/chat/api';
import { useSocketMessages } from '@/shared/hooks/useSocketMessages';
import styles from './styles/index.module.css';

export function ChatArea({ eventId }) {
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState({});
  const [inputValues, setInputValues] = useState({});
  
  const { data: chatRooms, isLoading } = useGetChatRoomsQuery(eventId);
  const [sendMessage] = useSendMessageMutation();
  
  // Set up socket message handling
  useSocketMessages((message) => {
    if (message.chatRoomId) {
      setMessages(prev => ({
        ...prev,
        [message.chatRoomId]: [...(prev[message.chatRoomId] || []), message]
      }));
    }
  });

  useEffect(() => {
    if (chatRooms?.length > 0 && !activeRoom) {
      setActiveRoom(chatRooms[0].id);
    }
  }, [chatRooms, activeRoom]);

  const handleSendMessage = async (roomId) => {
    const content = inputValues[roomId]?.trim();
    if (!content) return;

    try {
      await sendMessage({ 
        chatRoomId: roomId, 
        content 
      }).unwrap();
      
      setInputValues(prev => ({ ...prev, [roomId]: '' }));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (isLoading) {
    return (
      <Center className={styles.loader}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!chatRooms?.length) {
    return (
      <Center className={styles.empty}>
        <Text color="dimmed">No chat rooms available for this event</Text>
      </Center>
    );
  }

  return (
    <div className={styles.container}>
      <Tabs 
        value={activeRoom?.toString()} 
        onChange={(value) => setActiveRoom(parseInt(value))}
        className={styles.tabs}
      >
        <Tabs.List className={styles.tabsList}>
          {chatRooms.map(room => (
            <Tabs.Tab 
              key={room.id} 
              value={room.id.toString()}
              leftSection={<IconHash size={16} />}
            >
              {room.name}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {chatRooms.map(room => (
          <Tabs.Panel 
            key={room.id} 
            value={room.id.toString()} 
            className={styles.tabPanel}
          >
            <div className={styles.chatContainer}>
              <ScrollArea className={styles.messagesArea}>
                <Stack gap="sm" p="md">
                  {(messages[room.id] || room.messages || []).map((message, index) => (
                    <MessageBubble key={message.id || index} message={message} />
                  ))}
                </Stack>
              </ScrollArea>

              <div className={styles.inputArea}>
                <TextInput
                  placeholder={`Message #${room.name}`}
                  value={inputValues[room.id] || ''}
                  onChange={(e) => setInputValues(prev => ({ 
                    ...prev, 
                    [room.id]: e.target.value 
                  }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(room.id);
                    }
                  }}
                  rightSection={
                    <ActionIcon 
                      onClick={() => handleSendMessage(room.id)}
                      disabled={!inputValues[room.id]?.trim()}
                    >
                      <IconSend size={18} />
                    </ActionIcon>
                  }
                  className={styles.input}
                />
              </div>
            </div>
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  );
}

function MessageBubble({ message }) {
  const { user, content, createdAt } = message;
  const time = new Date(createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <Group gap="sm" align="flex-start" className={styles.message}>
      <Avatar size="sm" radius="xl">
        {user?.firstName?.[0] || '?'}
      </Avatar>
      <div className={styles.messageContent}>
        <Group gap="xs">
          <Text size="sm" weight={600}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text size="xs" color="dimmed">
            {time}
          </Text>
        </Group>
        <Text size="sm" className={styles.messageText}>
          {content}
        </Text>
      </div>
    </Group>
  );
}