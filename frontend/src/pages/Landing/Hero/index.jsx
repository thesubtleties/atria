import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { motion } from 'motion/react';
import { useModals } from '@mantine/modals';
import MagneticButton from '../shared/MagneticButton';
import styles from './Hero.module.css';
import AtriaLogo from '../../../assets/atria-logo.svg';
import { LoginModal } from '@/shared/components/modals/auth/LoginModal';
import { SignupModal } from '@/shared/components/modals/auth/SignupModal';
import { ForgotPasswordModal } from '@/shared/components/modals/auth/ForgotPasswordModal';
import { useLoginMutation, authApi } from '@/app/features/auth/api';
import { useDispatch } from 'react-redux';
import { setUser } from '@/app/store/authSlice';

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

// Words to cycle through for scramble effect
const PLACE_WORDS = [
  'connections',
  'community',
  'experiences',
  'relationships',
  'memories',
  'stories',
  'magic',
  'belonging',
];

const Hero = () => {
  const [fontLoaded, setFontLoaded] = useState(false);
  const navigate = useNavigate();
  const modals = useModals();
  const dispatch = useDispatch();
  const [login] = useLoginMutation();
  
  const containerRef = useRef(null);
  const scrambleRef = useRef(null);
  const scrollIndicatorRef = useRef(null);
  const logoRef = useRef(null);
  const taglineRef = useRef(null);
  const ctaRef = useRef(null);
  const navRef = useRef(null);
  const contentRef = useRef(null);
  const drapeRef = useRef(null);
  const movingBackgroundRef = useRef(null);

  // Check if Nunito font is loaded
  useEffect(() => {
    if ('fonts' in document) {
      // Use the CSS Font Loading API
      document.fonts.ready.then(() => {
        // Check if Nunito is loaded
        const fontLoaded = document.fonts.check('1rem Nunito');
        setFontLoaded(fontLoaded);
        
        // If not loaded yet, wait for it
        if (!fontLoaded) {
          document.fonts.load('1rem Nunito').then(() => {
            setFontLoaded(true);
          }).catch(() => {
            // Font failed to load, show anyway after a timeout
            setTimeout(() => setFontLoaded(true), 500);
          });
        }
      });
    } else {
      // Fallback for browsers without Font Loading API
      setTimeout(() => setFontLoaded(true), 1000);
    }
  }, []);

  // Modal handlers
  const handleForgotPassword = () => {
    modals.openModal({
      title: 'Reset Password',
      children: (
        <ForgotPasswordModal
          onClose={() => modals.closeAll()}
        />
      ),
      size: 'md',
      centered: true,
      closeOnClickOutside: true,
      closeOnEscape: true,
      lockScroll: false,
    });
  };

  const handleLogin = () => {
    modals.openModal({
      title: 'Log In',
      children: (
        <LoginModal
          onClose={() => modals.closeAll()}
          onSuccess={() => {
            modals.closeAll();
            navigate('/app');
          }}
          onForgotPassword={() => {
            modals.closeAll();
            handleForgotPassword();
          }}
        />
      ),
      size: 'md',
      centered: true,
      closeOnClickOutside: true,
      closeOnEscape: true,
      lockScroll: false,
    });
  };

  const handleSignup = () => {
    modals.openModal({
      title: 'Create Account',
      children: (
        <SignupModal
          onClose={() => modals.closeAll()}
          onSuccess={() => {
            modals.closeAll();
            navigate('/app');
          }}
        />
      ),
      size: 'md',
      centered: true,
      closeOnClickOutside: true,
      closeOnEscape: true,
      lockScroll: false,
    });
  };

  const handleDemoLogin = async () => {
    try {
      await login({
        email: 'demouser@demo.com',
        password: 'changeme',
      }).unwrap();
      // Fetch user data after successful login
      const userData = await dispatch(
        authApi.endpoints.getCurrentUser.initiate()
      ).unwrap();
      if (userData) {
        navigate('/app');
      }
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  useGSAP(
    () => {
      let scrambleIntervalHandle = null;
      let ctx = gsap.context(() => {
        // Initial animations using refs
        const tl = gsap.timeline();

        if (logoRef.current) {
          tl.from(logoRef.current, {
            opacity: 0,
            y: 30,
            duration: 1,
            ease: 'power3.out',
            force3D: true,
          });
        }

        if (taglineRef.current) {
          tl.from(
            taglineRef.current,
            {
              opacity: 0,
              y: 20,
              duration: 0.8,
              ease: 'power3.out',
              force3D: true,
            },
            '-=0.5'
          );
        }

        if (ctaRef.current) {
          tl.from(
            ctaRef.current,
            {
              opacity: 0,
              y: 20,
              duration: 0.8,
              ease: 'power3.out',
              force3D: true,
            },
            '-=0.4'
          );
        }

        if (navRef.current) {
          tl.from(
            navRef.current,
            {
              opacity: 0,
              y: -20,
              duration: 0.8,
              ease: 'power3.out',
              force3D: true,
            },
            '-=0.6'
          );
        }

        // Scramble text animation
        let wordIndex = 0;

        const scrambleAnimation = () => {
          if (!scrambleRef.current) return;
          wordIndex = (wordIndex + 1) % PLACE_WORDS.length;
          gsap.to(scrambleRef.current, {
            duration: 1,
            scrambleText: {
              text: PLACE_WORDS[wordIndex],
              chars: 'lowerCase',
              speed: 0.6,
            },
            force3D: true,
          });
        };

        // Start scramble animation after initial load
        scrambleIntervalHandle = setInterval(scrambleAnimation, 3000);

        // Scroll indicator animation
        if (scrollIndicatorRef.current) {
          gsap.to(scrollIndicatorRef.current, {
            y: 10,
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: 'power1.inOut',
            force3D: true,
          });
        }

        // Create drape reveal animation
        let drapeTl = null;
        if (containerRef.current && contentRef.current && drapeRef.current) {
          drapeTl = gsap.timeline({
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top top',
              end: '+=135%', // Extended to prevent clipping
              scrub: 1,
              pin: true,
              pinSpacing: true,
              pinType: 'transform', // Use transform instead of fixed positioning
              fastScrollEnd: true,
              onUpdate: (self) => {
                // Drape starts covering 90% of screen, edge at 10% from bottom
                // As it moves up, the edge position rises
                const drapeEdgeFromBottom = 10 + self.progress * 100;

                // CTA button is near bottom (~15% from bottom)
                if (ctaRef.current) {
                  gsap.to(ctaRef.current, {
                    opacity: drapeEdgeFromBottom > 30 ? 0 : 1,
                    duration: 0.3,
                    ease: 'power2.out',
                    overwrite: true,
                    force3D: true,
                  });
                }

                // Tagline is in middle (~45% from bottom)
                if (taglineRef.current) {
                  gsap.to(taglineRef.current, {
                    opacity: drapeEdgeFromBottom > 40 ? 0 : 1,
                    duration: 0.3,
                    ease: 'power2.out',
                    overwrite: true,
                    force3D: true,
                  });
                }

                // Logo is higher up (~60% from bottom)
                if (logoRef.current) {
                  gsap.to(logoRef.current, {
                    opacity: drapeEdgeFromBottom > 55 ? 0 : 1,
                    duration: 0.3,
                    ease: 'power2.out',
                    overwrite: true,
                    force3D: true,
                  });
                }

                // Navigation at top (~85% from bottom)
                if (navRef.current) {
                  gsap.to(navRef.current, {
                    opacity: drapeEdgeFromBottom > 80 ? 0 : 1,
                    duration: 0.3,
                    ease: 'power2.out',
                    overwrite: true,
                    force3D: true,
                  });
                }

                // Stop/restart scramble animation
                if (self.progress > 0.3 && scrambleIntervalHandle) {
                  clearInterval(scrambleIntervalHandle);
                  scrambleIntervalHandle = null;
                } else if (self.progress <= 0.3 && !scrambleIntervalHandle) {
                  scrambleIntervalHandle = setInterval(scrambleAnimation, 3000);
                }
              },
            },
          });

          // Animate just the drape up within the background
          drapeTl
            .to(drapeRef.current, {
              y: '-110vh', // Move drape up and out
              duration: 0.5, // Complete in first half of scroll
              ease: 'power2.inOut',
              force3D: true,
            })

            // Fade out scroll indicator early
            .to(
              scrollIndicatorRef.current,
              {
                opacity: 0,
                duration: 0.2,
                force3D: true,
              },
              0
            );
        }
      }, containerRef); // Context scoped to container

      // Cleanup function
      return () => {
        if (scrambleIntervalHandle) {
          clearInterval(scrambleIntervalHandle);
        }
        ctx.revert(); // This will kill all GSAP animations and ScrollTriggers in context
      };
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} className={`${styles.hero} hero`}>
      {/* Yellow background that moves up with the drape */}
      <div ref={movingBackgroundRef} className={styles.movingBackground}>
        {/* Purple drape as bottom layer that covers 90% of screen */}
        <div ref={drapeRef} className={styles.drape}>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className={styles.drapeSvg}
          >
            <path
              d="M0,0 L100,0 L100,94 C93.75,92.2 87.5,96.7 75,94 C62.5,92.2 50,97.8 37.5,95.6 C25,93.3 12.5,97.8 0,94 Z"
              fill="#8B5CF6"
            />
          </svg>
        </div>
      </div>

      {/* Navigation */}
      <nav ref={navRef} className={styles.nav}>
        <div className={styles.navContent}>
          <div className={styles.navLinks}>
            <button onClick={handleLogin} className={styles.navLink}>
              Login
            </button>
            <button onClick={handleSignup} className={styles.navLink}>
              Sign Up
            </button>
            <button onClick={handleDemoLogin} className={styles.navLink}>
              Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div ref={contentRef} className={styles.content}>
        <div className="container">
          <div className={styles.heroContent}>
            <div ref={logoRef} className={styles.logoContainer}>
              <img src={AtriaLogo} alt="Atria" className={styles.logo} />
              <h1 
                className={styles.logoText} 
                style={{ opacity: fontLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
              >
                atria
              </h1>
            </div>
            <div ref={taglineRef} className={styles.tagline}>
              <p className={styles.taglineTop}>— a place for —</p>
              <p ref={scrambleRef} className={styles.scrambleText}>
                connections
              </p>
            </div>

            <div ref={ctaRef} className={styles.ctaWrapper}>
              <MagneticButton
                variant="primary"
                className={styles.ctaButton}
                magnetStrength={0.4}
                onClick={handleSignup}
              >
                START YOUR STORY
              </MagneticButton>
              <p className={styles.loginText}>
                or <button onClick={handleLogin} className={styles.loginLink}>login</button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div ref={scrollIndicatorRef} className={styles.scrollIndicator}>
        <span className={styles.scrollText}>Scroll to explore</span>
        <svg
          className={styles.scrollArrow}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 5v14m0 0l-7-7m7 7l7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
