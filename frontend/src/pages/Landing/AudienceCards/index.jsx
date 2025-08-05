import { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'motion/react'
import styles from './AudienceCards.module.css'

gsap.registerPlugin(ScrollTrigger)

const audienceData = [
  {
    id: 'corporate',
    title: 'Enterprise Conferences',
    description: 'Advanced controls, custom branding, enterprise security',
    features: 'Multi-day events, sponsor management, detailed analytics',
    color: '#8B5CF6', // Purple
    accent: 'purple'
  },
  {
    id: 'single-session',
    title: 'Single Session Events',
    description: 'Galas, luncheons, fundraisers - polish without complexity',
    features: 'Streamlined check-in, instant setup, uncluttered experience',
    color: '#10B981', // Green
    accent: 'green'
  },
  {
    id: 'gaming',
    title: 'Creator Platforms',
    description: 'Discord alternative with your own domain',
    features: 'Custom chat rooms, streaming integration, community ownership',
    color: '#EF4444', // Red
    accent: 'red'
  },
  {
    id: 'weddings',
    title: 'Include Everyone',
    description: 'Special moments, even from afar',
    features: 'Virtual attendance, live streaming, guest interaction',
    color: '#EC4899', // Pink
    accent: 'pink'
  },
  {
    id: 'nonprofit',
    title: 'Community Building',
    description: 'Professional networking for any budget',
    features: 'Fundraising integration, volunteer coordination, member engagement',
    color: '#FDE047', // Yellow
    accent: 'yellow'
  }
]

const AudienceCards = () => {
  const containerRef = useRef(null)
  const headerRef = useRef(null)

  useGSAP(() => {
    let ctx = gsap.context(() => {
      // Header animation using ref
      if (headerRef.current) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 80%',
            once: true
          }
        })
        
        tl.to(headerRef.current.querySelector(`.${styles.sectionTitle}`), {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          force3D: true
        })
        .to(headerRef.current.querySelector(`.${styles.sectionSubtitle}`), {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          force3D: true
        }, '-=0.4')
      }

      // Get cards and wrapper with proper scoping
      const cards = containerRef.current ? gsap.utils.toArray('.audience-card', containerRef.current) : []
      const wrapper = containerRef.current?.querySelector('.cards-wrapper')
      
      if (!cards.length || !wrapper) return

      // Set perspective for 3D effects
      gsap.set(wrapper, { perspective: 1000 })
      
      // Set initial states for cards
      cards.forEach((card, index) => {
        gsap.set(card, {
          zIndex: cards.length - index,
          transformOrigin: 'center center',
          transformStyle: "preserve-3d",
          force3D: true
        })
      })

      // Use ScrollTrigger.batch for better performance
      ScrollTrigger.batch(cards, {
        onEnter: (batch) => {
          gsap.to(batch, {
            opacity: 1,
            x: 0,
            rotateY: 0,
            scale: 1,
            duration: 0.6,
            force3D: true,
            stagger: {
              each: 0.1,
              from: "start"
            },
            ease: "power3.out",
            onComplete: function() {
              // Add floating animation after entrance
              batch.forEach(card => {
                card._floatingTween = gsap.to(card, {
                  y: "random(-5, 5)",
                  x: "random(-3, 3)",
                  duration: 4,
                  repeat: -1,
                  yoyo: true,
                  ease: "sine.inOut",
                  force3D: true
                })
              })
            }
          })
          
          // Animate accent bars
          batch.forEach((card, i) => {
            const accentBar = card.querySelector(`.${styles.accentBar}`)
            gsap.fromTo(accentBar, {
              scaleX: 0,
              transformOrigin: "left center"
            }, {
              scaleX: 1,
              duration: 0.4,
              ease: "power2.out",
              delay: i * 0.1 + 0.2,
              force3D: true
            })
            
            // Animate content
            const content = card.querySelector(`.${styles.cardContent}`)
            const contentElements = content.children
            gsap.fromTo(contentElements, {
              opacity: 0,
              y: 20
            }, {
              opacity: 1,
              y: 0,
              duration: 0.3,
              stagger: 0.05,
              ease: "power2.out",
              delay: i * 0.1 + 0.3,
              force3D: true
            })
          })
        },
        start: "top bottom-=50",
        batchMax: 3,  // Limit batch size for smoother animation
        interval: 0.1
      })

      // Set initial state for batch animation
      gsap.set(cards, {
        opacity: 0,
        x: (i) => i % 2 === 0 ? -200 : 200,
        rotateY: (i) => i % 2 === 0 ? -30 : 30,
        scale: 0.8,
        force3D: true
      })

      // Smooth parallax scrolling effect
      ScrollTrigger.create({
        trigger: wrapper,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress
          cards.forEach((card, index) => {
            // Subtle parallax based on progress
            gsap.to(card, {
              y: -index * 30 * progress,
              scale: 1 - (index * 0.02 * progress),
              duration: 0.3,
              ease: "power2.out",
              force3D: true,
              overwrite: "auto"
            })
          })
        }
      })
      
    }, containerRef) // Context scoped to container
    
    // Cleanup
    return () => {
      ctx.revert() // This will kill all GSAP animations and ScrollTriggers in context
    }
  }, { scope: containerRef })

  return (
    <section ref={containerRef} className={`${styles.audienceCards} audienceCards`}>
      <div className={styles.container}>
        <div ref={headerRef} className="audience-header">
          <h2 className={styles.sectionTitle}>One Platform, Unlimited Possibilities</h2>
          <p className={styles.sectionSubtitle}>
            Flexible solutions that adapt to your unique needs
          </p>
        </div>

        <div className={`${styles.cardsWrapper} cards-wrapper`}>
          {audienceData.map((audience, index) => (
            <div
              key={audience.id}
              className={`${styles.audienceCard} ${styles[audience.accent]} audience-card`}
            >
              <div 
                className={styles.accentBar}
                style={{ backgroundColor: audience.color }}
              />
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{audience.title}</h3>
                <p className={styles.cardDescription}>{audience.description}</p>
                <p className={styles.cardFeatures}>{audience.features}</p>
                <div className={styles.cardCta}>
                  <span className={styles.ctaText}>Learn more</span>
                  <svg 
                    className={styles.ctaArrow}
                    width="20" 
                    height="20" 
                    viewBox="0 0 20 20" 
                    fill="none"
                  >
                    <path 
                      d="M7.5 5L12.5 10L7.5 15" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div className={styles.cardBackground}>
                <div className={styles.backgroundPattern} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default AudienceCards