import { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { AgendaDemo } from './components/AgendaDemo'
import { NetworkingDemo } from './components/NetworkingDemo'
import { SessionDemo } from './components/SessionDemo'
import styles from './PlatformDemo.module.css'

gsap.registerPlugin(ScrollTrigger)

const demoCards = [
  {
    id: 'agenda',
    title: 'Smart Agenda Management',
    subtitle: 'Agendas that organize themselves',
    Component: AgendaDemo
  },
  {
    id: 'networking',
    title: 'Lasting Connections',
    subtitle: 'Curated conversation starters help attendees connect authentically',
    Component: NetworkingDemo
  },
  {
    id: 'session',
    title: 'Live Session Experience',
    subtitle: 'Broadcast-quality virtual experiences',
    Component: SessionDemo
  }
]

const PlatformDemo = () => {
  const containerRef = useRef(null)
  const headerRef = useRef(null)
  const currentIndexRef = useRef(0)
  const isAnimatingRef = useRef(false)
  const cardsRef = useRef([])
  const lastScrollTimeRef = useRef(0)
  const observerRef = useRef(null)
  
  // Firefox detection for performance optimizations
  const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf('firefox') > -1

  useGSAP(() => {
      // Header animation
      if (headerRef.current) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 80%',
            once: true,
            fastScrollEnd: true
          }
        })
        
        tl.from(headerRef.current.querySelector(`.${styles.sectionTitle}`), {
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: 'power3.out',
          force3D: !isFirefox
        })
        .from(headerRef.current.querySelector(`.${styles.sectionSubtitle}`), {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: 'power2.out',
          force3D: !isFirefox
        }, '-=0.4')
      }

      // Get all cards
      const cards = containerRef.current ? gsap.utils.toArray('.demo-card', containerRef.current) : []
      if (cards.length === 0) return
      
      cardsRef.current = cards
      
      // Set initial positions
      cards.forEach((card, index) => {
        gsap.set(card, {
          y: index === 0 ? 0 : '100%',
          zIndex: cards.length - index,
          visibility: 'visible',
          force3D: !isFirefox
        })
      })
      
      // Function to animate to a specific card
      const goToCard = (index) => {
        // Guard against invalid indices and concurrent animations
        if (isAnimatingRef.current || index < 0 || index >= cards.length) {
          return
        }
        
        // Don't animate if we're already at this card
        if (currentIndexRef.current === index) {
          return
        }
        
        isAnimatingRef.current = true
        const tl = gsap.timeline({
          onStart: () => {
            // Trigger animation when starting to move to the card
            const targetCard = cards[index]
            if (targetCard) {
              const event = new CustomEvent('card-active', { detail: { index } })
              targetCard.dispatchEvent(event)
            }
          },
          onComplete: () => {
            isAnimatingRef.current = false
            currentIndexRef.current = index
          }
        })
        
        // Animate cards based on index
        cards.forEach((card, i) => {
          if (i < index) {
            // Cards before current index go up
            tl.to(card, {
              y: '-100%',
              duration: 0.8,
              ease: 'power2.inOut',
              force3D: !isFirefox
            }, 0)
          } else if (i === index) {
            // Current card sits at 0
            tl.to(card, {
              y: 0,
              duration: 0.8,
              ease: 'power2.inOut',
              force3D: !isFirefox
            }, 0)
          } else {
            // Cards after current index stay below
            tl.to(card, {
              y: '100%',
              duration: 0.8,
              ease: 'power2.inOut',
              force3D: !isFirefox
            }, 0)
          }
        })
      }
      
      // Create scroll lock with Observer
      const SCROLL_DEBOUNCE = 600 // Minimum time between card changes
      
      // Helper function to create observer
      const createObserver = () => {
        // Kill existing observer first
        if (observerRef.current) {
          observerRef.current.kill()
          observerRef.current = null
        }
        
        observerRef.current = ScrollTrigger.observe({
          target: window,
          type: 'wheel,touch',
          onDown: () => {
            const now = Date.now()
            // Check debounce and animation state
            if (now - lastScrollTimeRef.current < SCROLL_DEBOUNCE || isAnimatingRef.current) {
              return
            }
            
            // Scrolling down should go to next card
            const nextIndex = currentIndexRef.current + 1
            if (nextIndex < cards.length) {
              lastScrollTimeRef.current = now
              goToCard(nextIndex)
            }
          },
          onUp: () => {
            const now = Date.now()
            // Check debounce and animation state
            if (now - lastScrollTimeRef.current < SCROLL_DEBOUNCE || isAnimatingRef.current) {
              return
            }
            
            // Scrolling up should go to previous card
            const prevIndex = currentIndexRef.current - 1
            if (prevIndex >= 0) {
              lastScrollTimeRef.current = now
              goToCard(prevIndex)
            }
          },
          tolerance: 50,
          preventDefault: true,
          wheelSpeed: 0.5
        })
      }
      
      const scrollTriggerInstance = ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        pin: true,
        pinSpacing: true,
        invalidateOnRefresh: true,
        onEnter: () => {
          // Reset to first card when entering from above
          currentIndexRef.current = 0
          cards.forEach((card, i) => {
            gsap.set(card, {
              y: i === 0 ? 0 : '100%',
              immediateRender: true
            })
          })
          createObserver()
        },
        onLeave: () => {
          // When leaving downward, go to last card
          if (currentIndexRef.current < cards.length - 1) {
            goToCard(cards.length - 1)
          }
          if (observerRef.current) {
            observerRef.current.kill()
            observerRef.current = null
          }
        },
        onEnterBack: () => {
          // When scrolling back up into view
          createObserver()
        },
        onLeaveBack: () => {
          // When leaving upward, reset to first card
          currentIndexRef.current = 0
          cards.forEach((card, i) => {
            gsap.set(card, {
              y: i === 0 ? 0 : '100%',
              immediateRender: true
            })
          })
          if (observerRef.current) {
            observerRef.current.kill()
            observerRef.current = null
          }
        }
      })
      
      // Cleanup function
      return () => {
        if (observerRef.current) {
          observerRef.current.kill()
          observerRef.current = null
        }
        if (scrollTriggerInstance) {
          scrollTriggerInstance.kill()
        }
      }
  })

  return (
    <section className={`${styles.platformDemo} platformDemo`}>
      <div ref={headerRef} className="demo-header">
        <h2 className={styles.sectionTitle}>See Atria in Action</h2>
        <p className={styles.sectionSubtitle}>Real interfaces, real interactions, real results</p>
      </div>
      
      <div ref={containerRef} className={styles.demoWrapper}>
        <div className={`${styles.cardsContainer} cards-container`}>
          {demoCards.map((card, index) => {
            const Component = card.Component
            return (
              <div
                key={card.id}
                className={`${styles.demoCard} demo-card`}
                data-card-index={index}
              >
                <div className={styles.cardInner}>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>{card.title}</h3>
                    <p className={styles.cardSubtitle}>{card.subtitle}</p>
                  </div>
                  <div className={`${styles.demoInterface} demo-interface`}>
                    <Component 
                      isFirefox={isFirefox} 
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default PlatformDemo