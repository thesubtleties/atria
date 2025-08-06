import { useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { AnimatePresence } from 'motion/react'
import { BrandHeader, DashboardView, EventView } from './components'
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
      ScrollTrigger.batch(headerRef.current.querySelectorAll('h2, p'), {
        onEnter: batch => gsap.from(batch, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          force3D: true,
          overwrite: 'auto'
        }),
        start: 'top 80%',
        once: true
      })
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

    // Dashboard entrance animation - use CSS for initial state
    if (dashboard) {
      dashboard.style.transform = 'translateY(100px)';
      dashboard.style.opacity = '0';
      
      ScrollTrigger.create({
        trigger: container,
        start: 'top 50%',
        once: true,
        onEnter: () => {
          if (!showEventView) {
            gsap.to(dashboard, {
              y: 0,
              opacity: 1,
              duration: 1,
              ease: 'power2.out',
              force3D: true,
              clearProps: 'transform,opacity'
            })
          }
        }
      })
    }
    
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
        <div ref={headerRef}>
          <BrandHeader />
        </div>

        <div className={styles.showcaseWrapper}>
          <AnimatePresence mode="wait">
            {!showEventView ? (
              <DashboardView
                key="dashboard"
                ref={dashboardRef}
                isTransitioning={isTransitioning}
              />
            ) : (
              <EventView
                key="event"
                ref={eventRef}
                isTransitioning={isTransitioning}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Coming Soon Note */}
        <div className={styles.comingSoonNote}>
          <div className={styles.noteContent}>
            <div className={styles.noteText}>
              <h4>Complete Brand Customization</h4>
              <p>Full event theming with custom colors, fonts, and branding elements coming in our next major update. Make every event truly yours while keeping Atria beautifully minimal.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

export default BrandExperience