import { useDispatch } from 'react-redux';
import { useMediaQuery } from '@mantine/hooks';
import { openThread, openThreadMobile } from '@/app/store/chatSlice';

/**
 * Unified hook for opening chat threads that works for both desktop and mobile
 * Automatically detects the environment and dispatches the appropriate action
 */
export function useOpenThread() {
  const dispatch = useDispatch();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleOpenThread = (threadId: number) => {
    if (!threadId) {
      console.error('No thread ID provided to openThread');
      return;
    }

    if (isMobile) {
      // Mobile: Use mobile-specific action that also expands sidebar
      dispatch(openThreadMobile(threadId));
    } else {
      // Desktop: Use standard action for windowed chat system
      dispatch(openThread(threadId));
    }
  };

  return handleOpenThread;
}