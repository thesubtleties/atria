import styles from './CenterContent.module.css';

type TitleWithSubtitleProps = {
  title: string;
  subtitle: string;
};

export const TitleWithSubtitle = ({ title, subtitle }: TitleWithSubtitleProps) => (
  <div className={styles.titleContainer ?? ''}>
    <h1 className={styles.title ?? ''}>{title}</h1>
    <div className={styles.subtitle ?? ''}>{subtitle}</div>
  </div>
);
