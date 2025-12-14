// src/shared/components/chat/ResponsiveChatContainer/index.tsx
import { useMediaQuery } from '@mantine/hooks';
import ChatContainer from '../ChatContainer';
import MobileChatContainer from '../MobileChatContainer';

function ResponsiveChatContainer(): JSX.Element | null {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return <MobileChatContainer />;
  }

  return <ChatContainer />;
}

export default ResponsiveChatContainer;
