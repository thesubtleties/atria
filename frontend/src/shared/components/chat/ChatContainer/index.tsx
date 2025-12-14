// src/shared/components/chat/ChatContainer/index.tsx
import { useSelector, useDispatch } from 'react-redux';
import ChatSidebar from '../ChatSidebar';
import ChatWindow from '../ChatWindow';
import MinimizedChatWindow from '../MinimizedChatWindow';
import { maximizeThread } from '../../../../app/store/chatSlice';
import type { RootState, AppDispatch } from '../../../../app/store';
import styles from './styles/index.module.css';

function ChatContainer() {
  const { activeThreads, minimizedThreads } = useSelector((state: RootState) => state.chat);
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div className={styles.chatContainer}>
      <ChatSidebar />

      <div className={styles.windowsContainer}>
        {/* Active Windows */}
        {activeThreads.map((threadId, index) => (
          <div key={threadId} className={styles.windowWrapper} style={{ zIndex: 1000 - index }}>
            <ChatWindow threadId={threadId} />
          </div>
        ))}

        {/* Minimized Windows */}
        {minimizedThreads.map((threadId, index) => (
          <MinimizedChatWindow
            key={threadId}
            threadId={threadId}
            onClick={() => dispatch(maximizeThread(threadId))}
            zIndex={900 - index}
          />
        ))}
      </div>
    </div>
  );
}

export default ChatContainer;
