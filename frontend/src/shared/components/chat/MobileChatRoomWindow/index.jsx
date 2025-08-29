import { useState, useEffect, useCallback, useRef } from 'react';
import { ActionIcon, Text, Badge, Group, ScrollArea, Center } from '@mantine/core';
import { IconX, IconLock, IconGlobe, IconMicrophone, IconMessage } from '@tabler/icons-react';
import { LoadingSpinner } from '../../loading';
import { useSelector } from 'react-redux';
import { 
  useGetChatRoomMessagesQuery, 
  useSendMessageMutation, 
  useDeleteMessageMutation 
} from '@/app/features/chat/api';
import { 
  setActiveChatRoom, 
  registerMessageCallback, 
  unregisterMessageCallback 
} from '@/app/features/networking/socketClient';
import { notifications } from '@mantine/notifications';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import styles from './styles/index.module.css';

/**
 * Full-screen chat room window for mobile devices
 * Displays chat room messages and allows sending new messages
 */
function MobileChatRoomWindow({ room, eventData, onClose }) {
  const currentUser = useSelector((state) => state.auth.user);
  const [inputValue, setInputValue] = useState('');
  const [loadedMessages, setLoadedMessages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollAreaRef = useRef();
  const perPage = 50;
  
  // Prevent background scrolling when chat room is open
  useEffect(() => {
    // Save current scroll position
    const scrollY = window.scrollY;
    
    // Prevent scrolling on the body
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Restore body scroll
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      
      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Determine if current user can moderate messages
  const canModerate = eventData?.user_role === 'ADMIN' || eventData?.user_role === 'ORGANIZER';
  
  // Check if current user can send messages
  const canSendMessages = eventData && !eventData.is_banned && !eventData.is_chat_banned;

  const { data, isLoading, isFetching } = useGetChatRoomMessagesQuery(
    { chatRoomId: room.id, page: currentPage, per_page: perPage },
    { 
      skip: !room.id,
      refetchOnMountOrArgChange: true
    }
  );

  const [sendMessage] = useSendMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();

  // Update loaded messages when new data arrives
  useEffect(() => {
    if (!isLoading && data) {
      if (data.messages && Array.isArray(data.messages)) {
        if (currentPage === 1) {
          setLoadedMessages(data.messages);
          setHasMore(data.messages.length === perPage);
        } else {
          const existingIds = new Set(loadedMessages.map(msg => msg.id));
          const uniqueNewMessages = data.messages.filter(msg => !existingIds.has(msg.id));
          
          if (uniqueNewMessages.length === 0) {
            setHasMore(false);
            setIsLoadingMore(false);
            return;
          }
          
          setLoadedMessages(prev => [...uniqueNewMessages, ...prev]);
          setHasMore(data.messages.length === perPage);
          setIsLoadingMore(false);
        }
      } else if (currentPage === 1) {
        setLoadedMessages([]);
        setHasMore(false);
      }
    }
  }, [data, currentPage, perPage, room.id, isLoading]);

  // Reset when room changes
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    setIsLoadingMore(false);
  }, [room.id]);

  // Set up socket subscription for this room
  useEffect(() => {
    let isMounted = true;
    
    const setupRoom = async () => {
      if (room?.id && isMounted) {
        try {
          await setActiveChatRoom(room.id);
          
          registerMessageCallback(room.id, (update) => {
            if (update.type === 'new_message') {
              setLoadedMessages(prev => {
                if (prev.some(msg => msg.id === update.message.id)) {
                  return prev;
                }
                return [...prev, update.message];
              });
            } else if (update.type === 'message_moderated') {
              setLoadedMessages(prev => prev.map(msg => 
                msg.id === update.messageId 
                  ? { 
                      ...msg, 
                      is_deleted: true,
                      deleted_at: update.deleted_at,
                      deleted_by: update.deleted_by
                    }
                  : msg
              ));
            } else if (update.type === 'message_removed') {
              setLoadedMessages(prev => prev.filter(msg => msg.id !== update.messageId));
            }
          });
        } catch (error) {
          console.error('Failed to join room:', error);
        }
      }
    };
    
    setupRoom();
    
    return () => {
      isMounted = false;
      if (room?.id) {
        setActiveChatRoom(null);
        unregisterMessageCallback(room.id);
      }
    };
  }, [room?.id]);

  const handleSendMessage = async () => {
    const content = inputValue.trim();
    if (!content || !canSendMessages) return;

    try {
      await sendMessage({ 
        chatRoomId: room.id, 
        content 
      }).unwrap();
      
      setInputValue('');
      
      // Scroll to bottom after sending
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to send message',
        color: 'red',
      });
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage({
        chatRoomId: room.id,
        messageId: messageId
      }).unwrap();

      setLoadedMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              is_deleted: true,
              deleted_at: new Date().toISOString(),
              deleted_by: currentUser ? { 
                id: currentUser.id,
                full_name: currentUser.full_name || `${currentUser.first_name} ${currentUser.last_name}`.trim()
              } : { full_name: 'Moderator' }
            }
          : msg
      ));

      notifications.show({
        title: 'Message deleted',
        message: 'The message has been removed from the chat.',
        color: 'red',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete the message',
        color: 'red',
      });
    }
  };

  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore || isFetching) return;
    
    setIsLoadingMore(true);
    setCurrentPage(prev => prev + 1);
  };

  // Get room icon
  const getRoomIcon = () => {
    switch (room.room_type) {
      case 'GLOBAL':
        return <IconGlobe size={18} />;
      case 'ADMIN':
        return <IconLock size={18} />;
      case 'GREEN_ROOM':
        return <IconMicrophone size={18} />;
      default:
        return <IconMessage size={18} />;
    }
  };

  // Get room type badge
  const getRoomTypeBadge = () => {
    switch (room.room_type) {
      case 'ADMIN':
        return <Badge size="xs" color="red" variant="light">Admin</Badge>;
      case 'GREEN_ROOM':
        return <Badge size="xs" color="green" variant="light">Speakers</Badge>;
      case 'SESSION':
        if (room.subtype === 'BACKSTAGE') {
          return <Badge size="xs" color="violet" variant="light">Backstage</Badge>;
        }
        return <Badge size="xs" color="blue" variant="light">Public</Badge>;
      default:
        return null;
    }
  };

  if (isLoading && currentPage === 1) {
    return (
      <div className={styles.chatWindow}>
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <Text size="sm" fw={600}>{room.name}</Text>
          </div>
          <ActionIcon 
            variant="subtle" 
            onClick={onClose}
            className={styles.closeButton}
            color="gray"
            size="lg"
          >
            <IconX size={20} />
          </ActionIcon>
        </div>
        <Center className={styles.loadingContainer}>
          <LoadingSpinner size="sm" />
        </Center>
      </div>
    );
  }

  return (
    <div className={styles.chatWindow}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <Group gap="xs">
            {getRoomIcon()}
            <Text size="sm" fw={600} className={styles.roomName}>
              {room.name}
            </Text>
            {getRoomTypeBadge()}
          </Group>
          {room.description && (
            <Text size="xs" c="dimmed" lineClamp={1}>
              {room.description}
            </Text>
          )}
        </div>
        
        <ActionIcon 
          variant="subtle" 
          onClick={onClose}
          className={styles.closeButton}
          color="gray"
          size="lg"
        >
          <IconX size={20} />
        </ActionIcon>
      </div>

      {/* Messages */}
      <MessageList 
        messages={loadedMessages}
        canModerate={canModerate}
        onDeleteMessage={handleDeleteMessage}
        onLoadMore={handleLoadMore}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        scrollAreaRef={scrollAreaRef}
      />

      {/* Input */}
      <MessageInput 
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        canSendMessages={canSendMessages}
        placeholder={`Message ${room.name}...`}
      />
    </div>
  );
}

export default MobileChatRoomWindow;