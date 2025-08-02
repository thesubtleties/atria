import { useEffect, useState } from 'react';
import { Center, Loader } from '@mantine/core';
import { useGetChatRoomMessagesQuery, useDeleteMessageMutation } from '@/app/features/chat/api';
import { setActiveChatRoom } from '@/app/features/networking/socketClient';
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
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const { data, isLoading } = useGetChatRoomMessagesQuery(
    { chatRoomId: room.id, limit: 100, offset: 0 },
    { skip: !room.id }
  );
  
  const [deleteMessage, { isLoading: isDeleting }] = useDeleteMessageMutation();

  // Get messages from API
  const messages = data?.messages || [];

  // Set up socket subscription for this room
  useEffect(() => {
    let isMounted = true;
    
    const setupRoom = async () => {
      if (room?.id && isMounted) {
        console.log('🟡 ChatRoom: Setting up active chat room:', room.id);
        
        try {
          // This will now wait for socket connection before joining
          await setActiveChatRoom(room.id);
          console.log('🟡 ChatRoom: Successfully joined room:', room.id);
          
          // Debug: Check socket status after joining
          const module = await import('@/app/features/networking/socketClient');
          const socket = module.getSocket();
          console.log('🟡 ChatRoom: Socket status after join:', {
            exists: !!socket,
            connected: socket?.connected,
            id: socket?.id
          });
        } catch (error) {
          console.error('🟡 ChatRoom: Failed to join room:', error);
        }
      }
    };
    
    setupRoom();
    
    // Cleanup: leave room when component unmounts or room changes
    return () => {
      isMounted = false;
      if (room?.id) {
        console.log('🟡 ChatRoom: Clearing active chat room:', room.id);
        setActiveChatRoom(null);
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

  if (isLoading) {
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
          messages={messages}
          isActive={isActive}
          canModerate={canModerate}
          onDeleteMessage={handleDeleteClick}
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