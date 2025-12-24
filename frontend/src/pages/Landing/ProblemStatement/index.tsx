import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './ProblemStatement.module.css';

gsap.registerPlugin(ScrollTrigger);

type WordSpanProps = {
  word: string;
  index: number;
};

const ProblemStatement = () => {
  const containerRef = useRef<HTMLElement>(null);
  const textContent =
    "The difference between events people attend and events people remember isn't the content—it's the connections. Most platforms focus on logistics. We focus on relationships.";
  const words = textContent.split(' ');

  // Component for each word span
  const WordSpan = ({ word, index }: WordSpanProps) => {
    const cleanWord = word.replace(/[.,—'']/g, '');
    const isHighlighted = ['remember', 'connections', 'relationships'].includes(cleanWord);

    return (
      <span
        className={`${styles.word} ${isHighlighted && styles.highlighted ? styles.highlighted : ''}`}
        data-index={index}
      >
        {word}
      </span>
    );
  };

  useGSAP(
    () => {
      const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

      const ctx = gsap.context(() => {
        const textElement = containerRef.current?.querySelector('.text-content');

        if (!textElement) return;

        const wordElements = textElement.querySelectorAll(`.${styles.word}`);

        // Create the scroll-triggered animation
        // This will start when the Hero's drape is almost gone
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top', // Start immediately when it reaches top
            end: '+=150%',
            pin: true,
            pinSpacing: true,
            scrub: 1,
            invalidateOnRefresh: true,
            fastScrollEnd: true,
          },
        });

        // Start with yellow background (revealed by Hero drape)
        gsap.set(containerRef.current, {
          backgroundColor: '#F3EACE', // Light yellow background
        });

        // Set initial state for all words
        gsap.set(wordElements, {
          opacity: 0,
          y: 20,
          color: '#8B5CF6', // Purple for main text
          force3D: !isFirefox, // Avoid force3D in Firefox for better text rendering
        });

        // Get highlighted words for color animation
        const highlightedWords = textElement.querySelectorAll(`.${styles.highlighted}`);

        // Set highlighted words to golden orange
        gsap.set(highlightedWords, {
          color: '#F5AF00', // Golden orange
          fontWeight: '600',
          force3D: !isFirefox, // Avoid force3D in Firefox for better text rendering
        });

        // Add a small delay before words start appearing
        tl.set({}, {}, 0.5);

        // Animate all words in at reading speed
        wordElements.forEach((word, index) => {
          const isHighlighted =
            styles.highlighted ? word.classList.contains(styles.highlighted) : false;

          tl.to(
            word,
            {
              opacity: 1,
              y: 0,
              duration: 0.3,
              ease: isHighlighted ? 'power3.out' : 'power2.out',
              // Add a slight scale effect to highlighted words
              scale: isHighlighted ? 1.05 : 1,
              force3D: !isFirefox, // Better text rendering in Firefox without force3D
            },
            0.3 + index * 0.08,
          ); // Natural reading pace - about 12-13 words per second
        });

        // Transition to off-white purple as words complete
        tl.to(
          containerRef.current,
          {
            backgroundColor: 'rgb(251, 250, 255)', // Off-white purple - must match PlatformDemo
            duration: 1.2,
            ease: 'power2.inOut',
            force3D: false, // Don't use force3D on background color transitions
            onComplete: () => {
              // Ensure the final color is set precisely
              gsap.set(containerRef.current, { backgroundColor: 'rgb(251, 250, 255)' });
            },
          },
          2.5,
        ); // Start transition near the end of word animations
      }, containerRef); // Context scoped to container

      // Cleanup function
      return () => {
        ctx.revert(); // This will kill all GSAP animations and ScrollTriggers in context
      };
    },
    { scope: containerRef },
  );

  return (
    <section ref={containerRef} className={`${styles.problemStatement} problemStatement`}>
      <div className={styles.container}>
        <p className={`${styles.textContent} text-content`}>
          {words.map((word, index) => (
            <span key={index}>
              <WordSpan word={word} index={index} />
              {index < words.length - 1 && ' '}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
};

export default ProblemStatement;
