import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import { useModalManager } from '../shared/useModalManager';
import MagneticButton from '../shared/MagneticButton';
import Footer from '../Footer';
import styles from './CallToAction.module.css';

gsap.registerPlugin(ScrollTrigger);

const CallToAction = () => {
  const { openModal, ModalRenderer } = useModalManager();
  const containerRef = useRef<HTMLElement>(null);
  const primaryRef = useRef<HTMLDivElement>(null);
  const drapeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleSignup = () => {
    openModal('signup');
  };

  useGSAP(() => {
    const container = containerRef.current;
    const drape = drapeRef.current;
    const content = contentRef.current;

    if (!container || !drape || !content) return;

    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

    // Set initial states - no force3D for content in Firefox to preserve centering
    gsap.set(content, { opacity: 0, y: 20, force3D: !isFirefox });
    gsap.set(drape, { y: '-100%', force3D: true });

    // Create the closing drape animation
    ScrollTrigger.create({
      trigger: container,
      start: 'top 115%', // Start animation before section is visible
      end: 'bottom bottom', // End when bottom of container hits bottom of viewport
      scrub: 1,
      markers: false,
      fastScrollEnd: true,
      onUpdate: (self: ScrollTriggerType) => {
        const progress = self.progress;

        // Drape slides down to final position (stops just above footer)
        // Adjust final position based on screen size
        const isMobile = window.innerWidth <= 767;
        const isMacBookAir =
          window.innerWidth >= 1024 && window.innerWidth <= 1680 && window.innerHeight <= 1050;

        let finalPosition = 5; // Desktop default
        if (isMobile)
          finalPosition = -2; // Bring drape up just a touch on mobile
        else if (isMacBookAir) finalPosition = 0; // Bring drape up just barely on MacBook Air

        const drapeY = gsap.utils.interpolate(-100, finalPosition, progress);
        gsap.set(drape, { y: `${drapeY}%`, force3D: true });

        // Content fades in more aggressively
        if (progress > 0.3) {
          const contentProgress = (progress - 0.3) / 0.7;
          gsap.set(content, {
            opacity: contentProgress,
            y: gsap.utils.interpolate(20, 0, contentProgress),
            force3D: true,
          });
        }
      },
    });

    // Primary CTA pulse animation
    if (primaryRef.current) {
      gsap.to(primaryRef.current, {
        scale: 1.05,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        delay: 1,
      });
    }
  });

  return (
    <section ref={containerRef} className={`${styles.finalSection} finalSection`}>
      {/* Purple drape that comes down */}
      <div ref={drapeRef} className={styles.closingDrape}>
        <svg viewBox='0 0 100 100' preserveAspectRatio='none' className={styles.drapeSvg}>
          <path
            d='M0,0 L100,0 L100,94 C93.75,92.2 87.5,96.7 75,94 C62.5,92.2 50,97.8 37.5,95.6 C25,93.3 12.5,97.8 0,94 Z'
            fill='#8B5CF6'
          />
        </svg>

        {/* CTA content on the drape */}
        <div ref={contentRef} className={styles.drapeContent}>
          <div className='cta-header'>
            <h2 className={styles.sectionTitle}>Ready to Transform Your Events?</h2>
            <p className={styles.sectionSubtitle}>
              Join thousands creating meaningful connections every day
            </p>
          </div>

          {/* Primary CTA */}
          <div ref={primaryRef} className={styles.primaryCta}>
            <MagneticButton
              variant='primary'
              className={styles.mainButton || ''}
              magnetStrength={0.4}
              onClick={handleSignup}
            >
              <span className={styles.buttonText}>START YOUR STORY</span>
              <span className={styles.buttonIcon}>→</span>
            </MagneticButton>
            <p className={styles.ctaSubtext}>Free forever for up to 50 attendees</p>
          </div>
        </div>
      </div>

      {/* Footer content */}
      <div className={styles.footerWrapper}>
        <Footer />
      </div>

      {/* Lazy-loaded modals */}
      <ModalRenderer />
    </section>
  );
};

export default CallToAction;
