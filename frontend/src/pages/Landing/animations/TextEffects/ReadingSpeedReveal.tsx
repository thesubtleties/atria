import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ScrollTriggerConfig } from '../../types';
import styles from './ReadingSpeedReveal.module.css';

gsap.registerPlugin(ScrollTrigger);

type ColorPair = {
  start: string;
  end: string;
};

type ReadingSpeedRevealProps = {
  text?: string;
  highlightWords?: string[];
  readingSpeed?: number;
  backgroundColor?: ColorPair;
  textColor?: {
    regular: ColorPair;
    highlighted: ColorPair;
  };
  highlightGlow?: string;
  scrollTriggerOptions?: ScrollTriggerConfig;
  className?: string;
};

type WordSpanProps = {
  word: string;
  index: number;
  highlightWords: string[];
};

const ReadingSpeedReveal = ({
  text = '',
  highlightWords = [],
  readingSpeed = 0.08,
  backgroundColor = {
    start: '#fbfaff',
    end: '#8b5cf6',
  },
  textColor = {
    regular: { start: '#8b5cf6', end: '#ffffff' },
    highlighted: { start: '#7c3aed', end: '#ffd93d' },
  },
  highlightGlow = '0 0 20px rgba(255, 217, 61, 0.5)',
  scrollTriggerOptions = {},
  className = '',
}: ReadingSpeedRevealProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  // Component for each word span
  const WordSpan = ({ word, index, highlightWords }: WordSpanProps) => {
    const cleanWord = word.replace(/[.,—'']/g, '');
    const isHighlighted = highlightWords.includes(cleanWord);

    return (
      <span
        className={`${styles.word} ${isHighlighted ? styles.highlighted : ''}`}
        data-index={index}
      >
        {word}
      </span>
    );
  };

  useEffect(() => {
    if (!textRef.current || !containerRef.current) return;

    // Capture the current ref value to use in cleanup
    const containerElement = containerRef.current;
    const wordElements = textRef.current.querySelectorAll(`.${styles.word}`);
    const highlightedElements = textRef.current.querySelectorAll(`.${styles.highlighted}`);

    // Create the animation timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerElement,
        start: 'top top',
        end: '+=200%',
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        ...scrollTriggerOptions,
      },
    });

    // Set initial states
    gsap.set(containerElement, { backgroundColor: backgroundColor.start });
    gsap.set(wordElements, {
      opacity: 0,
      y: 20,
      color: textColor.regular.start,
    });
    gsap.set(highlightedElements, {
      color: textColor.highlighted.start,
    });

    // Animate words in
    Array.from(wordElements).forEach((word, index) => {
      if (!word || !(word instanceof HTMLElement)) return;
      const isHighlighted = word.classList.contains(styles.highlighted || '');

      tl.to(
        word,
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: isHighlighted ? 'power3.out' : 'power2.out',
          scale: isHighlighted ? 1.05 : 1,
        },
        index * readingSpeed,
      );
    });

    // Animate background color
    tl.to(
      containerElement,
      {
        backgroundColor: backgroundColor.end,
        duration: 1.2,
        ease: 'power2.inOut',
      },
      0.5,
    );

    // Animate text colors
    tl.to(
      wordElements,
      {
        color: textColor.regular.end,
        duration: 1,
        ease: 'power2.inOut',
      },
      0.7,
    );

    tl.to(
      highlightedElements,
      {
        color: textColor.highlighted.end,
        textShadow: highlightGlow,
        duration: 1,
        ease: 'power2.inOut',
      },
      0.7,
    );

    return () => {
      tl.kill();
      gsap.killTweensOf(wordElements);
      gsap.killTweensOf(containerElement);
    };
  }, [
    text,
    highlightWords,
    readingSpeed,
    backgroundColor,
    textColor,
    highlightGlow,
    scrollTriggerOptions,
  ]);

  const words = text.split(' ');

  return (
    <div ref={containerRef} className={`${styles.container} ${className}`}>
      <p ref={textRef} className={styles.textContent}>
        {words.map((word, index) => {
          const wordStr = typeof word === 'string' ? word : '';
          return (
            <span key={index}>
              <WordSpan word={wordStr} index={index} highlightWords={highlightWords} />
              {index < words.length - 1 && ' '}
            </span>
          );
        })}
      </p>
    </div>
  );
};

export default ReadingSpeedReveal;
