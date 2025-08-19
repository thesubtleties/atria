// src/shared/components/chat/ResponsiveChatContainer/index.jsx
import { useMediaQuery } from '@mantine/hooks';
import ChatContainer from '../ChatContainer';
import MobileChatContainer from '../MobileChatContainer';

/**
 * Responsive wrapper that chooses between desktop and mobile chat experiences
 * Breakpoint: 768px (matches our global mobile breakpoint)
 */
function ResponsiveChatContainer() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Mobile: Full-screen simplified chat
  if (isMobile) {
    return <MobileChatContainer />;
  }

  // Desktop: Existing windowed chat system
  return <ChatContainer />;
}

export default ResponsiveChatContainer;