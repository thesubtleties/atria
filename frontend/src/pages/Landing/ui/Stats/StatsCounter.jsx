import { useState, useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const StatsCounter = ({
  stats = {},
  duration = 2.5,
  ease = 'power2.out',
  onUpdate,
  scrollTriggerOptions = {},
  children
}) => {
  const containerRef = useRef(null)
  const statsRef = useRef({})
  const [animatedStats, setAnimatedStats] = useState(() => {
    const initial = {}
    Object.keys(stats).forEach(key => {
      initial[key] = 0
    })
    return initial
  })

  useGSAP(() => {
    // Initialize stats ref with zeros
    Object.keys(stats).forEach(key => {
      statsRef.current[key] = 0
    })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 50%',
        once: true,
        ...scrollTriggerOptions,
        onEnter: () => {
          // Count up animation
          gsap.to(statsRef.current, {
            ...stats,
            duration,
            ease,
            snap: Object.keys(stats).reduce((acc, key) => {
              acc[key] = 1
              return acc
            }, {}),
            onUpdate: function() {
              const newStats = {}
              Object.keys(stats).forEach(key => {
                newStats[key] = Math.floor(statsRef.current[key])
              })
              setAnimatedStats(newStats)
              if (onUpdate) {
                onUpdate(newStats)
              }
            }
          })
        }
      }
    })

    return () => {
      tl.kill()
    }
  }, { scope: containerRef, dependencies: [stats, duration, ease] })

  return (
    <div ref={containerRef}>
      {children(animatedStats)}
    </div>
  )
}

export default StatsCounter