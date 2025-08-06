import { motion } from 'motion/react'
import styles from './PhilosophyPanel.module.css'

export const PhilosophyPanel = ({ title, quote, content, footer }) => {
  return (
    <div className={`${styles.panel} ${styles.philosophyPanel} panel`}>
      <div className={`${styles.panelContent} panel-content`}>
        <div className={styles.magazineLayout}>
          <motion.h3 
            className={styles.philosophyTitle}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {title}
          </motion.h3>
          
          {quote && (
            <motion.p 
              className={styles.philosophyQuote}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              {quote}
            </motion.p>
          )}
          
          <motion.div 
            className={styles.philosophyContent}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <p>{content}</p>
          </motion.div>
          
          {footer && (
            <motion.p 
              className={styles.philosophyFooter}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {footer}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  )
}