import { Outlet } from 'react-router-dom';
import { Navigation } from '@/pages/Navigation';
import styles from './AppLayout.module.css';

export const AppLayout = () => {
  return (
    <div className={styles.layout}>
      <Navigation />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};
