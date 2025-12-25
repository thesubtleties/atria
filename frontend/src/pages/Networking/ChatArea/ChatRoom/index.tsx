import { useEffect, useState, useRef } from 'react';
import { Center } from '@mantine/core';
import { LoadingSpinner } from '@/shared/components/loading';
import { useSelector } from 'react-redux';
import { useGetChatRoomMessagesQuery, useDeleteMessageMutation } from '@/app/features/chat/api';
import {
  setActiveChatRoom,
  registerMessageCallback,
  unregisterMessageCallback,
} from '@/app/features/networking/socketClient';
import type { ChatMessageCallback } from '@/app/features/networking/socketTypes';
import { MessageList } from '../MessageList';
import { MessageInput } from '../MessageInput';
import { DeleteMessageModal } from '../DeleteMessageModal';
import { notifications } from '@mantine/notifications';
import styles from './styles/index.module.css';
import type { ChatRoom as ChatRoomType, ChatMessage } from '@/types/chat';
import type { RootState } from '@/app/store';

// API response type for chat room messages
// The backend returns { messages: [...], total, page, per_page, pages }
interface ChatRoomMessagesResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// Component props interface
interface ChatRoomProps {
  room: ChatRoomType;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  isActive: boolean;
  canModerate: boolean;
  canSendMessages?: boolean;
  socketManagedByParent?: boolean;
}

export function ChatRoom({
  room,
  inputValue,
  onInputChange,
  onSendMessage,
  isActive,
  canModerate,
  canSendMessages = true,
  socketManagedByParent = false,
}: ChatRoomProps) {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [loadedMessages, setLoadedMessages] = useState<ChatMessage[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const perPage = 50;

  // Track last synced room/page to avoid overwriting local state on RTK cache updates
  const lastSyncedRef = useRef<{ roomId: number; page: number } | null>(null);

  // Cast the response to our expected type since the API returns { messages: [...] }
  // instead of the generic PaginatedResponse { items: [...] }
  const { data, isLoading, isFetching } = useGetChatRoomMessagesQuery(
    { chatRoomId: room.id, page: currentPage, per_page: perPage },
    {
      skip: !room.id,
      refetchOnMountOrArgChange: true,
    },
  ) as {
    data: ChatRoomMessagesResponse | undefined;
    isLoading: boolean;
    isFetching: boolean;
  };

  const [deleteMessage, { isLoading: isDeleting }] = useDeleteMessageMutation();

  // Update loaded messages when new data arrives
  // IMPORTANT: Only sync from RTK Query when room or page ACTUALLY changes
  // Don't sync when RTK cache is updated by socket handlers - that would overwrite local state
  useEffect(() => {
    // Only process if we have data and not loading
    if (!isLoading && data) {
      const lastSync = lastSyncedRef.current;
      const isNewRoomOrPage =
        !lastSync || lastSync.roomId !== room.id || lastSync.page !== currentPage;

      // Skip if we already synced this room/page combo (RTK cache update from socket)
      if (!isNewRoomOrPage && currentPage === 1) {
        return;
      }

      if (data.messages && Array.isArray(data.messages)) {
        if (currentPage === 1) {
          // Initial load or room change - replace all messages
          setLoadedMessages(data.messages);
          setHasMore(data.messages.length === perPage);
          // Mark as synced
          lastSyncedRef.current = { roomId: room.id, page: currentPage };
        } else {
          // Loading older messages - prepend to existing
          // Use functional update to access prev state without adding to deps
          setLoadedMessages((prev) => {
            // Create a Set of existing message IDs to prevent duplicates
            const existingIds = new Set(prev.map((msg) => msg.id));

            // Filter out any messages we already have
            const uniqueNewMessages = data.messages.filter(
              (msg: ChatMessage) => !existingIds.has(msg.id),
            );

            // If we got no new unique messages, we've reached the end
            if (uniqueNewMessages.length === 0) {
              return prev; // Return unchanged to prevent unnecessary re-render
            }

            // Combine: new messages first (older), then existing messages
            return [...uniqueNewMessages, ...prev];
          });

          // Check if we got a full page (might still have more)
          // Note: Can't check uniqueNewMessages.length here since it's inside the setter
          // so we just check if we got a full page from the API
          setHasMore(data.messages.length === perPage);
          setIsLoadingMore(false);
          // Mark as synced
          lastSyncedRef.current = { roomId: room.id, page: currentPage };
        }
      } else if (data.messages === undefined || data.messages === null) {
        // Set empty array if no messages
        if (currentPage === 1) {
          setLoadedMessages([]);
          setHasMore(false);
          lastSyncedRef.current = { roomId: room.id, page: currentPage };
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
    // Reset sync tracking so new room will sync from RTK Query
    lastSyncedRef.current = null;
  }, [room.id]);

  // Set up socket subscription for this room
  useEffect(() => {
    let isMounted = true;

    if (socketManagedByParent) {
      // Parent manages room joins/leaves, we just handle message updates
      console.log(`🚫 ChatRoom: Socket managed by parent for room ${room.id}`);

      // Register for message updates (parent already joined the room)
      const handleUpdate: ChatMessageCallback = (update) => {
        if (!isMounted) return;

        if (update.type === 'new_message' && update.message) {
          setLoadedMessages((prev) => {
            if (prev.some((msg) => msg.id === update.message!.id)) {
              return prev;
            }
            return [...prev, update.message!];
          });
        } else if (update.type === 'message_moderated' && update.messageId) {
          setLoadedMessages((prev) =>
            prev.map((msg) =>
              msg.id === update.messageId ?
                {
                  ...msg,
                  is_deleted: true,
                  deleted_at: update.deleted_at || new Date().toISOString(),
                  deleted_by: update.deleted_by || null,
                }
              : msg,
            ),
          );
        } else if (update.type === 'message_removed' && update.messageId) {
          // For regular users: remove message entirely
          // For admins who just deleted: message is already marked is_deleted locally, keep it
          setLoadedMessages((prev) => {
            const message = prev.find((msg) => msg.id === update.messageId);
            // If message is already marked deleted (admin just deleted it), keep showing it
            if (message?.is_deleted) {
              return prev;
            }
            // Otherwise (regular user), remove it from view
            return prev.filter((msg) => msg.id !== update.messageId);
          });
        }
      };

      registerMessageCallback(room.id, handleUpdate);

      // Cleanup: only unregister callback (parent handles room leave)
      return () => {
        isMounted = false;
        unregisterMessageCallback(room.id);
      };
    } else {
      // Original self-managed socket logic
      const setupRoom = async (): Promise<void> => {
        if (room?.id && isMounted) {
          try {
            // This will now wait for socket connection before joining
            await setActiveChatRoom(room.id);

            // Register callback for socket message updates
            const handleUpdate: ChatMessageCallback = (update) => {
              if (update.type === 'new_message' && update.message) {
                setLoadedMessages((prev) => {
                  if (prev.some((msg) => msg.id === update.message!.id)) {
                    return prev;
                  }
                  return [...prev, update.message!];
                });
              } else if (update.type === 'message_moderated' && update.messageId) {
                setLoadedMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === update.messageId ?
                      {
                        ...msg,
                        is_deleted: true,
                        deleted_at: update.deleted_at ?? new Date().toISOString(),
                        deleted_by: update.deleted_by,
                      }
                    : msg,
                  ),
                );
              } else if (update.type === 'message_removed' && update.messageId) {
                // For regular users: remove message entirely
                // For admins who just deleted: message is already marked is_deleted locally, keep it
                setLoadedMessages((prev) => {
                  const message = prev.find((msg) => msg.id === update.messageId);
                  // If message is already marked deleted (admin just deleted it), keep showing it
                  if (message?.is_deleted) {
                    return prev;
                  }
                  // Otherwise (regular user), remove it from view
                  return prev.filter((msg) => msg.id !== update.messageId);
                });
              }
            };
            registerMessageCallback(room.id, handleUpdate);
          } catch (error) {
            console.error('Failed to set up chat room:', error);
          }
        }
      };

      setupRoom();

      // Cleanup: leave room and unregister callback
      return () => {
        isMounted = false;
        if (room?.id) {
          const cleanup = async (): Promise<void> => {
            try {
              await setActiveChatRoom(null);
              console.log(`✅ Cleanup: Left room ${room.id}`);
            } catch (error) {
              console.error(`❌ Cleanup: Error leaving room ${room.id}:`, error);
            } finally {
              unregisterMessageCallback(room.id);
            }
          };
          cleanup();
        }
      };
    }
  }, [room?.id, socketManagedByParent]);

  const handleDeleteClick = (message: ChatMessage): void => {
    setMessageToDelete(message);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!messageToDelete) return;

    // Optimistically mark as deleted BEFORE the HTTP request
    // This ensures the socket event (which arrives before HTTP response) sees it as deleted
    const deletedBy =
      currentUser ?
        {
          id: currentUser.id,
          full_name:
            currentUser.full_name || `${currentUser.first_name} ${currentUser.last_name}`.trim(),
        }
      : { id: 0, full_name: 'Moderator' };

    setLoadedMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageToDelete.id ?
          {
            ...msg,
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: deletedBy,
          }
        : msg,
      ),
    );

    try {
      await deleteMessage({
        chatRoomId: room.id,
        messageId: messageToDelete.id,
      }).unwrap();

      notifications.show({
        title: 'Message deleted',
        message: 'The message has been removed from the chat.',
        color: 'red',
      });

      setDeleteModalOpen(false);
      setMessageToDelete(null);
    } catch {
      // Revert the optimistic update on failure
      setLoadedMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageToDelete.id ?
            {
              ...msg,
              is_deleted: false,
              deleted_at: null,
              deleted_by: null,
            }
          : msg,
        ),
      );

      notifications.show({
        title: 'Error',
        message: 'Failed to delete the message. Please try again.',
        color: 'red',
      });
    }
  };

  // Handle scroll events for infinite loading (called from MessageList)
  const handleScroll = (): void => {
    if (isLoadingMore || !hasMore || isFetching) {
      return;
    }

    setIsLoadingMore(true);
    setCurrentPage((prev) => {
      const newPage = prev + 1;
      return newPage;
    });
  };

  // Note: Scroll position restoration is handled by MessageList component
  // which has access to the actual scroll container

  if (isLoading && currentPage === 1) {
    return (
      <Center className={styles.chatContainer ?? ''}>
        <LoadingSpinner size='sm' />
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
          canSendMessages={canSendMessages}
          muteReason={canSendMessages ? null : 'You are muted from chat'}
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
