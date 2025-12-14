import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(ScrambleTextPlugin);

const ScrambleText = ({
  words = [],
  interval = 3000,
  className = '',
  duration = 1,
  scrambleOptions = {
    chars: 'lowerCase',
    speed: 0.6,
  },
}) => {
  const textRef = useRef(null);

  useEffect(() => {
    if (!words.length || !textRef.current) return;

    // Capture the current ref value to use in cleanup
    const textElement = textRef.current;
    let wordIndex = 0;

    const scrambleAnimation = () => {
      wordIndex = (wordIndex + 1) % words.length;
      gsap.to(textElement, {
        duration,
        scrambleText: {
          text: words[wordIndex],
          ...scrambleOptions,
        },
      });
    };

    const intervalHandle = setInterval(scrambleAnimation, interval);

    return () => {
      clearInterval(intervalHandle);
      gsap.killTweensOf(textElement);
    };
  }, [words, interval, duration, scrambleOptions]);

  return (
    <span ref={textRef} className={className}>
      {words[0] || ''}
    </span>
  );
};

export default ScrambleText;
