import { LoadingContent } from '../../../../shared/components/loading';
import styles from '../styles/index.module.css';

const LoadingState = () => {
  return (
    <section className={styles.loadingSection}>
      <LoadingContent message='Validating reset link...' size='lg' />
    </section>
  );
};

export default LoadingState;
