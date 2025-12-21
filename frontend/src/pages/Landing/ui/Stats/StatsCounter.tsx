import type { ReactNode } from 'react';
import { useState, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { StatsObject, ScrollTriggerConfig } from '../../types';

gsap.registerPlugin(ScrollTrigger);

type StatsCounterProps = {
  stats?: StatsObject;
  duration?: number;
  ease?: string;
  onUpdate?: (stats: StatsObject) => void;
  scrollTriggerOptions?: ScrollTriggerConfig;
  children: (animatedStats: StatsObject) => ReactNode;
};

const StatsCounter = ({
  stats = {},
  duration = 2.5,
  ease = 'power2.out',
  onUpdate,
  scrollTriggerOptions = {},
  children,
}: StatsCounterProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<StatsObject>({});
  const [animatedStats, setAnimatedStats] = useState<StatsObject>(() => {
    const initial: StatsObject = {};
    Object.keys(stats).forEach((key) => {
      initial[key] = 0;
    });
    return initial;
  });

  useGSAP(
    () => {
      // Initialize stats ref with zeros
      Object.keys(stats).forEach((key) => {
        statsRef.current[key] = 0;
      });

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
              snap: Object.keys(stats).reduce((acc: Record<string, number>, key) => {
                acc[key] = 1;
                return acc;
              }, {}),
              onUpdate: function () {
                const newStats: StatsObject = {};
                Object.keys(stats).forEach((key) => {
                  const value = statsRef.current[key as keyof typeof statsRef.current];
                  newStats[key] = Math.floor(value || 0);
                });
                setAnimatedStats(newStats);
                if (onUpdate) {
                  onUpdate(newStats);
                }
              },
            });
          },
        },
      });

      return () => {
        tl.kill();
      };
    },
    { scope: containerRef, dependencies: [stats, duration, ease] },
  );

  return <div ref={containerRef}>{children(animatedStats)}</div>;
};

export default StatsCounter;
