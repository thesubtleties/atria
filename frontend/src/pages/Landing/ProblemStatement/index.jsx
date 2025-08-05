import { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import styles from './ProblemStatement.module.css'

gsap.registerPlugin(ScrollTrigger)

const ProblemStatement = () => {
  const containerRef = useRef(null)

  useGSAP(() => {
    let ctx = gsap.context(() => {
      const textElement = containerRef.current?.querySelector('.text-content')
      
      if (!textElement) return
      // Split text into words
      const textContent = "The difference between events people attend and events people remember isn't the content—it's the connections. Most platforms focus on logistics. We focus on relationships."
      const words = textContent.split(' ')
      
      // Create spans for each word
      textElement.innerHTML = words.map((word, index) => {
        // Highlight key words
        const cleanWord = word.replace(/[.,—'']/g, '')
        const isHighlighted = ['remember', 'connections', 'relationships'].includes(cleanWord)
        return `<span class="${styles.word} ${isHighlighted ? styles.highlighted : ''}" data-index="${index}">${word}</span>`
      }).join(' ')

      const wordElements = textElement.querySelectorAll(`.${styles.word}`)

      // Create the scroll-triggered animation
      // This will start when the Hero's drape is almost gone
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top", // Start immediately when it reaches top
          end: "+=150%",
          pin: true,
          pinSpacing: true,
          scrub: 1,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
        }
      })

      // Start with yellow background (revealed by Hero drape)
      gsap.set(containerRef.current, {
        backgroundColor: "#F3EACE" // Light yellow background
      })
      
      // Set initial state for all words
      gsap.set(wordElements, { 
        opacity: 0,
        y: 20,
        color: "#8B5CF6", // Purple for main text
        force3D: true
      })
      
      // Get highlighted words for color animation
      const highlightedWords = textElement.querySelectorAll(`.${styles.highlighted}`)
      
      // Set highlighted words to golden orange
      gsap.set(highlightedWords, {
        color: "#F5AF00", // Golden orange
        fontWeight: "600",
        force3D: true
      })
      
      // Add a small delay before words start appearing
      tl.set({}, {}, 0.5)
      
      // Animate all words in at reading speed
      wordElements.forEach((word, index) => {
        const isHighlighted = word.classList.contains(styles.highlighted)
        
        tl.to(word, {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: isHighlighted ? "power3.out" : "power2.out",
          // Add a slight scale effect to highlighted words
          scale: isHighlighted ? 1.05 : 1,
          force3D: true,
          force3D: true  // GPU acceleration for smoother animation
        }, 0.3 + (index * 0.08)) // Natural reading pace - about 12-13 words per second
      })

      // Transition to off-white purple as words complete
      tl.to(containerRef.current, {
        backgroundColor: "rgb(251, 250, 255)", // Off-white purple - must match PlatformDemo
        duration: 1.2,
        ease: "power2.inOut",
        force3D: true,
        onComplete: () => {
          // Ensure the final color is set precisely
          gsap.set(containerRef.current, { backgroundColor: "rgb(251, 250, 255)", force3D: true })
        }
      }, 2.5) // Start transition near the end of word animations
      
    }, containerRef) // Context scoped to container
    
    // Cleanup function
    return () => {
      ctx.revert() // This will kill all GSAP animations and ScrollTriggers in context
    }
  }, { scope: containerRef })

  return (
    <section ref={containerRef} className={`${styles.problemStatement} problemStatement`}>
      <div className={styles.container}>
        <p className={`${styles.textContent} text-content`}></p>
      </div>
    </section>
  )
}

export default ProblemStatement