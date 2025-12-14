import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import FloatingShapes from '../../animations/BackgroundEffects/FloatingShapes';
import NavBar from '../../ui/Navigation/NavBar';
import ScrambleText from '../../ui/Typography/ScrambleText';
import ScrollIndicator from '../../animations/ScrollEffects/ScrollIndicator';
import MagneticButton from '../../shared/MagneticButton';
import SectionWrapper from '../../common/Wrappers/SectionWrapper';
import styles from './HeroSection.module.css';

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

const HeroSection = ({
  logo = 'atria',
  taglinePrefix = 'a place for',
  scrambleWords = PLACE_WORDS,
  ctaText = 'START YOUR STORY',
  navLinks = [
    { href: '#login', label: 'Login' },
    { href: '#signup', label: 'Sign Up' },
  ],
  showScrollIndicator = true,
  showWaveTransition = true,
}) => {
  const logoRef = useRef(null);
  const taglineRef = useRef(null);
  const ctaRef = useRef(null);
  const navRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    if (logoRef.current) {
      tl.from(logoRef.current, {
        opacity: 0,
        y: 30,
        duration: 1,
        ease: 'power3.out',
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
        },
        '-=0.5',
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
        },
        '-=0.4',
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
        },
        '-=0.6',
      );
    }
  });

  return (
    <SectionWrapper className={`${styles.hero} hero`} padding='none'>
      <FloatingShapes />

      <div ref={navRef}>
        <NavBar links={navLinks} />
      </div>

      <div className={styles.content}>
        <div className='container'>
          <div className={styles.heroContent}>
            <h1 ref={logoRef} className={styles.logo}>
              {logo}
            </h1>
            <p ref={taglineRef} className={styles.tagline}>
              {taglinePrefix} <ScrambleText words={scrambleWords} className={styles.scrambleText} />
            </p>

            <div ref={ctaRef} className={styles.ctaWrapper}>
              <MagneticButton variant='primary' className={styles.ctaButton} magnetStrength={0.4}>
                {ctaText}
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>

      {showScrollIndicator && <ScrollIndicator />}

      {showWaveTransition && (
        <div className={styles.waveTransition}>
          <svg viewBox='0 0 1440 120' preserveAspectRatio='none' className={styles.wave}>
            <path
              d='M0,64 C360,96 720,32 1440,64 L1440,120 L0,120 Z'
              fill='var(--color-almost-white)'
            />
          </svg>
        </div>
      )}
    </SectionWrapper>
  );
};

export default HeroSection;
