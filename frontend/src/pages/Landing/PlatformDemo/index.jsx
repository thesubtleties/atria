import { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion, AnimatePresence } from 'motion/react'
import styles from './PlatformDemo.module.css'

gsap.registerPlugin(ScrollTrigger)

const demoCards = [
  {
    id: 'agenda',
    title: 'Smart Agenda Management',
    subtitle: 'Agendas that organize themselves',
    features: [
      { id: 1, time: '9:00 AM', endTime: '10:00 AM', title: 'Opening Keynote', type: 'KEYNOTE', speaker: 'Sarah Chen', color: '#8B5CF6' },
      { id: 2, time: '10:30 AM', endTime: '11:30 AM', title: 'AI Workshop', type: 'WORKSHOP', speaker: 'Dr. Alex Rivera', color: '#14B8A6' },
      { id: 3, time: '10:30 AM', endTime: '11:30 AM', title: 'UX Best Practices', type: 'WORKSHOP', speaker: 'Emily Zhang', color: '#14B8A6' },
      { id: 4, time: '10:30 AM', endTime: '11:30 AM', title: 'Cloud Architecture', type: 'WORKSHOP', speaker: 'Marcus Johnson', color: '#14B8A6' },
      { id: 5, time: '2:00 PM', endTime: '3:30 PM', title: 'Future of Tech Panel', type: 'PANEL', speaker: 'Industry Leaders', color: '#F59E0B' },
      { id: 6, time: '2:00 PM', endTime: '3:00 PM', title: 'Startup Pitch Session', type: 'PRESENTATION', speaker: 'Various', color: '#F97316' }
    ],
    animation: 'smartBuild'
  },
  {
    id: 'networking',
    title: 'Professional Networking',
    subtitle: 'LinkedIn without the awkwardness',
    features: [
      { status: 'green', name: 'Emily Zhang', title: 'Product Designer', action: 'Connect', message: 'Hi Emily! Loved your talk on...' },
      { status: 'pending', name: 'Marcus Johnson', title: 'CTO', action: 'Pending', message: 'Connection request sent' },
      { status: 'connected', name: 'Lisa Park', title: 'Founder', action: 'Message', message: 'Great to connect!' }
    ],
    animation: 'slideRight'
  },
  {
    id: 'session',
    title: 'Live Session Experience',
    subtitle: 'Broadcast-quality virtual experiences',
    features: [
      { type: 'video', status: 'LIVE', viewers: '2,341', speaker: 'Innovation in AI' },
      { type: 'chat', messages: [
        { user: 'Alex Chen', text: 'Great presentation! 🎉' },
        { user: 'Sarah Kim', text: 'Can you share the slides?' },
        { user: 'Mike Ross', text: 'Amazing insights on ML!' }
      ] },
      { type: 'backstage', access: 'Speakers Only' }
    ],
    animation: 'slideUp'
  }
]

const PlatformDemo = () => {
  const containerRef = useRef(null)
  const headerRef = useRef(null)
  const currentIndexRef = useRef(0)
  const isAnimatingRef = useRef(false)
  const cardsRef = useRef([])

  useGSAP(() => {
      // Header animation - use ref directly
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

      // Get all cards - use containerRef to scope the search
      const cards = containerRef.current ? gsap.utils.toArray('.demo-card', containerRef.current) : []
      if (cards.length === 0) return // Exit early if no cards found
      
      cardsRef.current = cards
      
      // Set initial positions
      cards.forEach((card, index) => {
        gsap.set(card, {
          y: index === 0 ? 0 : '100%',
          zIndex: cards.length - index,
          visibility: 'visible',
          force3D: true
        })
      })
      
      // Function to animate to a specific card
      const goToCard = (index) => {
        if (isAnimatingRef.current || index < 0 || index >= cards.length) return
        
        isAnimatingRef.current = true
        const tl = gsap.timeline({
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
              force3D: true
            }, 0)
          } else if (i === index) {
            // Current card sits at 0
            tl.to(card, {
              y: 0,
              duration: 0.8,
              ease: 'power2.inOut',
              force3D: true
            }, 0)
          } else {
            // Cards after current index stay below
            tl.to(card, {
              y: '100%',
              duration: 0.8,
              ease: 'power2.inOut',
              force3D: true
            }, 0)
          }
        })
        
        // Animate interface content when card comes into view
        const currentCard = cards[index]
        const demoInterface = currentCard.querySelector('.demo-interface')
        if (demoInterface && !demoInterface.classList.contains('animated')) {
          demoInterface.classList.add('animated')
          const animationType = demoCards[index].animation
          
          if (animationType === 'smartBuild' && index === 0) {
            // Smart agenda building animation - only for agenda card
            const agendaGrid = demoInterface.querySelector('.agenda-grid')
            if (agendaGrid) {
              // Clear any existing content
              agendaGrid.innerHTML = ''
              
              // Create timeline for the smart build
              const buildTl = gsap.timeline({ delay: 0.5 })
              
              // Group sessions by time
              const sessions = demoCards[index].features
              const timeSlots = {}
              sessions.forEach(session => {
                if (!timeSlots[session.time]) {
                  timeSlots[session.time] = []
                }
                timeSlots[session.time].push(session)
              })
              
              // Build the agenda with animations
              let currentTop = 0
              Object.entries(timeSlots).forEach(([time, slotSessions], slotIndex) => {
                slotSessions.forEach((session, sessionIndex) => {
                  // Create session element
                  const sessionEl = document.createElement('div')
                  sessionEl.className = styles.smartAgendaItem
                  sessionEl.style.position = 'absolute'
                  sessionEl.style.top = `${currentTop}px`
                  sessionEl.style.width = `calc(${100 / slotSessions.length}% - ${slotSessions.length > 1 ? 'var(--space-micro, 8px)' : '0px'})`
                  sessionEl.style.left = `${(100 / slotSessions.length) * sessionIndex}%`
                  sessionEl.style.height = 'clamp(80px, 10vh, 100px)'
                  
                  sessionEl.innerHTML = `
                    <div class="${styles.typeTag}">
                      <span class="${styles.sessionType} ${styles[session.type.toLowerCase()]}">
                        ${session.type}
                      </span>
                    </div>
                    <div class="${styles.sessionCardContent}">
                      <h3 class="${styles.sessionTitle}">${session.title}</h3>
                      <div class="${styles.sessionTime}">${session.time} - ${session.endTime}</div>
                    </div>
                    <div class="${styles.expandedContent}">
                      <div class="${styles.speakerInfo}">
                        <div class="${styles.speakerName}">${session.speaker}</div>
                      </div>
                    </div>
                  `
                  
                  agendaGrid.appendChild(sessionEl)
                  
                  // Animate session flying in
                  buildTl.fromTo(sessionEl, {
                    opacity: 0,
                    scale: 0.5,
                    x: sessionIndex % 2 === 0 ? -1 * Math.min(200, window.innerWidth * 0.4) : Math.min(200, window.innerWidth * 0.4),
                    y: -50,
                    rotateY: sessionIndex % 2 === 0 ? -45 : 45,
                  }, {
                    opacity: 1,
                    scale: 1,
                    x: 0,
                    y: 0,
                    rotateY: 0,
                    duration: 0.8,
                    ease: 'back.out(1.2)',
                  }, slotIndex * 0.4 + sessionIndex * 0.2)
                  
                  // Add glow effect during placement
                  buildTl.to(sessionEl, {
                    boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)',
                    duration: 0.3,
                    ease: 'power2.inOut',
                  }, `-=0.4`)
                  
                  buildTl.to(sessionEl, {
                    boxShadow: '0 2px 15px rgba(139, 92, 246, 0.08)',
                    duration: 0.3,
                    ease: 'power2.inOut',
                  }, `-=0.1`)
                  
                  // Add hover interactions
                  sessionEl.addEventListener('mouseenter', () => {
                    gsap.to(sessionEl, {
                      y: -3,
                      boxShadow: '0 12px 40px rgba(139, 92, 246, 0.12)',
                      duration: 0.3,
                      ease: 'power2.out',
                      force3D: true,
                      overwrite: 'auto'
                    })
                  })
                  
                  sessionEl.addEventListener('mouseleave', () => {
                    gsap.to(sessionEl, {
                      y: 0,
                      boxShadow: '0 2px 15px rgba(139, 92, 246, 0.08)',
                      duration: 0.3,
                      ease: 'power2.out',
                      force3D: true,
                      overwrite: 'auto'
                    })
                  })
                })
                
                currentTop += window.innerWidth <= 768 ? 90 : 110 // Responsive height for time slots
              })
              
              // Update header text after build completes
              const dateLabel = demoInterface.querySelector(`.${styles.dateLabel}`)
              if (dateLabel) {
                buildTl.call(() => {
                  dateLabel.textContent = "Today's Smart Schedule"
                })
              }
            }
          } else {
            // Original slide animations
            let fromVars = {}
            switch (animationType) {
              case 'slideLeft':
                fromVars = { x: -100, opacity: 0 }
                break
              case 'slideRight':
                fromVars = { x: 100, opacity: 0 }
                break
              case 'slideUp':
                fromVars = { y: 100, opacity: 0 }
                break
            }
            
            tl.fromTo(demoInterface,
              fromVars,
              {
                x: 0,
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power2.out'
              },
              0.3
            )
          }
        }
      }
      
      // Create scroll lock with Observer
      let observerInstance = null
      
      // Helper function to create observer
      const createObserver = () => {
        // Kill existing observer first
        if (observerInstance) {
          observerInstance.kill()
        }
        
        observerInstance = ScrollTrigger.observe({
          target: window,
          type: 'wheel,touch',
          onDown: () => {
            // Scrolling down should go to next card
            const nextIndex = currentIndexRef.current + 1
            if (nextIndex < cards.length) {
              goToCard(nextIndex)
            }
          },
          onUp: () => {
            // Scrolling up should go to previous card
            const prevIndex = currentIndexRef.current - 1
            if (prevIndex >= 0) {
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
        onEnter: createObserver,
        onLeave: () => {
          // When leaving the section, ensure we're on the last card
          if (currentIndexRef.current < cards.length - 1) {
            goToCard(cards.length - 1)
          }
          if (observerInstance) {
            observerInstance.kill()
            observerInstance = null
          }
        },
        onEnterBack: createObserver,
        onLeaveBack: () => {
          if (observerInstance) {
            observerInstance.kill()
            observerInstance = null
          }
        }
      })
      
      // Cleanup function
      return () => {
        if (observerInstance) {
          observerInstance.kill()
        }
        if (scrollTriggerInstance) {
          scrollTriggerInstance.kill()
        }
      }
  })

  const renderCardContent = (card, index) => {
    switch (card.id) {
      case 'agenda':
        return (
          <motion.div className={styles.agendaContent}>
            <div className={styles.agendaHeader}>
              <span className={styles.dateLabel}>Building Smart Schedule...</span>
            </div>
            <div className={`${styles.agendaGrid} agenda-grid`}>
              {/* Sessions will be animated in dynamically */}
            </div>
          </motion.div>
        )
      
      case 'networking':
        return (
          <motion.div className={styles.networkingContent}>
            <div className={styles.networkingHeader}>
              <span className={styles.greenLight}>● Green Light Active</span>
            </div>
            {card.features.map((connection, idx) => (
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
      
      case 'session':
        return (
          <motion.div className={styles.sessionContent}>
            <div className={styles.videoContainer}>
              <div className={styles.videoPlayer}>
                <div className={styles.videoOverlay}>
                  <div className={styles.liveIndicator}>
                    <span className={styles.liveDot} />
                    LIVE
                  </div>
                  <div className={styles.sessionTitle}>{card.features[0].speaker}</div>
                  <div className={styles.viewerCount}>
                    <span>👁</span> {card.features[0].viewers} watching
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.interactionPanel}>
              <div className={styles.chatTabs}>
                <button className={styles.activeTab}>Chat</button>
                <button className={styles.inactiveTab}>Backstage</button>
              </div>
              <div className={styles.chatMessages}>
                {card.features[1].messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    className={styles.chatMessage}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + idx * 0.2 }}
                  >
                    <span className={styles.chatUser}>{msg.user}</span>
                    <span className={styles.chatText}>{msg.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )
      
      default:
        return null
    }
  }

  return (
    <section className={`${styles.platformDemo} platformDemo`}>
      <div ref={headerRef} className="demo-header">
        <h2 className={styles.sectionTitle}>See Atria in Action</h2>
        <p className={styles.sectionSubtitle}>Real interfaces, real interactions, real results</p>
      </div>
      
      <div ref={containerRef} className={styles.demoWrapper}>
        <div className={`${styles.cardsContainer} cards-container`}>
          {demoCards.map((card, index) => (
            <div
              key={card.id}
              className={`${styles.demoCard} demo-card`}
            >
              <div className={styles.cardInner}>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  <p className={styles.cardSubtitle}>{card.subtitle}</p>
                </div>
                <div className={`${styles.demoInterface} demo-interface`}>
                  {renderCardContent(card, index)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PlatformDemo