// src/shared/components/chat/TypingIndicator/index.jsx
import styles from './styles.module.css';

/**
 * iOS-style typing indicator
 * Shows animated dots in a bubble matching incoming message style
 */
function TypingIndicator() {
  return (
    <div className={styles.typingIndicator}>
      <div className={styles.typingBubble}>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
      </div>
    </div>
  );
}

export default TypingIndicator;
