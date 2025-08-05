import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import styles from './MagneticButton.module.css'

const MagneticButton = ({ 
  children, 
  variant = 'primary',
  onClick,
  className = '',
  magnetStrength = 0.3,
  ...props 
}) => {
  const buttonRef = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return

    const { left, top, width, height } = buttonRef.current.getBoundingClientRect()
    const centerX = left + width / 2
    const centerY = top + height / 2

    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY

    // Calculate distance from center
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
    const maxDistance = width

    // Only apply magnetic effect within range
    if (distance < maxDistance) {
      const strength = 1 - (distance / maxDistance)
      setPosition({
        x: distanceX * magnetStrength * strength,
        y: distanceY * magnetStrength * strength
      })
    }
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  return (
    <motion.button
      ref={buttonRef}
      className={`${styles.button} ${styles[variant]} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{
        x: position.x,
        y: position.y
      }}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 15,
        mass: 0.5
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      <span className={styles.content}>{children}</span>
      <motion.div
        className={styles.glow}
        animate={{
          opacity: position.x !== 0 || position.y !== 0 ? 0.3 : 0
        }}
      />
    </motion.button>
  )
}

export default MagneticButton