import { motion, AnimatePresence } from 'motion/react'
import styles from './NetworkingDemo.module.css'

const connections = [
  { 
    status: 'green', 
    name: 'Emily Zhang', 
    title: 'Product Designer', 
    action: 'Connect', 
    message: 'Hi Emily! Loved your talk on design systems...' 
  },
  { 
    status: 'pending', 
    name: 'Marcus Johnson', 
    title: 'CTO @ StartupX', 
    action: 'Pending', 
    message: 'Connection request sent' 
  },
  { 
    status: 'connected', 
    name: 'Lisa Park', 
    title: 'Founder @ EventTech', 
    action: 'Message', 
    message: 'Great to connect!' 
  }
]

export const NetworkingDemo = () => {
  return (
    <motion.div className={styles.networkingContent}>
      <div className={styles.networkingHeader}>
        <span className={styles.greenLight}>● Green Light Active</span>
      </div>
      {connections.map((connection, idx) => (
        <motion.div
          key={idx}
          className={styles.connectionItem}
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.15 }}
          viewport={{ once: true }}
        >
          <div className={styles.connectionInfo}>
            <div className={styles.avatar}>
              <div className={`${styles.statusIndicator} ${styles[connection.status]}`} />
            </div>
            <div className={styles.personInfo}>
              <h4>{connection.name}</h4>
              <p>{connection.title}</p>
            </div>
          </div>
          <div className={styles.connectionActions}>
            <AnimatePresence mode="wait">
              {connection.status === 'green' && (
                <motion.div
                  className={styles.icebreaker}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <p className={styles.icebreakerText}>{connection.message}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <button className={`${styles.actionButton} ${styles[connection.status]}`}>
              {connection.action}
            </button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default NetworkingDemo