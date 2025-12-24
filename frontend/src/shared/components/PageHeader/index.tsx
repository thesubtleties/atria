import styles from './styles/index.module.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export const PageHeader = ({ title, subtitle, className }: PageHeaderProps) => {
  return (
    <section
      className={className ? `${styles.pageHeader || ''} ${className}` : styles.pageHeader || ''}
    >
      <h1 className={styles.title || ''}>{title}</h1>
      {subtitle && <p className={styles.subtitle || ''}>{subtitle}</p>}
    </section>
  );
};
