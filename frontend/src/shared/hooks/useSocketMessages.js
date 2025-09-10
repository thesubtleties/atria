// src/shared/hooks/useSocketMessages.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetDirectMessagesQuery,
  useSendDirectMessageMutation,
  useMarkMessagesReadMutation,
} from '../../app/features/networking/api';
import { 
  registerDirectMessageCallback, 
  unregisterDirectMessageCallback 
} from '../../app/features/networking/socketClient';

export function useSocketMessages(threadId) {
  const [messageInput, setMessageInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadedMessages, setLoadedMessages] = useState([]);
  const { currentUser } = useSelector((state) => state.auth);
  const previousThreadIdRef = useRef(null);

  // Get messages with RTK Query (but we'll manage accumulation locally)
  const {
    data = { messages: [], pagination: null },
    isLoading,
    error,
    isFetching,
  } = useGetDirectMessagesQuery(
    { threadId, page: currentPage },
    {
      skip: !threadId,
      // Don't keep in cache since we manage locally
      keepUnusedDataFor: 0,
    }
  );

  // Mutations
  const [sendMessageMutation] = useSendDirectMessageMutation();
  const [markAsRead] = useMarkMessagesReadMutation();

  // Reset state when thread changes
  useEffect(() => {
    if (threadId !== previousThreadIdRef.current) {
      setLoadedMessages([]);
      setCurrentPage(1);
      setHasMore(true);
      previousThreadIdRef.current = threadId;
    }
  }, [threadId]);

  // Accumulate messages when data changes
  useEffect(() => {
    if (data?.messages && data.messages.length > 0) {
      setLoadedMessages(prev => {
        // For page 1, replace all messages
        // Messages come newest-first from backend, keep that order
        if (currentPage === 1) {
          return data.messages;
        }
        
        // For other pages, these are older messages
        // They come newest-first, but they're OLDER than what we have
        // So they should go at the BEGINNING (top)
        const existingIds = new Set(prev.map(msg => msg.id));
        const uniqueNewMessages = data.messages.filter(
          msg => !existingIds.has(msg.id)
        );
        
        // Prepend older messages at the beginning (they're older)
        return [...uniqueNewMessages, ...prev];
      });

      // Update hasMore based on pagination
      if (data.pagination) {
        const hasMorePages = currentPage < data.pagination.total_pages;
        setHasMore(hasMorePages);
      } else {
        setHasMore(false);
      }
    }
  }, [data, currentPage]);

  // Register socket callbacks for real-time updates
  useEffect(() => {
    if (!threadId) return;

    const handleSocketUpdate = (update) => {
      if (update.type === 'new_message') {
        setLoadedMessages(prev => {
          // Check if message already exists with real ID (prevent duplicates)
          if (prev.some(msg => msg.id === update.message.id)) {
            console.log('Message already exists, skipping:', update.message.id);
            return prev;
          }
          
          // Check if this is our own message replacing a temp message
          if (update.message.sender_id === currentUser?.id) {
            // Find temp message with same content sent in last 5 seconds
            const tempIndex = prev.findIndex(msg => 
              msg.id.startsWith('temp-') &&
              msg.content === update.message.content &&
              msg.sender_id === currentUser?.id
            );
            
            if (tempIndex !== -1) {
              console.log('Replacing temp message with real one');
              const newMessages = [...prev];
              newMessages[tempIndex] = update.message;
              return newMessages;
            }
          }
          
          // Otherwise add the new message
          return [...prev, update.message];
        });
      }
    };

    registerDirectMessageCallback(threadId, handleSocketUpdate);
    
    return () => {
      unregisterDirectMessageCallback(threadId);
    };
  }, [threadId]);

  // Mark messages as read when thread is opened
  useEffect(() => {
    if (threadId && !isLoading && loadedMessages.length > 0) {
      markAsRead(threadId);
    }
  }, [threadId, isLoading, loadedMessages.length, markAsRead]);

  // Load more messages
  const loadMoreMessages = useCallback(() => {
    if (hasMore && !isFetching) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  }, [hasMore, isFetching]);

  // Send message function
  const sendMessage = useCallback(
    async (content) => {
      if (!threadId || !content.trim()) return;

      try {
        // Create optimistic message
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

        // Add optimistically
        setLoadedMessages(prev => [...prev, optimisticMessage]);
        setMessageInput('');

        // Send to server
        const result = await sendMessageMutation({
          threadId,
          content,
        }).unwrap();

        // Replace optimistic message with real one
        setLoadedMessages(prev => 
          prev.map(msg => 
            msg.id === optimisticMessage.id ? result : msg
          )
        );
      } catch (error) {
        console.error('Failed to send message:', error);
        // Remove optimistic message on error
        setLoadedMessages(prev => 
          prev.filter(msg => !msg.id.startsWith('temp-'))
        );
      }
    },
    [threadId, currentUser, sendMessageMutation]
  );

  return {
    messages: loadedMessages,
    otherUser: data?.other_user,
    isEncrypted: data?.is_encrypted,
    isLoading: isLoading && currentPage === 1,
    isFetching,
    error,
    messageInput,
    setMessageInput,
    sendMessage,
    hasMore,
    loadMoreMessages,
  };
}