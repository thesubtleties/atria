import { useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'motion/react'
import styles from './ConnectionImpact.module.css'

gsap.registerPlugin(ScrollTrigger)

const ConnectionImpact = () => {
  const containerRef = useRef(null)
  const tlRef = useRef(null)
  const statsRef = useRef({ connections: 0, events: 0, returnRate: 0 })
  const [animatedStats, setAnimatedStats] = useState({
    connections: 0,
    events: 0,
    returnRate: 0
  })

  useGSAP(() => {

    // Header animation
    gsap.from('.impact-header', {
      opacity: 0,
      y: 50,
      duration: 1,
      scrollTrigger: {
        trigger: '.impact-header',
        start: 'top 80%',
        once: true
      }
    })

    // Animate stats counting up
    const stats = {
      connections: 12847,
      events: 523,
      returnRate: 87
    }

    tlRef.current = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 50%',
        once: true,
        onEnter: () => {
          // Count up animation
          gsap.to(statsRef.current, {
            connections: stats.connections,
            events: stats.events,
            returnRate: stats.returnRate,
            duration: 2.5,
            ease: 'power2.out',
            snap: { connections: 1, events: 1, returnRate: 1 },
            onUpdate: function() {
              setAnimatedStats({
                connections: Math.floor(statsRef.current.connections),
                events: Math.floor(statsRef.current.events),
                returnRate: Math.floor(statsRef.current.returnRate)
              })
            }
          })
        }
      }
    })

    // Animate network visualization using scoped selectors
    const nodes = gsap.utils.toArray('.network-node')
    const connections = gsap.utils.toArray('.network-connection')

    if (nodes.length && connections.length) {
      gsap.set(connections, { opacity: 0, scale: 0 })
      gsap.set(nodes, { opacity: 0, scale: 0 })

      tlRef.current.to(nodes, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.7)'
      })
      .to(connections, {
        opacity: 0.3,
        scale: 1,
        duration: 0.8,
        stagger: 0.05,
        ease: 'power2.out'
      }, '-=0.4')
    }

    // Testimonial animation
    gsap.from('.testimonial-card', {
      opacity: 0,
      y: 50,
      duration: 1,
      scrollTrigger: {
        trigger: '.testimonial-card',
        start: 'top 80%',
        once: true
      }
    })

  }, { scope: containerRef })

  return (
    <section ref={containerRef} className={`${styles.connectionImpact} connectionImpact`}>
      <div className={styles.container}>
        <div className="impact-header">
          <h2 className={styles.sectionTitle}>Where Relationships Begin</h2>
          <p className={styles.sectionSubtitle}>
            Real connections that last beyond the event
          </p>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <motion.div 
            className={styles.statCard}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            viewport={{ once: true }}
          >
            <div className={styles.statNumber}>
              {animatedStats.connections.toLocaleString()}
            </div>
            <div className={styles.statLabel}>connections made</div>
            <div className={styles.statIcon}>🤝</div>
          </motion.div>

          <motion.div 
            className={styles.statCard}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className={styles.statNumber}>
              {animatedStats.events.toLocaleString()}
            </div>
            <div className={styles.statLabel}>events powered</div>
            <div className={styles.statIcon}>🎉</div>
          </motion.div>

          <motion.div 
            className={styles.statCard}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className={styles.statNumber}>
              {animatedStats.returnRate}%
            </div>
            <div className={styles.statLabel}>return rate for networking</div>
            <div className={styles.statIcon}>📈</div>
          </motion.div>
        </div>

        {/* Network Visualization */}
        <div className={styles.networkVisualization}>
          <svg viewBox="0 0 800 400" className={styles.networkSvg}>
            {/* Connections */}
            <line className="network-connection" x1="200" y1="200" x2="400" y2="100" stroke="var(--color-primary)" strokeWidth="2" />
            <line className="network-connection" x1="400" y1="100" x2="600" y2="150" stroke="var(--color-primary)" strokeWidth="2" />
            <line className="network-connection" x1="200" y1="200" x2="300" y2="300" stroke="var(--color-primary)" strokeWidth="2" />
            <line className="network-connection" x1="300" y1="300" x2="500" y2="280" stroke="var(--color-primary)" strokeWidth="2" />
            <line className="network-connection" x1="400" y1="100" x2="500" y2="280" stroke="var(--color-primary)" strokeWidth="2" />
            <line className="network-connection" x1="600" y1="150" x2="500" y2="280" stroke="var(--color-primary)" strokeWidth="2" />
            
            {/* Nodes */}
            <circle className="network-node" cx="200" cy="200" r="40" fill="var(--color-primary)" />
            <circle className="network-node" cx="400" cy="100" r="35" fill="var(--color-accent-yellow)" />
            <circle className="network-node" cx="600" cy="150" r="30" fill="var(--color-primary)" />
            <circle className="network-node" cx="300" cy="300" r="35" fill="var(--color-accent-yellow)" />
            <circle className="network-node" cx="500" cy="280" r="45" fill="var(--color-primary)" />
            
            {/* Profile avatars */}
            <text x="200" y="210" textAnchor="middle" fill="white" fontSize="20">👤</text>
            <text x="400" y="110" textAnchor="middle" fill="black" fontSize="20">👥</text>
            <text x="600" y="160" textAnchor="middle" fill="white" fontSize="20">👤</text>
            <text x="300" y="310" textAnchor="middle" fill="black" fontSize="20">👥</text>
            <text x="500" y="290" textAnchor="middle" fill="white" fontSize="25">🌟</text>
          </svg>
          
          <motion.div 
            className={styles.networkLabel}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <p>Every connection has a story</p>
          </motion.div>
        </div>

        {/* Testimonial */}
        <motion.div 
          className="testimonial-card"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className={styles.testimonialCard}>
            <div className={styles.quoteIcon}>"</div>
            <p className={styles.testimonialText}>
              I met my co-founder at a conference using Atria. The Green Light system made it easy to know who was open to networking, and the icebreaker suggestions helped start a conversation that changed my life.
            </p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar}>SC</div>
              <div className={styles.authorInfo}>
                <div className={styles.authorName}>Sarah Chen</div>
                <div className={styles.authorTitle}>CEO & Co-founder, TechStart</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Background decoration */}
        <div className={styles.backgroundDecoration}>
          <motion.div 
            className={styles.floatingCircle1}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className={styles.floatingCircle2}
            animate={{
              y: [0, 20, 0],
              x: [0, -30, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>
    </section>
  )
}

export default ConnectionImpact