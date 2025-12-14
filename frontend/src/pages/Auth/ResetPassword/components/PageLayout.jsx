import styles from '../styles/index.module.css';

const PageLayout = ({ children }) => {
  return (
    <div className={styles.container}>
      {/* Background Shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />

      <div className={styles.contentWrapper}>
        {/* Atria Branding */}
        <div className={styles.brandingSection}>
          <h1 className={styles.brandingTitle}>atria</h1>
        </div>

        {children}
      </div>
    </div>
  );
};

export default PageLayout;
