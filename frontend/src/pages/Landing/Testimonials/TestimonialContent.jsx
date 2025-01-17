import styles from './styles/TestimonialContent.module.css';

export const TestimonialContent = ({ quote, author, role }) => (
  <div className={styles.content}>
    <p className={styles.quote}>{quote}</p>
    <h3 className={styles.author}>{author}</h3>
    <p className={styles.role}>{role}</p>
  </div>
);
