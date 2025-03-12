// pages/EventHome/Highlights/HighlightCard.jsx
import styles from './styles/HighlightCard.module.css';

export default function HighlightCard({ title, description, icon }) {
  return (
    <div className={styles.card}>
      {/* {icon && <div className={styles.icon}>{icon}</div>} */}
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
