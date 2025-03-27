// src/shared/components/chat/ChatContainer/index.jsx
import { useSelector } from 'react-redux';
import ChatSidebar from '../ChatSidebar';
import ChatWindow from '../ChatWindow';
import styles from './styles/index.module.css';

function ChatContainer() {
  const { activeThreads, minimizedThreads } = useSelector(
    (state) => state.chat
  );

  // Calculate positions for chat windows
  const getWindowPosition = (index) => {
    return {
      right: `${330 + index * 310}px`,
    };
  };

  return (
    <div className={styles.chatContainer}>
      <ChatSidebar />

      {/* Active Windows */}
      {activeThreads.map((threadId, index) => (
        <div
          key={threadId}
          style={getWindowPosition(index)}
          className={styles.windowWrapper}
        >
          <ChatWindow threadId={threadId} />
        </div>
      ))}

      {/* Minimized Windows */}
      <div className={styles.minimizedWindows}>
        {minimizedThreads.map((threadId) => (
          <div key={threadId} className={styles.minimizedWindow}>
            <div className={styles.minimizedContent}>Chat</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatContainer;
