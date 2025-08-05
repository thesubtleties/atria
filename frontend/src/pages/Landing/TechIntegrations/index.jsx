import { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'motion/react'
import styles from './TechIntegrations.module.css'

gsap.registerPlugin(ScrollTrigger)

const integrations = [
  {
    id: 'vimeo',
    name: 'Vimeo',
    logo: '🎥',
    status: 'active',
    description: 'Professional video streaming'
  },
  {
    id: 'zoom',
    name: 'Zoom',
    logo: '📹',
    status: 'active',
    description: 'Video conferencing'
  },
  {
    id: 'dacast',
    name: 'Dacast',
    logo: '📡',
    status: 'active',
    description: 'Live streaming platform'
  },
  {
    id: 'twitch',
    name: 'Twitch',
    logo: '🎮',
    status: 'coming',
    description: 'Gaming & creative streaming'
  },
  {
    id: 'youtube',
    name: 'YouTube Live',
    logo: '📺',
    status: 'coming',
    description: 'Global video platform'
  },
  {
    id: 'custom',
    name: 'Custom API',
    logo: '🔧',
    status: 'active',
    description: 'Build your own integration'
  }
]

const TechIntegrations = () => {
  const containerRef = useRef(null)
  const carouselRef = useRef(null)

  useGSAP(() => {
    // Set defaults for cleaner code
    gsap.defaults({ duration: 1, ease: 'power2.out' })

    // Header animation
    gsap.from('.integrations-header', {
      opacity: 0,
      y: 50,
      scrollTrigger: {
        trigger: '.integrations-header',
        start: 'top 80%',
        once: true
      }
    })

    // Logo carousel animation
    const logos = carouselRef.current?.querySelectorAll('.integration-logo')
    if (logos) {
      gsap.from(logos, {
        opacity: 0,
        scale: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: carouselRef.current,
          start: 'top 70%',
          once: true
        }
      })

      // Floating animation for logos
      logos.forEach((logo, index) => {
        gsap.to(logo, {
          y: '10px',
          duration: 2 + index * 0.3,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
          delay: index * 0.2
        })
      })
    }


  }, { scope: containerRef })

  return (
    <section ref={containerRef} className={`${styles.techIntegrations} techIntegrations`}>
      <div className={styles.container}>
        <div className="integrations-header">
          <h2 className={styles.sectionTitle}>Always Current, Always Compatible</h2>
          <p className={styles.sectionSubtitle}>
            Best-in-class integrations for virtual experiences
          </p>
        </div>

        {/* Logo Carousel */}
        <div ref={carouselRef} className={styles.logoCarousel}>
          {integrations.map((integration) => (
            <motion.div
              key={integration.id}
              className="integration-logo"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className={`${styles.integrationCard} ${styles[integration.status]}`}>
                <div className={styles.logoEmoji}>{integration.logo}</div>
                <h3 className={styles.integrationName}>{integration.name}</h3>
                <p className={styles.integrationDesc}>{integration.description}</p>
                {integration.status === 'coming' && (
                  <span className={styles.comingSoon}>Coming Soon</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default TechIntegrations