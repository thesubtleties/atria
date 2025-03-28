// pages/EventHome/Welcome/index.jsx
import styles from './styles/index.module.css';

export default function Welcome({ title, content }) {
  return (
    <section className={styles.welcome}>
      <div className={styles.container}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.content}>{content}</div>
      </div>
    </section>
  );
}
