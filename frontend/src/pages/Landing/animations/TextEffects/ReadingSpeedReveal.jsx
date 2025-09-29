import React, { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import styles from './ReadingSpeedReveal.module.css'

gsap.registerPlugin(ScrollTrigger)

const ReadingSpeedReveal = ({
  text = '',
  highlightWords = [],
  readingSpeed = 0.08, // seconds per word
  backgroundColor = {
    start: '#fbfaff',
    end: '#8b5cf6'
  },
  textColor = {
    regular: { start: '#8b5cf6', end: '#ffffff' },
    highlighted: { start: '#7c3aed', end: '#ffd93d' }
  },
  highlightGlow = '0 0 20px rgba(255, 217, 61, 0.5)',
  scrollTriggerOptions = {},
  className = ''
}) => {
  const containerRef = useRef(null)
  const textRef = useRef(null)
  
  // Component for each word span  
  const WordSpan = ({ word, index }) => {
    const cleanWord = word.replace(/[.,—'']/g, '')
    const isHighlighted = highlightWords.includes(cleanWord)
    
    return (
      <span 
        className={`${styles.word} ${isHighlighted ? styles.highlighted : ''}`}
        data-index={index}
      >
        {word}
      </span>
    )
  }

  useEffect(() => {
    if (!textRef.current || !containerRef.current) return

    // Capture the current ref value to use in cleanup
    const containerElement = containerRef.current
    const wordElements = textRef.current.querySelectorAll(`.${styles.word}`)
    const highlightedElements = textRef.current.querySelectorAll(`.${styles.highlighted}`)

    // Create the animation timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerElement,
        start: "top top",
        end: "+=200%",
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        ...scrollTriggerOptions
      }
    })

    // Set initial states
    gsap.set(containerElement, { backgroundColor: backgroundColor.start })
    gsap.set(wordElements, { 
      opacity: 0,
      y: 20,
      color: textColor.regular.start
    })
    gsap.set(highlightedElements, {
      color: textColor.highlighted.start
    })

    // Animate words in
    wordElements.forEach((word, index) => {
      const isHighlighted = word.classList.contains(styles.highlighted)
      
      tl.to(word, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: isHighlighted ? "power3.out" : "power2.out",
        scale: isHighlighted ? 1.05 : 1,
      }, index * readingSpeed)
    })

    // Animate background color
    tl.to(containerElement, {
      backgroundColor: backgroundColor.end,
      duration: 1.2,
      ease: "power2.inOut"
    }, 0.5)

    // Animate text colors
    tl.to(wordElements, {
      color: textColor.regular.end,
      duration: 1,
      ease: "power2.inOut"
    }, 0.7)

    tl.to(highlightedElements, {
      color: textColor.highlighted.end,
      textShadow: highlightGlow,
      duration: 1,
      ease: "power2.inOut"
    }, 0.7)

    return () => {
      tl.kill()
      gsap.killTweensOf(wordElements)
      gsap.killTweensOf(containerElement)
    }
  }, [text, highlightWords, readingSpeed, backgroundColor, textColor, highlightGlow, scrollTriggerOptions])

  const words = text.split(' ')
  
  return (
    <div ref={containerRef} className={`${styles.container} ${className}`}>
      <p ref={textRef} className={styles.textContent}>
        {words.map((word, index) => (
          <React.Fragment key={index}>
            <WordSpan word={word} index={index} />
            {index < words.length - 1 && ' '}
          </React.Fragment>
        ))}
      </p>
    </div>
  )
}

export default ReadingSpeedReveal