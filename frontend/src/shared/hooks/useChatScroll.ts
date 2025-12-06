import { useRef, useEffect, type RefObject } from 'react';

/** Parameters for useChatScroll hook */
interface UseChatScrollParams {
  /** Array of messages */
  messages: unknown[];
  /** Whether initial messages are loading */
  isLoading: boolean;
  /** Whether more messages are being fetched */
  isFetching: boolean;
  /** Whether there are more messages to load */
  hasMore: boolean;
  /** Function to load more messages */
  loadMoreMessages: () => void;
  /** Current thread ID (for resetting state) */
  threadId: string | number | null | undefined;
}

/** Return type for useChatScroll hook */
interface UseChatScrollReturn {
  /** Ref for the scroll-to-end element */
  messagesEndRef: RefObject<HTMLDivElement | null>;
  /** Ref for the messages container */
  messagesContainerRef: RefObject<HTMLDivElement | null>;
}

/** Internal scroll state */
interface ScrollState {
  isNearBottom: boolean;
  scrollBeforeLoad: {
    messageId: string;
    offsetTop: number;
    scrollTop: number;
  } | null;
  hasInitialized: boolean;
  scrollTimeout: ReturnType<typeof setTimeout> | null;
}

/**
 * Custom hook for managing chat scroll behavior including:
 * - Auto-scroll to bottom for new messages (only when user is near bottom)
 * - Load more messages when scrolling to top
 * - Position restoration after loading older messages
 * - Debounced scroll handling
 */
export function useChatScroll({
  messages,
  isLoading,
  isFetching,
  hasMore,
  loadMoreMessages,
  threadId,
}: UseChatScrollParams): UseChatScrollReturn {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollState = useRef<ScrollState>({
    isNearBottom: true,
    scrollBeforeLoad: null,
    hasInitialized: false,
    scrollTimeout: null,
  });

  // Auto-scroll to bottom for new messages (only if user is near bottom)
  useEffect(() => {
    if (!isLoading && messages.length > 0 && messagesEndRef.current) {
      // Initial load or user is near bottom
      if (
        !scrollState.current.hasInitialized ||
        scrollState.current.isNearBottom
      ) {
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
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        threshold;
      scrollState.current.isNearBottom = isNearBottom;

      // Check if we should load more (25% from top)
      const scrollPercentage = container.scrollTop / container.scrollHeight;
      if (
        scrollPercentage < 0.25 &&
        hasMore &&
        !isFetching &&
        !scrollState.current.scrollTimeout
      ) {
        // Debounce scroll loading
        scrollState.current.scrollTimeout = setTimeout(() => {
          // Save scroll position before loading
          const firstMessage = container.querySelector(
            '[data-message-id]'
          ) as HTMLElement | null;
          if (firstMessage?.dataset.messageId) {
            scrollState.current.scrollBeforeLoad = {
              messageId: firstMessage.dataset.messageId,
              offsetTop: firstMessage.offsetTop,
              scrollTop: container.scrollTop,
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

    // Capture ref value for cleanup
    const currentScrollState = scrollState.current;

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      if (currentScrollState?.scrollTimeout) {
        clearTimeout(currentScrollState.scrollTimeout);
      }
    };
  }, [hasMore, isFetching, loadMoreMessages]);

  // Restore scroll position after loading more messages
  useEffect(() => {
    if (scrollState.current.scrollBeforeLoad && !isFetching) {
      const container = messagesContainerRef.current;
      if (container) {
        const savedState = scrollState.current.scrollBeforeLoad;
        const targetMessage = container.querySelector(
          `[data-message-id="${savedState.messageId}"]`
        ) as HTMLElement | null;

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

