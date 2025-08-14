import { useRef, useEffect } from 'react';
import { Text, Center, Loader } from '@mantine/core';
import { MessageBubble } from '../MessageBubble';
import styles from './styles/index.module.css';

export function MessageList({ 
  room, 
  messages, 
  isActive, 
  canModerate, 
  onDeleteMessage,
  onScrollTop,
  isLoadingMore
}) {
  const scrollAreaRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Combine all scroll state into a single ref object
  const scrollState = useRef({
    isNearBottom: true,
    previousMessagesLength: 0,
    scrollTimeout: null,
    hasInitialized: false,
    lastScrollTop: 0,
    scrollBeforeLoad: null
  });

  // Scroll to bottom helper function
  const scrollToBottom = () => {
    // Try using scrollIntoView first
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      return;
    }
    
    // Fallback to manual scroll
    if (!scrollAreaRef.current) return;
    
    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
  };

  // Track if user is near bottom of scroll area and check for top scroll
  const handleScroll = () => {
    // Don't process scroll events until we've initialized
    if (!scrollState.current.hasInitialized) {
      return;
    }
    
    if (!scrollAreaRef.current) {
      return;
    }
    
    // Clear existing timeout
    if (scrollState.current.scrollTimeout) {
      clearTimeout(scrollState.current.scrollTimeout);
    }
    
    // Now using the div directly as the scroll container
    const scrollElement = scrollAreaRef.current;
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Check if scrolling up (scroll position decreased)
    const isScrollingUp = scrollTop < scrollState.current.lastScrollTop;
    scrollState.current.lastScrollTop = scrollTop;
    
    // Calculate percentage from top of total scrollable area
    const percentFromTop = (scrollTop / (scrollHeight - clientHeight)) * 100;
    const triggerThreshold = (scrollHeight - clientHeight) * 0.25; // 25% from top of scrollable area
    
    
    // Consider "near bottom" if within 100px of the bottom
    scrollState.current.isNearBottom = distanceFromBottom < 100;
    
    // Debounce the load more check
    scrollState.current.scrollTimeout = setTimeout(() => {
      // Calculate trigger threshold - load when 25% from top of total scrollable area
      const triggerThreshold = (scrollHeight - clientHeight) * 0.25;
      
      // Check if scrolled near top for infinite loading
      // Only trigger if near top AND scrolling up (to avoid triggering on initial load)
      if (scrollTop < triggerThreshold && isScrollingUp && onScrollTop && !isLoadingMore) {
        const actualPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
        
        onScrollTop();
      }
    }, 300); // 300ms debounce
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollState.current.scrollTimeout) {
        clearTimeout(scrollState.current.scrollTimeout);
      }
    };
  }, []);
  
  // Auto-scroll on initial load and room change
  useEffect(() => {
    // Reset initialization flag when room changes
    scrollState.current.hasInitialized = false;
    scrollToBottom();
    
    // Set initialized after a delay to avoid triggering on initial scroll
    setTimeout(() => {
      scrollState.current.hasInitialized = true;
      // Set initial scroll position to prevent false "scrolling up" detection
      if (scrollAreaRef.current) {
        scrollState.current.lastScrollTop = scrollAreaRef.current.scrollTop;
      }
    }, 500);
  }, [room.id]);

  // Auto-scroll when tab becomes active
  useEffect(() => {
    if (isActive) {
      setTimeout(scrollToBottom, 50);
    }
  }, [isActive]);

  // Capture scroll position BEFORE messages update (when loading starts)
  useEffect(() => {
    if (isLoadingMore && scrollAreaRef.current) {
      const container = scrollAreaRef.current;
      // Also save the distance from bottom for debugging
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      scrollState.current.scrollBeforeLoad = {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
        clientHeight: container.clientHeight,
        distanceFromBottom
      };
    }
  }, [isLoadingMore]);

  // Auto-scroll when new messages arrive (if near bottom)
  useEffect(() => {
    const scrollElement = scrollAreaRef.current;
    if (!scrollElement) return;
    
    
    // Check if new messages were added
    if (messages.length > scrollState.current.previousMessagesLength) {
      // For new messages at bottom, auto-scroll if near bottom
      if (!isLoadingMore && scrollState.current.isNearBottom) {
        setTimeout(scrollToBottom, 50);
      }
      // For older messages at top, restore scroll position
      else if (scrollState.current.scrollBeforeLoad) {
        
        // Simple restoration after DOM updates
        setTimeout(() => {
          if (!scrollState.current.scrollBeforeLoad) {
            return;
          }
          
          const saved = scrollState.current.scrollBeforeLoad;
          const newScrollHeight = scrollElement.scrollHeight;
          const heightDifference = newScrollHeight - saved.scrollHeight;
          
          // Calculate the new scroll position
          const newScrollTop = saved.scrollTop + heightDifference;
          
          
          // Use requestAnimationFrame for smoother update
          requestAnimationFrame(() => {
            scrollElement.scrollTop = newScrollTop;
            
            // Verify position was set correctly
            requestAnimationFrame(() => {
              const finalScrollTop = scrollElement.scrollTop;
              
              // Clear the saved position
              scrollState.current.scrollBeforeLoad = null;
              
              // Update the last scroll position to prevent false triggers
              scrollState.current.lastScrollTop = finalScrollTop;
            });
          });
        }, 0);
      }
    }
    
    // Update the previous length
    scrollState.current.previousMessagesLength = messages.length;
  }, [messages]);

  return (
    <div 
      ref={scrollAreaRef}
      className={styles.messageListWrapper}
      onScroll={() => {
        handleScroll();
      }}
      style={{ 
        height: '100%', 
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        scrollBehavior: 'auto' // Use 'auto' for instant positioning during restoration
      }}
    >
      <div style={{ 
        minHeight: '100%',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {/* Loading indicator at the top when fetching older messages */}
        {isLoadingMore && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem' }}>
            <Loader size="xs" color="gray" />
          </div>
        )}
        
        {room.description && (
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <Text size="sm" c="dimmed">
              {room.description}
            </Text>
          </div>
        )}
        
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Text size="sm" c="dimmed">
              No messages yet. Be the first to say hello!
            </Text>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} style={{ flexShrink: 0 }}>
                <MessageBubble 
                  message={message}
                  canModerate={canModerate}
                  onDelete={onDeleteMessage}
                />
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} style={{ flexShrink: 0 }} />
      </div>
    </div>
  );
}