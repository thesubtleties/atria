import { forwardRef } from 'react'
import { motion } from 'motion/react'
import atriaLogo from '../../../../assets/atria-logo.svg'
import styles from './DashboardView.module.css'

export const DashboardView = forwardRef(({ isTransitioning }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={styles.mockInterface}
      animate={{ opacity: isTransitioning ? 0 : 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      {/* Atria Dashboard Mock - Matches real TopNav */}
      <div className={styles.dashboardHeader}>
        {/* Left: Atria text logo */}
        <div className={styles.navLeft}>
          <div className={styles.atriaTextLogo}>atria</div>
        </div>
        
        {/* Center: Empty (no navigation in dashboard) */}
        <div className={styles.navCenter}></div>
        
        {/* Right: User menu */}
        <div className={styles.navRight}>
          <div className={styles.userMenuButton}>
            <img src={atriaLogo} alt="Menu" width="20" height="20" />
          </div>
        </div>
      </div>
      
      <div className={styles.dashboardContent}>
        <h3 className={styles.dashboardTitle}>Events</h3>
        <div className={styles.eventCard}>
          <div className={styles.eventPreview}>
            <h4>Innovate Summit 2025</h4>
            <p>March 15-17, 2025</p>
            <button className={styles.launchButton}>
              Launch Event →
            </button>
          </div>
        </div>
      </div>

      {/* Transform indicator */}
      <motion.div 
        className={styles.transformIndicator}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span>Scroll to see the transformation</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14m0 0l-7-7m7 7l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
    </motion.div>
  )
})

DashboardView.displayName = 'DashboardView'