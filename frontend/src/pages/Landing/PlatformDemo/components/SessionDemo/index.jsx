import { motion, AnimatePresence } from 'motion/react'
import styles from './SessionDemo.module.css'

const sessionData = {
  speaker: 'Innovation in AI',
  viewers: '2,341',
  messages: [
    { user: 'Alex Chen', text: 'Great presentation! 🎉' },
    { user: 'Sarah Kim', text: 'Can you share the slides?' },
    { user: 'Mike Ross', text: 'Amazing insights on ML!' }
  ]
}

export const SessionDemo = () => {
  return (
    <motion.div className={styles.sessionContent}>
      <div className={styles.videoWrapper}>
        <div className={styles.videoContainer}>
          <div className={styles.videoPlayer}>
            <div className={styles.videoOverlay}>
              <div className={styles.liveIndicator}>
                <span className={styles.liveDot} />
                LIVE
              </div>
              <div className={styles.sessionInfo}>
                <div className={styles.sessionTitle}>{sessionData.speaker}</div>
                <div className={styles.viewerCount}>
                  <span>👁</span> {sessionData.viewers} watching
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.videoControls}>
          <button className={styles.controlBtn}>⏯</button>
          <button className={styles.controlBtn}>🔊</button>
          <button className={styles.controlBtn}>⚙️</button>
          <button className={styles.controlBtn}>⛶</button>
        </div>
      </div>
      <div className={styles.interactionPanel}>
        <div className={styles.chatHeader}>
          <div className={styles.chatTabs}>
            <button className={styles.activeTab}>Chat</button>
            <button className={styles.inactiveTab}>Backstage</button>
            <button className={styles.inactiveTab}>Q&A</button>
          </div>
        </div>
        <div className={styles.chatMessages}>
          <AnimatePresence>
            {sessionData.messages.map((msg, idx) => (
              <motion.div
                key={idx}
                className={styles.chatMessage}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + idx * 0.3, duration: 0.4 }}
              >
                <div className={styles.chatAvatar}>
                  {msg.user.charAt(0)}
                </div>
                <div className={styles.chatContent}>
                  <span className={styles.chatUser}>{msg.user}</span>
                  <span className={styles.chatText}>{msg.text}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className={styles.chatInput}>
          <input 
            type="text" 
            placeholder="Type a message..." 
            className={styles.chatInputField}
            disabled
          />
          <button className={styles.chatSendBtn}>Send</button>
        </div>
      </div>
    </motion.div>
  )
}

export default SessionDemo