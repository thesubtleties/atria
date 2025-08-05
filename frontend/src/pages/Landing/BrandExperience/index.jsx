import { useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion, AnimatePresence } from 'motion/react'
import styles from './BrandExperience.module.css'

gsap.registerPlugin(ScrollTrigger)

const BrandExperience = () => {
  const containerRef = useRef(null)
  const dashboardRef = useRef(null)
  const eventRef = useRef(null)
  const headerRef = useRef(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showEventView, setShowEventView] = useState(false)

  useGSAP(() => {
    const container = containerRef.current
    const dashboard = dashboardRef.current
    
    if (!container) return
    
    // Set initial height to prevent layout shift
    gsap.set(container, {
      minHeight: '100vh'
    })

    // Header animation - only animate once on initial load
    if (headerRef.current) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 80%',
          once: true
        }
      })
      
      tl.from(headerRef.current.querySelector(`.${styles.sectionTitle}`), {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
        force3D: true
      })
      .from(headerRef.current.querySelector(`.${styles.sectionSubtitle}`), {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power2.out',
        force3D: true
      }, '-=0.4')
    }

    // Create the transformation animation with GSAP timeline instead of setTimeout
    let currentShowEventView = showEventView
    const transitionTl = gsap.timeline({ paused: true })
    
    // Set up the transition animation
    transitionTl
      .to({}, {
        duration: 0.01,
        onStart: () => setIsTransitioning(true)
      })
      .to({}, {
        duration: 0.3,
        ease: "power2.inOut"
      })
      .to({}, {
        duration: 0.01,
        onComplete: () => {
          setShowEventView(currentShowEventView)
          setIsTransitioning(false)
        }
      })
    
    ScrollTrigger.create({
      id: 'brand-transform',
      trigger: container,
      start: 'top top',
      end: '+=200%', // Pin for 200% of viewport height
      pin: true,
      pinSpacing: true,
      invalidateOnRefresh: true,
      preventOverlaps: true,
      fastScrollEnd: true,
      onUpdate: (self) => {
        const shouldShowEvent = self.progress > 0.5
        if (shouldShowEvent !== currentShowEventView) {
          currentShowEventView = shouldShowEvent
          transitionTl.restart()
        }
      }
    })

    // Set initial state for dashboard to prevent flash
    if (dashboard) {
      gsap.set(dashboard, {
        y: 100,
        opacity: 0
      })
    }

    // Mock interface sliding animation
    ScrollTrigger.create({
      trigger: container,
      start: 'top 50%',
      once: true,
      onEnter: () => {
        if (dashboard && !showEventView) {
          gsap.to(dashboard, {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power2.out',
            force3D: true
          })
        }
      }
    })
    
    // Ensure proper cleanup on component state change
    return () => {
      ScrollTrigger.getById('brand-transform')?.kill()
      transitionTl.kill()
    }
  }, { 
    scope: containerRef
  })

  return (
    <section ref={containerRef} className={`${styles.brandExperience} brandExperience`}>
      <div className={styles.container}>
        <div ref={headerRef} className="brand-header">
          <h2 className={styles.sectionTitle}>Your Event, Your Brand</h2>
          <p className={styles.sectionSubtitle}>
            When the show starts, Atria disappears. Your event takes center stage.
          </p>
        </div>

        <div className={styles.showcaseWrapper}>
          <AnimatePresence mode="wait">
            {!showEventView ? (
              <motion.div
                key="dashboard"
                ref={dashboardRef}
                className={styles.mockInterface}
                animate={{ opacity: isTransitioning ? 0 : 1 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
              >
                {/* Atria Dashboard Mock */}
                <div className={styles.dashboardHeader}>
                  <div className={styles.atriaLogo}>atria</div>
                  <div className={styles.dashboardNav}>
                    <span className={styles.navItem}>Events</span>
                    <span className={styles.navItem}>Analytics</span>
                    <span className={styles.navItem}>Settings</span>
                  </div>
                </div>
                
                <div className={styles.dashboardContent}>
                  <h3 className={styles.dashboardTitle}>Atria Event Dashboard</h3>
                  <div className={styles.eventCard}>
                    <div className={styles.eventPreview}>
                      <h4>TechConf 2025</h4>
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
            ) : (
              <motion.div
                key="event"
                ref={eventRef}
                className={styles.mockInterface}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isTransitioning ? 0 : 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
              >
                {/* Event View Mock */}
                <div className={styles.eventHeader}>
                  <div className={styles.eventBranding}>
                    <h1 className={styles.eventLogo}>TechConf 2025</h1>
                    <span className={styles.eventTagline}>The Future of Innovation</span>
                  </div>
                  <div className={styles.eventNav}>
                    <span className={styles.eventNavItem}>Agenda</span>
                    <span className={styles.eventNavItem}>Speakers</span>
                    <span className={styles.eventNavItem}>Networking</span>
                    <span className={styles.eventNavItem}>Sponsors</span>
                  </div>
                </div>
                
                <div className={styles.eventContent}>
                  <div className={styles.heroSection}>
                    <h2 className={styles.eventHeroTitle}>Welcome to TechConf 2025</h2>
                    <p className={styles.eventHeroText}>
                      Join 5,000+ innovators for three days of inspiring talks, 
                      workshops, and networking opportunities.
                    </p>
                  </div>
                  
                  {/* Tiny Atria attribution */}
                  <div className={styles.atriaAttribution}>
                    <span className={styles.poweredBy}>Powered by</span>
                    <span className={styles.atriaSmall}>atria</span>
                  </div>
                </div>

                {/* Highlight the branding ownership */}
                <motion.div 
                  className={styles.brandHighlight}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className={styles.highlightPointer}>
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <path d="M20 10v20m-10-10h20" stroke="var(--color-accent-yellow)" strokeWidth="3" strokeLinecap="round"/>
                      <circle cx="20" cy="20" r="19" stroke="var(--color-accent-yellow)" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className={styles.highlightText}>
                    <p>Your brand front and center</p>
                    <p className={styles.highlightSubtext}>Atria stays humble in the corner</p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  )
}

export default BrandExperience