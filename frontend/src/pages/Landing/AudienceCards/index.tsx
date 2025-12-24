import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import { AudienceCard, SectionHeader } from './components';
import { audienceData } from './audienceData';
import styles from './AudienceCards.module.css';

gsap.registerPlugin(ScrollTrigger);

const AudienceCards = () => {
  const containerRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const ctx = gsap.context(() => {
        // Header animation using ref
        if (headerRef.current) {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 80%',
              once: true,
            },
          });

          const title = headerRef.current.querySelector('h2');
          const subtitle = headerRef.current.querySelector('p');

          if (title) {
            tl.to(title, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'power3.out',
              force3D: true,
            });
          }

          if (subtitle) {
            tl.to(
              subtitle,
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: 'power2.out',
                force3D: true,
              },
              '-=0.4',
            );
          }
        }

        // Get cards and wrapper with proper scoping
        const cards =
          containerRef.current ?
            gsap.utils.toArray<HTMLElement>('.audience-card', containerRef.current)
          : [];
        const wrapper = containerRef.current?.querySelector<HTMLDivElement>('.cards-wrapper');

        if (!cards.length || !wrapper) return;

        // Set perspective for 3D effects
        gsap.set(wrapper, { perspective: 1000 });

        // Set initial states for cards
        cards.forEach((card, index) => {
          gsap.set(card, {
            zIndex: cards.length - index,
            transformOrigin: 'center center',
            transformStyle: 'preserve-3d',
            force3D: true,
          });
        });

        // Use ScrollTrigger.batch for better performance
        ScrollTrigger.batch(cards, {
          onEnter: (batch) => {
            gsap.to(batch, {
              opacity: 1,
              x: 0,
              rotateY: 0,
              scale: 1,
              duration: 0.6,
              force3D: true,
              stagger: {
                each: 0.1,
                from: 'start',
              },
              ease: 'power3.out',
              onComplete: function () {
                // Add floating animation after entrance
                batch.forEach((card) => {
                  (card as HTMLElement & { _floatingTween?: gsap.core.Tween })._floatingTween =
                    gsap.to(card, {
                      y: 'random(-5, 5)',
                      x: 'random(-3, 3)',
                      duration: 4,
                      repeat: -1,
                      yoyo: true,
                      ease: 'sine.inOut',
                      force3D: true,
                    });
                });
              },
            });

            // Animate accent bars using div selector
            batch.forEach((card, i) => {
              const accentBar = card.querySelector('div[style*="background"]');
              if (accentBar) {
                gsap.fromTo(
                  accentBar,
                  {
                    scaleX: 0,
                    transformOrigin: 'left center',
                  },
                  {
                    scaleX: 1,
                    duration: 0.4,
                    ease: 'power2.out',
                    delay: i * 0.1 + 0.2,
                    force3D: true,
                  },
                );
              }

              // Animate content - get second div which contains content
              const content = card.querySelectorAll('div')[1];
              if (content) {
                const contentElements = content.children;
                gsap.fromTo(
                  contentElements,
                  {
                    opacity: 0,
                    y: 20,
                  },
                  {
                    opacity: 1,
                    y: 0,
                    duration: 0.3,
                    stagger: 0.05,
                    ease: 'power2.out',
                    delay: i * 0.1 + 0.3,
                    force3D: true,
                  },
                );
              }
            });
          },
          start: 'top bottom-=50',
          batchMax: 3, // Limit batch size for smoother animation
          interval: 0.1,
        });

        // Set initial state for batch animation
        gsap.set(cards, {
          opacity: 0,
          x: (i) => (i % 2 === 0 ? -200 : 200),
          rotateY: (i) => (i % 2 === 0 ? -30 : 30),
          scale: 0.8,
          force3D: true,
        });

        // Smooth parallax scrolling effect
        ScrollTrigger.create({
          trigger: wrapper,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
          onUpdate: (self: ScrollTriggerType) => {
            const progress = self.progress;
            cards.forEach((card, index) => {
              // Subtle parallax based on progress
              gsap.to(card, {
                y: -index * 30 * progress,
                scale: 1 - index * 0.02 * progress,
                duration: 0.3,
                ease: 'power2.out',
                force3D: true,
                overwrite: 'auto',
              });
            });
          },
        });
      }, containerRef); // Context scoped to container

      // Cleanup
      return () => {
        ctx.revert(); // This will kill all GSAP animations and ScrollTriggers in context
      };
    },
    { scope: containerRef },
  );

  return (
    <section ref={containerRef} className={`${styles.audienceCards} audienceCards`}>
      <div className={styles.container}>
        <div ref={headerRef}>
          <SectionHeader />
        </div>

        <div className={`${styles.cardsWrapper} cards-wrapper`}>
          {audienceData.map((audience) => (
            <AudienceCard key={audience.id} audience={audience} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudienceCards;
