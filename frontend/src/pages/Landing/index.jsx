import { Hero } from './Hero';
import { Stats } from './Stats';
import { Testimonials } from './Testimonials';
import styles from './index.module.css';
export const Landing = () => (
  <main className={styles.mainContainer}>
    <Hero />
    <Stats />
    <Testimonials />
  </main>
);
