import { useEffect, useState, useCallback } from 'react';
import { Center, Loader } from '@mantine/core';
import { useSelector } from 'react-redux';
import { useGetChatRoomMessagesQuery, useDeleteMessageMutation } from '@/app/features/chat/api';
import { 
  setActiveChatRoom, 
  registerMessageCallback, 
  unregisterMessageCallback 
} from '@/app/features/networking/socketClient';
import { MessageList } from '../MessageList';
import { MessageInput } from '../MessageInput';
import { DeleteMessageModal } from '../DeleteMessageModal';
import { notifications } from '@mantine/notifications';
import styles from './styles/index.module.css';

export function ChatRoom({ 
  room, 
  eventId, 
  inputValue, 
  onInputChange, 
  onSendMessage,
  isActive,
  canModerate
}) {
  const currentUser = useSelector((state) => state.auth.user);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [loadedMessages, setLoadedMessages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const perPage = 50;
  
  const { data, isLoading, isFetching, refetch } = useGetChatRoomMessagesQuery(
    { chatRoomId: room.id, page: currentPage, per_page: perPage },
    { 
      skip: !room.id,
      refetchOnMountOrArgChange: true
    }
  );
  
  const [deleteMessage, { isLoading: isDeleting }] = useDeleteMessageMutation();

  // Update loaded messages when new data arrives
  useEffect(() => {
    
    // Only process if we have data and not loading
    if (!isLoading && data) {
      if (data.messages && Array.isArray(data.messages)) {
        if (currentPage === 1) {
          // Initial load or room change - replace all messages
          setLoadedMessages(data.messages);
          setHasMore(data.messages.length === perPage);
        } else {
          // Loading older messages - prepend to existing
          
          // Create a Set of existing message IDs to prevent duplicates
          const existingIds = new Set(loadedMessages.map(msg => msg.id));
          
          // Filter out any messages we already have
          const uniqueNewMessages = data.messages.filter(msg => !existingIds.has(msg.id));
          
          // If we got no new unique messages, we've reached the end
          if (uniqueNewMessages.length === 0) {
            setHasMore(false);
            setIsLoadingMore(false);
            return;
          }
          
          setLoadedMessages(prev => {
            // Combine: new messages first (older), then existing messages
            const newMessages = [...uniqueNewMessages, ...prev];
            
            return newMessages;
          });
          
          // Has more if we got a full page of messages (some might be duplicates though)
          setHasMore(data.messages.length === perPage);
          setIsLoadingMore(false);
        }
      } else if (data.messages === undefined || data.messages === null) {
        // Set empty array if no messages
        if (currentPage === 1) {
          setLoadedMessages([]);
          setHasMore(false);
        }
      }
    }
  }, [data, currentPage, perPage, room.id, isLoading]);

  // Reset when room changes - but don't clear messages until new ones arrive
  useEffect(() => {
    // Don't clear messages here - let the data update handle it
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
          // This will now wait for socket connection before joining
          await setActiveChatRoom(room.id);
          
          // Register callback for socket message updates
          registerMessageCallback(room.id, (update) => {
            
            if (update.type === 'new_message') {
              // Add new message to the end of the list
              setLoadedMessages(prev => {
                // Check if message already exists (prevent duplicates)
                if (prev.some(msg => msg.id === update.message.id)) {
                  return prev;
                }
                return [...prev, update.message];
              });
            } else if (update.type === 'message_moderated') {
              // For admins/organizers - mark message as deleted (show red)
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
              // For regular users - completely remove the message
              setLoadedMessages(prev => prev.filter(msg => msg.id !== update.messageId));
            }
          });
          
          // Debug: Check socket status after joining
          const module = await import('@/app/features/networking/socketClient');
          const socket = module.getSocket();
        } catch (error) {
        }
      }
    };
    
    setupRoom();
    
    // Cleanup: leave room and unregister callback when component unmounts or room changes
    return () => {
      isMounted = false;
      if (room?.id) {
        setActiveChatRoom(null);
        unregisterMessageCallback(room.id);
      }
    };
  }, [room?.id]);

  const handleDeleteClick = (message) => {
    setMessageToDelete(message);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!messageToDelete) return;

    try {
      await deleteMessage({
        chatRoomId: room.id,
        messageId: messageToDelete.id
      }).unwrap();

      // Update the local state to mark the message as deleted
      setLoadedMessages(prev => prev.map(msg => 
        msg.id === messageToDelete.id 
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

      setDeleteModalOpen(false);
      setMessageToDelete(null);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete the message. Please try again.',
        color: 'red',
      });
    }
  };

  // Handle scroll events for infinite loading (called from MessageList)
  const handleScroll = () => {
    
    if (isLoadingMore || !hasMore || isFetching) {
      return;
    }
    
    setIsLoadingMore(true);
    setCurrentPage(prev => {
      const newPage = prev + 1;
      return newPage;
    });
  };

  // Note: Scroll position restoration is handled by MessageList component
  // which has access to the actual scroll container

  if (isLoading && currentPage === 1) {
    return (
      <Center className={styles.chatContainer}>
        <Loader size="sm" />
      </Center>
    );
  }

  return (
    <>
      <div className={styles.chatContainer}>
        <MessageList 
          room={room}
          messages={loadedMessages}
          isActive={isActive}
          canModerate={canModerate}
          onDeleteMessage={handleDeleteClick}
          onScrollTop={handleScroll}
          isLoadingMore={isLoadingMore}
        />
        
        <MessageInput 
          roomName={room.name}
          value={inputValue}
          onChange={onInputChange}
          onSend={onSendMessage}
        />
      </div>

      <DeleteMessageModal
        opened={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setMessageToDelete(null);
        }}
        message={messageToDelete}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </>
  );
}