import { forwardRef } from 'react';
import { motion } from 'motion/react';
import atriaLogo from '../../../../assets/atria-logo.svg';
import styles from './EventView.module.css';

type EventViewProps = {
  isTransitioning: boolean;
};

export const EventView = forwardRef<HTMLDivElement, EventViewProps>(({ isTransitioning }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={styles.mockInterface}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isTransitioning ? 0 : 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      {/* Event View Mock - Matches real AppShell layout */}
      <div className={styles.eventHeader}>
        {/* Left: Hamburger menu */}
        <div className={styles.navLeft}>
          <div className={styles.hamburgerMenu}>
            <svg width='18' height='18' viewBox='0 0 18 18'>
              <path
                d='M3 4.5h12M3 9h12M3 13.5h12'
                stroke='white'
                strokeWidth='1.5'
                strokeLinecap='round'
              />
            </svg>
          </div>
        </div>

        {/* Center: Event name */}
        <div className={styles.navCenter}>
          <h1 className={styles.eventTitle}>Innovate Summit 2025</h1>
        </div>

        {/* Right: User menu */}
        <div className={styles.navRight}>
          <div className={styles.userMenuButton}>
            <img src={atriaLogo} alt='Menu' width='20' height='20' />
          </div>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        {/* Left Sidebar Navigation */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarContent}>
            <div className={styles.sidebarHeader}>
              <span className={styles.sidebarTitle}>Event Menu</span>
            </div>
            <nav className={styles.eventNav}>
              <div className={`${styles.eventNavItem} ${styles.active}`}>
                <span>Event Home</span>
              </div>
              <div className={styles.eventNavItem}>
                <span>Agenda</span>
              </div>
              <div className={styles.eventNavItem}>
                <span>Speakers</span>
              </div>
              <div className={styles.eventNavItem}>
                <span>Attendees</span>
              </div>
              <div className={styles.eventNavItem}>
                <span>Networking</span>
              </div>
              <div className={styles.eventNavItem}>
                <span>Sponsors</span>
              </div>
            </nav>
          </div>

          {/* Atria attribution at bottom */}
          <div className={styles.atriaAttribution}>
            <span className={styles.attributionText}>
              Powered by{' '}
              <a href='#' className={styles.atriaLink}>
                atria
              </a>
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.eventContent}>
          <div className={styles.heroSection}>
            <h2 className={styles.eventHeroTitle}>Welcome to Innovate Summit 2025</h2>
            <p className={styles.eventHeroText}>
              Experience three days of innovation, learning, and networking in your fully branded
              event environment.
            </p>
          </div>
        </div>
      </div>

      {/* Highlight the branding ownership */}
      <div className={styles.brandHighlight}>
        <div className={styles.highlightPointer}>
          <svg width='40' height='40' viewBox='0 0 40 40' fill='none'>
            <path
              d='M20 10v20m-10-10h20'
              stroke='var(--color-accent-yellow)'
              strokeWidth='3'
              strokeLinecap='round'
            />
            <circle cx='20' cy='20' r='19' stroke='var(--color-accent-yellow)' strokeWidth='2' />
          </svg>
        </div>
        <div className={styles.highlightText}>
          <p>Your brand front and center</p>
          <p className={styles.highlightSubtext}>Atria attribution moved to sidebar</p>
        </div>
      </div>
    </motion.div>
  );
});

EventView.displayName = 'EventView';
