// pages/EventHome/Hero/index.jsx
import styles from './styles/index.module.css';

export default function Hero({ title, description, images }) {
  return (
    <div className={styles.hero}>
      <div
        className={styles.heroBackground}
        style={{
          backgroundImage: `url(${images?.desktop})`,
          // We could use media queries in CSS for mobile image
        }}
      >
        <div className={styles.heroContent}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </div>
      </div>
    </div>
  );
}
