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
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 80%',
          once: true
        }
      })
      
      const title = headerRef.current.querySelector('h2')
      const subtitle = headerRef.current.querySelector('p')
      
      if (title) {
        tl.from(title, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: 'power3.out',
          force3D: true
        })
      }
      
      if (subtitle) {
        tl.from(subtitle, {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: 'power2.out',
          force3D: true
        }, '-=0.4')
      }
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