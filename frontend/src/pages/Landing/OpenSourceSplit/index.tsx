import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { IntroPanel, OptionPanel, PhilosophyPanel } from './components';
import styles from './OpenSourceSplit.module.css';

gsap.registerPlugin(ScrollTrigger);

type Panel = {
  id: string;
  type: 'intro' | 'opensource' | 'enterprise' | 'philosophy';
  title: string;
  subtitle?: string;
  description?: string;
  gradient?: string;
  cta?: string;
  ctaIcon?: 'github' | 'calendar';
  quote?: string;
  content?: string;
  footer?: string;
};

const panels: Panel[] = [
  {
    id: 'intro',
    type: 'intro',
    title: 'Two Paths, One Vision',
    subtitle: 'Build meaningful connections your way',
    description:
      'Whether you value complete control or managed convenience, Atria adapts to your needs',
    gradient: 'radial',
  },
  {
    id: 'opensource',
    type: 'opensource',
    title: 'Open Source Freedom',
    subtitle: 'Built with love, shared with the world',
    description:
      'We believe great software should be accessible to everyone. Join hundreds of communities using Atria to create meaningful connections.',
    cta: 'Explore on GitHub',
    ctaIcon: 'github',
  },
  {
    id: 'enterprise',
    type: 'enterprise',
    title: 'Enterprise Solutions',
    subtitle: 'When you need more than software',
    description:
      'Get the full power of Atria with enterprise-grade support, custom integrations, and managed hosting options.',
    cta: 'Talk to Sales',
    ctaIcon: 'calendar',
  },
  {
    id: 'philosophy',
    type: 'philosophy',
    title: 'Why Open Source?',
    quote: '"When we share our code, we share our vision."',
    content:
      "No vendor lock-in. No hidden algorithms. No surprises. Atria is built by event organizers, for event organizers. Every line of code is yours to inspect, modify, and improve. Your feedback directly shapes our roadmap because transparency isn't just a feature, it's our foundation.",
    footer:
      "Whether you choose open source or enterprise, you're joining a movement to make events more human.",
  },
];

const OpenSourceSplit = () => {
  const containerRef = useRef<HTMLElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const blobsRef = useRef<HTMLDivElement>(null);
  const blobsLayer2Ref = useRef<HTMLDivElement>(null);
  const horizontalScrollRef = useRef<gsap.core.Tween | null>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      const panelsContainer = panelsRef.current;

      if (!container || !panelsContainer) return;

      const panelElements = gsap.utils.toArray<HTMLElement>('.panel');
      const totalPanels = panelElements.length;

      // Create horizontal scroll animation
      const tween = gsap.to(panelElements, {
        xPercent: -100 * (totalPanels - 1),
        ease: 'none',
        force3D: true,
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: () => `+=${(totalPanels - 1) * window.innerWidth}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
          preventOverlaps: true,
        },
      });
      horizontalScrollRef.current = tween;

      // Parallax animation for blobs - move slower for depth effect
      if (blobsRef.current) {
        gsap.to(blobsRef.current, {
          xPercent: -100 * (totalPanels - 1) * 0.5, // Move at half speed
          ease: 'none',
          force3D: true,
          scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: () => `+=${(totalPanels - 1) * window.innerWidth}`,
            scrub: 1,
            invalidateOnRefresh: true,
            fastScrollEnd: true,
          },
        });
      }

      // Second layer parallax - move even slower for more depth
      if (blobsLayer2Ref.current) {
        gsap.to(blobsLayer2Ref.current, {
          xPercent: -100 * (totalPanels - 1) * 0.4, // Move at 40% speed
          ease: 'none',
          force3D: true,
          scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: () => `+=${(totalPanels - 1) * window.innerWidth}`,
            scrub: 1,
            invalidateOnRefresh: true,
            fastScrollEnd: true,
          },
        });
      }

      // Animate content as panels come into view
      panelElements.forEach((panel, i) => {
        // Panel content fade in
        const content = panel.querySelector('.panel-content');
        if (content) {
          gsap.from(content, {
            opacity: 0,
            y: 100,
            force3D: true,
            scrollTrigger: {
              trigger: panel,
              ...(horizontalScrollRef.current ?
                { containerAnimation: horizontalScrollRef.current }
              : {}),
              start: 'left center',
              end: 'center center',
              scrub: 1,
              id: `panel-content-${i}`,
            } as ScrollTrigger.Vars,
          });
        }

        // Feature items stagger
        const features = panel.querySelectorAll('.feature-item');
        if (features.length > 0) {
          gsap.from(features, {
            opacity: 0,
            x: 50,
            stagger: 0.1,
            force3D: true,
            scrollTrigger: {
              trigger: panel,
              ...(horizontalScrollRef.current ?
                { containerAnimation: horizontalScrollRef.current }
              : {}),
              start: 'left 40%',
              end: 'center center',
              scrub: 1,
            } as ScrollTrigger.Vars,
          });
        }
      });

      // Add velocity-based effects
      ScrollTrigger.addEventListener('scrollEnd', () => {
        console.log('Scroll ended');
      });
    },
    { scope: containerRef },
  );

  const renderPanel = (panel: Panel) => {
    switch (panel.type) {
      case 'intro':
        return (
          <IntroPanel
            key={panel.id}
            title={panel.title}
            subtitle={panel.subtitle ?? ''}
            {...(panel.description ? { description: panel.description } : {})}
          />
        );

      case 'opensource':
      case 'enterprise':
        return (
          <OptionPanel
            key={panel.id}
            type={panel.type}
            title={panel.title}
            subtitle={panel.subtitle ?? ''}
            {...(panel.description ? { description: panel.description } : {})}
            {...(panel.cta ? { cta: panel.cta } : {})}
            {...(panel.ctaIcon ? { ctaIcon: panel.ctaIcon } : {})}
          />
        );

      case 'philosophy':
        return (
          <PhilosophyPanel
            key={panel.id}
            title={panel.title}
            content={panel.content ?? ''}
            {...(panel.quote ? { quote: panel.quote } : {})}
            {...(panel.footer ? { footer: panel.footer } : {})}
          />
        );

      default:
        return null;
    }
  };

  return (
    <section ref={containerRef} className={`${styles.openSourceSplit} openSourceSplit`}>
      {/* Second layer of blobs - moves slower */}
      <div ref={blobsLayer2Ref} className={styles.floatingBlobsLayer2}>
        <div className={`${styles.blob2Layer} ${styles.blob2_1}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_2}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_3}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_4}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_5}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_6}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_7}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_8}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_9}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_10}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_11}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_12}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_13}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_14}`} />
        <div className={`${styles.blob2Layer} ${styles.blob2_15}`} />
      </div>

      {/* First layer of blobs - moves at medium speed */}
      <div ref={blobsRef} className={styles.floatingBlobs}>
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <div className={`${styles.blob} ${styles.blob3}`} />
        <div className={`${styles.blob} ${styles.blob4}`} />
        <div className={`${styles.blob} ${styles.blob5}`} />
        <div className={`${styles.blob} ${styles.blob6}`} />
        <div className={`${styles.blob} ${styles.blob7}`} />
        <div className={`${styles.blob} ${styles.blob8}`} />
        <div className={`${styles.blob} ${styles.blob9}`} />
        <div className={`${styles.blob} ${styles.blob10}`} />
        <div className={`${styles.blob} ${styles.blob11}`} />
        <div className={`${styles.blob} ${styles.blob12}`} />
        <div className={`${styles.blob} ${styles.blob13}`} />
        <div className={`${styles.blob} ${styles.blob14}`} />
        <div className={`${styles.blob} ${styles.blob15}`} />
        <div className={`${styles.blob} ${styles.blob16}`} />
        <div className={`${styles.blob} ${styles.blob17}`} />
        <div className={`${styles.blob} ${styles.blob18}`} />
        <div className={`${styles.blob} ${styles.blob19}`} />
        <div className={`${styles.blob} ${styles.blob20}`} />
        <div className={`${styles.blob} ${styles.blob21}`} />
        <div className={`${styles.blob} ${styles.blob22}`} />
      </div>

      <div ref={panelsRef} className={styles.panelsContainer}>
        {panels.map((panel) => renderPanel(panel))}
      </div>
    </section>
  );
};

export default OpenSourceSplit;
