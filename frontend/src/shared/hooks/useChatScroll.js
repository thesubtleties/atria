// src/shared/hooks/useChatScroll.js
import { useRef, useEffect } from 'react';

/**
 * Custom hook for managing chat scroll behavior including:
 * - Auto-scroll to bottom for new messages (only when user is near bottom)
 * - Load more messages when scrolling to top
 * - Position restoration after loading older messages
 * - Debounced scroll handling
 * 
 * @param {Object} params - Hook parameters
 * @param {Array} params.messages - Array of messages
 * @param {boolean} params.isLoading - Whether initial messages are loading
 * @param {boolean} params.isFetching - Whether more messages are being fetched
 * @param {boolean} params.hasMore - Whether there are more messages to load
 * @param {Function} params.loadMoreMessages - Function to load more messages
 * @param {string} params.threadId - Current thread ID (for resetting state)
 * 
 * @returns {Object} Object containing refs for message container and scroll end
 */
export function useChatScroll({ 
  messages, 
  isLoading, 
  isFetching, 
  hasMore, 
  loadMoreMessages, 
  threadId 
}) {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const scrollState = useRef({
    isNearBottom: true,
    scrollBeforeLoad: null,
    hasInitialized: false,
    scrollTimeout: null
  });

  // Auto-scroll to bottom for new messages (only if user is near bottom)
  useEffect(() => {
    if (!isLoading && messages.length > 0 && messagesEndRef.current) {
      // Initial load or user is near bottom
      if (!scrollState.current.hasInitialized || scrollState.current.isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, isLoading]);

  // Set initialized flag after delay when thread changes
  useEffect(() => {
    // Reset initialization flag when thread changes
    scrollState.current.hasInitialized = false;
    
    // Set initialized after a delay to avoid triggering on initial scroll
    const initTimer = setTimeout(() => {
      scrollState.current.hasInitialized = true;
    }, 500);

    return () => clearTimeout(initTimer);
  }, [threadId]);

  // Handle scroll to load more messages with position restoration
  useEffect(() => {
    const handleScroll = () => {
      const container = messagesContainerRef.current;
      if (!container) return;

      // Don't process scroll events until we've initialized
      if (!scrollState.current.hasInitialized) {
        return;
      }

      // Track if user is near bottom
      const threshold = 100;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
      scrollState.current.isNearBottom = isNearBottom;

      // Check if we should load more (25% from top)
      const scrollPercentage = container.scrollTop / container.scrollHeight;
      if (scrollPercentage < 0.25 && hasMore && !isFetching && !scrollState.current.scrollTimeout) {
        // Debounce scroll loading
        scrollState.current.scrollTimeout = setTimeout(() => {
          // Save scroll position before loading
          const firstMessage = container.querySelector('[data-message-id]');
          if (firstMessage) {
            scrollState.current.scrollBeforeLoad = {
              messageId: firstMessage.dataset.messageId,
              offsetTop: firstMessage.offsetTop,
              scrollTop: container.scrollTop
            };
          }
          
          loadMoreMessages();
          scrollState.current.scrollTimeout = null;
        }, 300);
      }
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      if (scrollState.current.scrollTimeout) {
        clearTimeout(scrollState.current.scrollTimeout);
      }
    };
  }, [hasMore, isFetching, loadMoreMessages]);

  // Restore scroll position after loading more messages
  useEffect(() => {
    if (scrollState.current.scrollBeforeLoad && !isFetching) {
      const container = messagesContainerRef.current;
      if (container) {
        const savedState = scrollState.current.scrollBeforeLoad;
        const targetMessage = container.querySelector(`[data-message-id="${savedState.messageId}"]`);
        
        if (targetMessage) {
          const newOffsetTop = targetMessage.offsetTop;
          const scrollAdjustment = newOffsetTop - savedState.offsetTop;
          container.scrollTop = savedState.scrollTop + scrollAdjustment;
        }
        
        scrollState.current.scrollBeforeLoad = null;
      }
    }
  }, [messages, isFetching]);

  return {
    messagesEndRef,
    messagesContainerRef,
  };
}