import { useCallback } from 'react';

/**
 * Custom hook for handling mobile input interactions
 * - Prevents zoom on input focus
 * - Blurs input after sending to reset viewport
 * - Handles Enter key submission with keyboard dismissal
 * 
 * @param {Function} onSend - Callback when message should be sent
 * @param {string} value - Current input value
 * @param {boolean} canSend - Whether sending is allowed
 * @returns {Object} Event handlers for input
 */
interface MobileInputHandlers {
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSendClick: () => void;
  handleFocus: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
}

export function useMobileInputHandler(
  onSend: () => void,
  value: string,
  canSend = true
): MobileInputHandlers {
  // Force viewport reset on iOS
  const forceViewportReset = useCallback(() => {
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      // Method 1: Use viewport meta tag manipulation
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        const originalContent = viewport.getAttribute('content');
        // Temporarily set to not allow zoom
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
        
        // Reset after a brief delay
        setTimeout(() => {
          viewport.setAttribute('content', originalContent ?? '');
        }, 100);
      }
      
      // Method 2: Force scroll reset
      setTimeout(() => {
        window.scrollTo(0, 1);
        window.scrollTo(0, 0);
      }, 100);
    }
  }, []);

  // Handle Enter key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value?.trim() && canSend) {
        onSend();
        // Blur the input to close keyboard
        setTimeout(() => {
          (e.target as HTMLTextAreaElement).blur();
          forceViewportReset();
        }, 50);
      }
    }
  }, [onSend, value, canSend, forceViewportReset]);

  // Handle send button click
  const handleSendClick = useCallback(() => {
    if (value?.trim() && canSend) {
      onSend();
      // Blur any focused element and reset zoom
      setTimeout(() => {
        (document.activeElement as HTMLElement)?.blur();
        forceViewportReset();
      }, 50);
    }
  }, [onSend, value, canSend, forceViewportReset]);

  // Handle input focus to prevent zoom on mobile
  const handleFocus = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Prevent default zoom behavior on iOS
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      // Set font size to prevent zoom
      (e.target as HTMLTextAreaElement).style.fontSize = '16px';
      // Also set transform origin for better control
      (e.target as HTMLTextAreaElement).style.transformOrigin = 'left top';
      (e.target as HTMLTextAreaElement).style.transform = 'scale(1)';
    }
  }, []);

  // Handle input blur to ensure proper cleanup
  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Force viewport reset when input loses focus
    forceViewportReset();
    
    // Reset any style changes
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      (e.target as HTMLTextAreaElement).style.fontSize = '';
      (e.target as HTMLTextAreaElement).style.transform = '';
      (e.target as HTMLTextAreaElement).style.transformOrigin = '';
    }
  }, [forceViewportReset]);

  return {
    handleKeyDown,
    handleSendClick,
    handleFocus,
    handleBlur
  };
}