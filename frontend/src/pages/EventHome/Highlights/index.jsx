// pages/EventHome/Highlights/index.jsx
import HighlightCard from './HighlightCard';
import styles from './styles/index.module.css';

export default function Highlights({ highlights }) {
  return (
    <section className={styles.highlights}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {highlights.map((highlight, index) => (
            <HighlightCard
              key={index}
              title={highlight.title}
              description={highlight.description}
              icon={highlight.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
