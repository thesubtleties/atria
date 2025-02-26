import styles from './CenterContent.module.css';

export const TitleWithSubtitle = ({ title, subtitle }) => (
  <div className={styles.titleContainer}>
    <h1 className={styles.title}>{title}</h1>
    <div className={styles.subtitle}>{subtitle}</div>
  </div>
);
