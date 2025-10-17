import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { motion } from 'motion/react'
import styles from './AgendaDemo.module.css'

const agendaSessions = [
  { 
    id: 1, 
    time: '9:00 AM', 
    endTime: '10:00 AM', 
    title: 'The Future of Event Technology', 
    type: 'KEYNOTE', 
    speaker: 'Sarah Chen', 
    speakerTitle: 'CEO @ TechEvents',
    speakerSeed: 'adfdaf',
    description: 'Exploring how AI and automation are transforming the event industry',
    isKeynote: true 
  },
  { 
    id: 2, 
    time: '10:30 AM', 
    endTime: '11:30 AM', 
    title: 'Building Scalable Platforms', 
    type: 'WORKSHOP', 
    speaker: 'Alex Rivera', 
    speakerTitle: 'Engineer @ Meta',
    speakerSeed: 'iojafkfdfalexrivera22389f',
    description: 'Hands-on workshop on microservices architecture' 
  },
  { 
    id: 3, 
    time: '10:30 AM', 
    endTime: '11:30 AM', 
    title: 'UX Design for Virtual Events', 
    type: 'WORKSHOP', 
    speaker: 'Emily Zhang', 
    speakerTitle: 'Design Lead @ Figma',
    speakerSeed: 'iojafkfdf',
    description: 'Creating engaging digital experiences that connect attendees' 
  }
]

export const AgendaDemo = ({ isFirefox }) => {
  const containerRef = useRef(null)
  const hasAnimatedRef = useRef(false)
  const expandedCardRef = useRef(null)

  useEffect(() => {
    // Listen for card-active event from parent
    const handleCardActive = () => {
      if (!hasAnimatedRef.current && containerRef.current) {
        hasAnimatedRef.current = true
        
        const sessions = containerRef.current.querySelectorAll(`.${styles.sessionCard}`)
        
        // Build animation timeline
        const tl = gsap.timeline({ delay: 0.1 })
        
        sessions.forEach((session, index) => {
          tl.fromTo(session, {
            opacity: 0,
            scale: 0.95,
            y: 20,
          }, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
            force3D: !isFirefox
          }, index * 0.1)
        })
        
        // Update header after animation
        const dateLabel = containerRef.current.querySelector(`.${styles.dateLabel}`)
        if (dateLabel) {
          tl.call(() => {
            dateLabel.textContent = "Today's Smart Schedule"
          })
        }
      }
    }

    // Listen for the card-active event
    const cardElement = containerRef.current?.closest('.demo-card')
    if (cardElement) {
      cardElement.addEventListener('card-active', handleCardActive)
      return () => {
        cardElement.removeEventListener('card-active', handleCardActive)
      }
    }
  }, [isFirefox])

  const handleMouseEnter = (e, sessionIndex) => {
    const card = e.currentTarget
    const rowElement = card.parentElement
    const rowCards = rowElement ? rowElement.querySelectorAll(`.${styles.sessionCard}`) : [card]
    
    expandedCardRef.current = sessionIndex
    
    // Elevate the hovered card
    gsap.to(card, {
      transform: 'translateY(-3px)',
      boxShadow: '0 12px 40px rgba(139, 92, 246, 0.12)',
      zIndex: 25,
      duration: 0.3,
      ease: 'power2.out'
    })
    
    // If this card is in a row with others, add shadow to row partners
    if (rowCards.length > 1) {
      rowCards.forEach((rowCard) => {
        if (rowCard !== card) {
          const otherSpeakers = rowCard.querySelector(`.${styles.speakers}`)
          if (otherSpeakers) {
            // Add hidden spacer class for CSS to handle
            otherSpeakers.classList.add(styles.hiddenSpacer)
          }
          
          gsap.to(rowCard, {
            boxShadow: '0 8px 30px rgba(139, 92, 246, 0.08)',
            zIndex: 20,
            duration: 0.3,
            ease: 'power2.out'
          })
        }
      })
    }
  }

  const handleMouseLeave = (e) => {
    const card = e.currentTarget
    const rowElement = card.parentElement
    const rowCards = rowElement ? rowElement.querySelectorAll(`.${styles.sessionCard}`) : [card]
    
    expandedCardRef.current = null
    
    // Reset the hovered card with delay
    gsap.to(card, {
      transform: 'translateY(0)',
      boxShadow: '0 2px 15px rgba(139, 92, 246, 0.08)',
      zIndex: 10,
      duration: 0.3,
      delay: 0.15,  // Add delay to prevent jitter when moving between cards
      ease: 'power2.out'
    })
    
    // Reset row partners
    if (rowCards.length > 1) {
      rowCards.forEach((rowCard) => {
        if (rowCard !== card) {
          const otherSpeakers = rowCard.querySelector(`.${styles.speakers}`)
          if (otherSpeakers) {
            // Remove hidden spacer class - CSS will handle the transition
            otherSpeakers.classList.remove(styles.hiddenSpacer)
          }
          
          gsap.to(rowCard, {
            boxShadow: '0 2px 15px rgba(139, 92, 246, 0.08)',
            zIndex: 10,
            duration: 0.3,
            delay: 0.15,  // Same delay for row partners
            ease: 'power2.out'
          })
        }
      })
    }
  }

  return (
    <motion.div className={styles.agendaContent} ref={containerRef}>
      <div className={styles.agendaGrid}>
        {/* Keynote row */}
        <div className={styles.sessionRow}>
          <div
            key={agendaSessions[0].id}
            className={`${styles.sessionCard} ${styles.keynote}`}
            onMouseEnter={(e) => handleMouseEnter(e, 0)}
            onMouseLeave={handleMouseLeave}
          >
            <div className={styles.typeTag}>
              <span className={`${styles.sessionType} ${styles[agendaSessions[0].type.toLowerCase()]}`}>
                {agendaSessions[0].type}
              </span>
            </div>
            <div className={styles.content}>
              <h3 className={styles.title}>{agendaSessions[0].title}</h3>
              <div className={styles.meta}>
                <span className={styles.time}>{agendaSessions[0].time} - {agendaSessions[0].endTime}</span>
              </div>
              <p className={styles.description}>{agendaSessions[0].description}</p>
            </div>
            <div className={styles.speakers}>
              <div className={styles.speakerLabel}>
                SPEAKER
              </div>
              <div className={styles.speakerInfo}>
                <img
                  className={styles.speakerAvatar}
                  src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${agendaSessions[0].speakerSeed}`}
                  alt={agendaSessions[0].speaker}
                  loading="lazy"
                />
                <div className={styles.speakerDetails}>
                  <div className={styles.speakerName}>{agendaSessions[0].speaker}</div>
                  <div className={styles.speakerTitle}>{agendaSessions[0].speakerTitle}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Workshop row */}
        <div className={styles.sessionRow}>
          {agendaSessions.slice(1).map((session, index) => (
            <div
              key={session.id}
              className={styles.sessionCard}
              onMouseEnter={(e) => handleMouseEnter(e, index + 1)}
              onMouseLeave={handleMouseLeave}
            >
              <div className={styles.typeTag}>
                <span className={`${styles.sessionType} ${styles[session.type.toLowerCase()]}`}>
                  {session.type}
                </span>
              </div>
              <div className={styles.content}>
                <h3 className={styles.title}>{session.title}</h3>
                <div className={styles.meta}>
                  <span className={styles.time}>{session.time} - {session.endTime}</span>
                </div>
                <p className={styles.description}>{session.description}</p>
              </div>
              <div className={styles.speakers}>
                <div className={styles.speakerLabel}>
                  MODERATOR
                </div>
                <div className={styles.speakerInfo}>
                  <img
                    className={styles.speakerAvatar}
                    src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${session.speakerSeed}`}
                    alt={session.speaker}
                    loading="lazy"
                  />
                  <div className={styles.speakerDetails}>
                    <div className={styles.speakerName}>{session.speaker}</div>
                    <div className={styles.speakerTitle}>{session.speakerTitle}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default AgendaDemo