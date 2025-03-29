import { Hero } from './Hero';
import { Features } from './Features';
import { Stats } from './Stats';
import { Testimonials } from './Testimonials';
import styles from './index.module.css';

export const Landing = () => (
  <main className={styles.mainContainer}>
    <Hero />
    <Stats />
    <Features />
    <Testimonials />
  </main>
);
