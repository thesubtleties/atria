import { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'motion/react'
import styles from './OpenSourceSplit.module.css'

gsap.registerPlugin(ScrollTrigger)

const panels = [
  {
    id: 'intro',
    type: 'intro',
    title: 'Two Paths, One Vision',
    subtitle: 'Build meaningful connections your way',
    description: 'Whether you value complete control or managed convenience, Atria adapts to your needs',
    gradient: 'radial'
  },
  {
    id: 'opensource',
    type: 'opensource',
    title: 'Open Source Freedom',
    subtitle: 'Built with love, shared with the world',
    description: 'We believe great software should be accessible to everyone. Join hundreds of communities using Atria to create meaningful connections.',
    cta: 'Explore on GitHub',
    ctaIcon: 'github'
  },
  {
    id: 'enterprise',
    type: 'enterprise',
    title: 'Enterprise Solutions',
    subtitle: 'When you need more than software',
    description: 'Get the full power of Atria with enterprise-grade support, custom integrations, and managed hosting options.',
    cta: 'Talk to Sales',
    ctaIcon: 'calendar'
  },
  {
    id: 'philosophy',
    type: 'philosophy',
    title: 'Why Open Source?',
    quote: '"When we share our code, we share our vision."',
    content: 'No vendor lock-in. No hidden algorithms. No surprises. Atria is built by event organizers, for event organizers. Every line of code is yours to inspect, modify, and improve. Your feedback directly shapes our roadmap because transparency isn\'t just a feature—it\'s our foundation.',
    footer: 'Whether you choose open source or enterprise, you\'re joining a movement to make events more human.'
  }
]

const OpenSourceSplit = () => {
  const containerRef = useRef(null)
  const panelsRef = useRef(null)
  const blobsRef = useRef(null)
  const blobsLayer2Ref = useRef(null)
  const horizontalScrollRef = useRef(null)

  useGSAP(() => {
    const container = containerRef.current
    const panelsContainer = panelsRef.current
    
    if (!container || !panelsContainer) return

    const panelElements = gsap.utils.toArray('.panel')
    const totalPanels = panelElements.length
    
    // Create horizontal scroll animation
    horizontalScrollRef.current = gsap.to(panelElements, {
      xPercent: -100 * (totalPanels - 1),
      ease: "none",
      force3D: true,
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: () => `+=${(totalPanels - 1) * window.innerWidth}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        fastScrollEnd: true,
      }
    })
    
    // Parallax animation for blobs - move slower for depth effect
    if (blobsRef.current) {
      gsap.to(blobsRef.current, {
        xPercent: -100 * (totalPanels - 1) * 0.5, // Move at half speed
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: () => `+=${(totalPanels - 1) * window.innerWidth}`,
          scrub: 1,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
        }
      })
    }
    
    // Second layer parallax - move even slower for more depth
    if (blobsLayer2Ref.current) {
      gsap.to(blobsLayer2Ref.current, {
        xPercent: -100 * (totalPanels - 1) * 0.4, // Move at 40% speed
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: () => `+=${(totalPanels - 1) * window.innerWidth}`,
          scrub: 1,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
        }
      })
    }

    // Animate content as panels come into view
    panelElements.forEach((panel, i) => {
      // Panel content fade in
      const content = panel.querySelector('.panel-content')
      if (content) {
        gsap.from(content, {
          opacity: 0,
          y: 100,
          force3D: true,
          scrollTrigger: {
            trigger: panel,
            containerAnimation: horizontalScrollRef.current,
            start: "left center",
            end: "center center",
            scrub: 1,
            id: `panel-content-${i}`,
          }
        })
      }

      // Feature items stagger
      const features = panel.querySelectorAll('.feature-item')
      if (features.length > 0) {
        gsap.from(features, {
          opacity: 0,
          x: 50,
          stagger: 0.1,
          force3D: true,
          scrollTrigger: {
            trigger: panel,
            containerAnimation: horizontalScrollRef.current,
            start: "left 40%",
            end: "center center",
            scrub: 1,
          }
        })
      }

    })

    // Add velocity-based effects
    ScrollTrigger.addEventListener("scrollEnd", () => {
      console.log("Scroll ended")
    })

  }, { scope: containerRef })

  const renderPanel = (panel) => {
    switch(panel.type) {
      case 'intro':
        return (
          <div className={`${styles.panel} ${styles.introPanel} panel`} key={panel.id}>
            <div className={`${styles.panelContent} panel-content`}>
              <h2 className={styles.introTitle}>{panel.title}</h2>
              <p className={styles.introSubtitle}>{panel.subtitle}</p>
              {panel.description && (
                <p className={styles.introDescription}>{panel.description}</p>
              )}
              <motion.div 
                className={styles.scrollIndicator}
                animate={{ x: [0, 20, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span>Explore your options</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
            </div>
          </div>
        )

      case 'opensource':
      case 'enterprise':
        return (
          <div className={`${styles.panel} ${styles[panel.type + 'Panel']} panel`} key={panel.id}>
            <div className={`${styles.panelContent} panel-content`}>
              <div className={styles.contentWrapper}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>{panel.title}</h3>
                  <p className={styles.panelSubtitle}>{panel.subtitle}</p>
                  {panel.description && (
                    <p className={styles.panelDescription}>{panel.description}</p>
                  )}
                </div>

                <motion.button 
                  className={`${styles.ctaButton} ${panel.type === 'enterprise' ? styles.enterpriseButton : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {panel.ctaIcon === 'github' && (
                    <svg className={styles.githubIcon} width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.17 20 14.42 20 10c0-5.523-4.477-10-10-10z" />
                    </svg>
                  )}
                  {panel.cta}
                </motion.button>
              </div>
            </div>
            
          </div>
        )

      case 'philosophy':
        return (
          <div className={`${styles.panel} ${styles.philosophyPanel} panel`} key={panel.id}>
            <div className={`${styles.panelContent} panel-content`}>
              <div className={styles.magazineLayout}>
                <motion.h3 
                  className={styles.philosophyTitle}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  {panel.title}
                </motion.h3>
                
                {panel.quote && (
                  <motion.p 
                    className={styles.philosophyQuote}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                  >
                    {panel.quote}
                  </motion.p>
                )}
                
                <motion.div 
                  className={styles.philosophyContent}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  <p>{panel.content}</p>
                </motion.div>
                
                {panel.footer && (
                  <motion.p 
                    className={styles.philosophyFooter}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {panel.footer}
                  </motion.p>
                )}
              </div>
            </div>
            
          </div>
        )

      default:
        return null
    }
  }

  return (
    <section ref={containerRef} className={`${styles.openSourceSplit} openSourceSplit`}>
      {/* Second layer of blobs - moves slower */}
      <div ref={blobsLayer2Ref} className={styles.floatingBlobsLayer2}>
        <div className={`${styles.blob2Layer} ${styles.blob2_1}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_2}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_3}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_4}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_5}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_6}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_7}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_8}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_9}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_10}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_11}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_12}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_13}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_14}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_15}`} />
      </div>
      
      {/* First layer of blobs - moves at medium speed */}
      <div ref={blobsRef} className={styles.floatingBlobs}>
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <div className={`${styles.blob} ${styles.blob3}`} />
        <div className={`${styles.blob} ${styles.blob4}`} />
        <div className={`${styles.blob} ${styles.blob5}`} />
        <div className={`${styles.blob} ${styles.blob6}`} />
        <div className={`${styles.blob} ${styles.blob7}`} />
        <div className={`${styles.blob} ${styles.blob8}`} />
        <div className={`${styles.blob} ${styles.blob9}`} />
        <div className={`${styles.blob} ${styles.blob10}`} />
        <div className={`${styles.blob} ${styles.blob11}`} />
        <div className={`${styles.blob} ${styles.blob12}`} />
        <div className={`${styles.blob} ${styles.blob13}`} />
        <div className={`${styles.blob} ${styles.blob14}`} />
        <div className={`${styles.blob} ${styles.blob15}`} />
        <div className={`${styles.blob} ${styles.blob16}`} />
        <div className={`${styles.blob} ${styles.blob17}`} />
        <div className={`${styles.blob} ${styles.blob18}`} />
        <div className={`${styles.blob} ${styles.blob19}`} />
        <div className={`${styles.blob} ${styles.blob20}`} />
        <div className={`${styles.blob} ${styles.blob21}`} />
        <div className={`${styles.blob} ${styles.blob22}`} />
      </div>
      
      <div ref={panelsRef} className={styles.panelsContainer}>
        {panels.map(panel => renderPanel(panel))}
      </div>
    </section>
  )
}

export default OpenSourceSplit