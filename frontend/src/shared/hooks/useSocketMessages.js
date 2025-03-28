// src/shared/hooks/useSocketMessages.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetDirectMessagesQuery,
  useSendDirectMessageMutation,
  useMarkMessagesReadMutation,
} from '../../app/features/networking/api';

export function useSocketMessages(threadId) {
  const [messageInput, setMessageInput] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { currentUser } = useSelector((state) => state.auth);
  const loadingMoreRef = useRef(false);

  // Get messages with RTK Query
  const {
    data = { messages: [], pagination: null },
    isLoading,
    error,
    isFetching,
  } = useGetDirectMessagesQuery(
    { threadId, page },
    {
      skip: !threadId,
    }
  );

  // Mutations
  const [sendMessageMutation] = useSendDirectMessageMutation();
  const [markAsRead] = useMarkMessagesReadMutation();

  // Update hasMore based on pagination
  useEffect(() => {
    if (data?.pagination) {
      setHasMore(data.pagination.has_next);
    } else {
      setHasMore(false);
    }
    loadingMoreRef.current = false;
  }, [data]);

  // Mark messages as read when thread is opened
  useEffect(() => {
    if (threadId && !isLoading && data?.messages?.length > 0) {
      markAsRead(threadId);
    }
  }, [threadId, isLoading, data?.messages, markAsRead]);

  // Load more messages
  const loadMoreMessages = useCallback(() => {
    if (hasMore && !isFetching && !loadingMoreRef.current) {
      loadingMoreRef.current = true;
      setPage((prevPage) => prevPage + 1);
    }
  }, [hasMore, isFetching]);

  // Send message function
  const sendMessage = useCallback(
    async (content) => {
      if (!threadId || !content.trim()) return;

      try {
        // Add optimistic update
        const optimisticMessage = {
          id: `temp-${Date.now()}`,
          thread_id: threadId,
          sender_id: currentUser?.id,
          content,
          created_at: new Date().toISOString(),
          is_sender: true,
          status: 'SENT',
          pending: true,
        };

        setMessageInput('');

        await sendMessageMutation({
          threadId,
          content,
        }).unwrap();
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    [threadId, currentUser, sendMessageMutation]
  );

  return {
    messages: data?.messages || [],
    otherUser: data?.other_user,
    isEncrypted: data?.is_encrypted,
    isLoading,
    isFetching,
    error,
    messageInput,
    setMessageInput,
    sendMessage,
    hasMore,
    loadMoreMessages,
  };
}
