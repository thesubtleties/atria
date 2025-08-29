// src/shared/components/chat/MinimizedChatWindow/index.jsx
import { useSocketMessages } from '../../../hooks/useSocketMessages';
import styles from './styles/index.module.css';

function MinimizedChatWindow({ threadId, onClick, zIndex }) {
  const { otherUser, isLoading } = useSocketMessages(threadId);

  return (
    <div
      className={styles.minimizedWindow}
      onClick={onClick}
      style={{ zIndex }}
    >
      <div className={styles.minimizedContent}>
        {isLoading ? 'Loading chat...' : otherUser?.full_name || 'Chat'}
      </div>
    </div>
  );
}

export default MinimizedChatWindow;
