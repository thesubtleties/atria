import { useEffect, useRef, createContext, lazy, Suspense } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import Lenis from 'lenis';

// Styles
import styles from './Landing.module.css';

// Load immediately (above the fold)
import Hero from './Hero';
import ProblemStatement from './ProblemStatement';

// Lazy load everything else (below the fold)
const PlatformDemo = lazy(() => import('./PlatformDemo'));
const AudienceCards = lazy(() => import('./AudienceCards'));
const OpenSourceSplit = lazy(() => import('./OpenSourceSplit'));
const BrandExperience = lazy(() => import('./BrandExperience'));
const CallToAction = lazy(() => import('./CallToAction'));

// Register GSAP plugins
gsap.registerPlugin(useGSAP, ScrollTrigger, ScrambleTextPlugin);

// Configure ScrollTrigger for better performance
ScrollTrigger.config({
  limitCallbacks: false, // True = improves performance by limiting callback frequency
  syncInterval: 10, // Default value for smooth scrolling
  autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load', // When to auto-refresh
});

// Create animation context for global timeline coordination
const AnimationContext = createContext();
// Hook for accessing animation context (currently unused but available for future use)
// const useAnimation = () => useContext(AnimationContext);

function App() {
  const masterTimelineRef = useRef();
  const sectionRefsRef = useRef({});

  // Animation state management
  const animationState = useRef({
    currentSection: 0,
    isTransitioning: false,
    sectionProgress: {},
  });

  useEffect(() => {
    // Note: We let GSAP run during pre-rendering to capture initial animation states
    // The prerender script will capture these states and inject them as critical CSS

    // Enable debug mode with ?debug=true in URL
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === 'true';

    if (debugMode) {
      gsap.set(gsap.config(), { trialWarn: false });
      console.log('🎬 Animation Debug Mode Enabled');
    }

    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
      syncTouch: true,
    });

    // Update ScrollTrigger when Lenis scrolls
    lenis.on('scroll', ScrollTrigger.update);

    // Add lenis scrolling to GSAP ticker
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Configure ScrollTrigger
    ScrollTrigger.config({
      ignoreMobileResize: true,
      syncInterval: 40,
      autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load,resize',
    });

    // Setup responsive animations
    ScrollTrigger.matchMedia({
      // Desktop
      '(min-width: 1024px)': function () {
        // Desktop-specific settings
        ScrollTrigger.defaults({
          scroller: document.body,
          toggleActions: 'play none none reverse',
        });
      },

      // Tablet
      '(min-width: 768px) and (max-width: 1023px)': function () {
        // Tablet-specific settings - reduce some effects
        ScrollTrigger.defaults({
          scroller: document.body,
          toggleActions: 'play none none none',
        });
      },

      // Mobile
      '(max-width: 767px)': function () {
        // Mobile-specific settings - simpler animations
        ScrollTrigger.defaults({
          scroller: document.body,
          toggleActions: 'play none none none',
        });
      },
    });

    // Create master timeline for coordinated animations
    masterTimelineRef.current = gsap.timeline({
      smoothChildTiming: true,
      autoRemoveChildren: true,
    });

    // Handle velocity-based effects
    let currentVelocity = 0;
    ScrollTrigger.addEventListener('scrollStart', () => {
      document.body.classList.add('is-scrolling');
    });

    ScrollTrigger.addEventListener('scrollEnd', () => {
      document.body.classList.remove('is-scrolling');
      currentVelocity = 0;
    });

    // Update velocity on scroll with performance optimization
    let velocityRaf;
    ScrollTrigger.create({
      onUpdate: (self) => {
        if (velocityRaf) cancelAnimationFrame(velocityRaf);
        velocityRaf = requestAnimationFrame(() => {
          currentVelocity = self.getVelocity();
          document.documentElement.style.setProperty(
            '--scroll-velocity',
            Math.abs(currentVelocity)
          );
        });
      },
    });

    // Enhanced section tracking for better timeline coordination
    const sections = [
      '.hero',
      '.problemStatement',
      '.platformDemo',
      '.audienceCards',
      '.openSourceSplit',
      '.brandExperience',
      '.finalSection',
    ];

    sections.forEach((selector, index) => {
      ScrollTrigger.create({
        trigger: selector,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => {
          animationState.current.currentSection = index;
          if (debugMode) {
            console.log(`📍 Entered section: ${selector} (${index})`);
          }
          // Trigger section-specific enhancements
          if (sectionRefsRef.current[selector]) {
            gsap.to(sectionRefsRef.current[selector], {
              '--section-progress': 1,
              duration: 0.6,
              ease: 'power2.out',
            });
          }
        },
        onLeave: () => {
          if (sectionRefsRef.current[selector]) {
            gsap.to(sectionRefsRef.current[selector], {
              '--section-progress': 0,
              duration: 0.3,
              ease: 'power2.in',
            });
          }
        },
        onEnterBack: () => {
          animationState.current.currentSection = index;
          if (sectionRefsRef.current[selector]) {
            gsap.to(sectionRefsRef.current[selector], {
              '--section-progress': 1,
              duration: 0.6,
              ease: 'power2.out',
            });
          }
        },
        onLeaveBack: () => {
          if (sectionRefsRef.current[selector]) {
            gsap.to(sectionRefsRef.current[selector], {
              '--section-progress': 0,
              duration: 0.3,
              ease: 'power2.in',
            });
          }
        },
      });
    });

    // Refresh ScrollTrigger after a short delay to ensure all components are mounted
    const refreshTimeout = setTimeout(() => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();

      // Ensure all animations are properly initialized
      if (debugMode) {
        console.log(
          '📊 ScrollTrigger instances:',
          ScrollTrigger.getAll().length
        );
        console.log('✅ Animation system initialized');
      }
    }, 100);

    // Add resize optimization
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 250);
    };
    window.addEventListener('resize', handleResize);

    // Prevent horizontal scroll from decorative elements
    document.body.style.overflowX = 'hidden';

    return () => {
      // Cleanup
      clearTimeout(refreshTimeout);
      clearTimeout(resizeTimer);
      if (velocityRaf) cancelAnimationFrame(velocityRaf);
      window.removeEventListener('resize', handleResize);
      gsap.ticker.remove(lenis.raf);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((st) => st.kill());
      ScrollTrigger.clearMatchMedia();
      if (masterTimelineRef.current) {
        masterTimelineRef.current.kill();
      }
    };
  }, []);

  const animationContextValue = {
    masterTimeline: masterTimelineRef.current,
    registerSection: (name, ref) => {
      sectionRefsRef.current[name] = ref;
    },
    animationState: animationState.current,
  };

  return (
    <AnimationContext.Provider value={animationContextValue}>
      <div className={styles.app}>
        {/* Load immediately - the "hook" content */}
        <Hero />
        <ProblemStatement />

        {/* Lazy load below-the-fold content */}
        <Suspense fallback={null}>
          <PlatformDemo />
          <AudienceCards />
          <OpenSourceSplit />
          <BrandExperience />
          <CallToAction />
        </Suspense>
      </div>
    </AnimationContext.Provider>
  );
}

export default App;
