import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MenuButton } from './components/MenuButton/index.jsx';
import { CenterContent } from './components/CenterContent/index.jsx';
import styles from './TopNav.module.css';

const TopNavComponent = ({ context, leftContent }) => {
  const location = useLocation();
  const isInEvent =
    location.pathname.includes('/events/') &&
    !location.pathname.includes('/events/join');
  const hasLeftContent = Boolean(leftContent);

  return (
    <nav
      className={`${styles.navbar} ${hasLeftContent && isInEvent ? styles.navbarWithBurger : ''}`}
    >
      <div
        className={`${styles.navContent} ${hasLeftContent && isInEvent ? styles.navContentWithBurger : ''}`}
      >
        <div className={styles.navLeft}>
          {!isInEvent && (
            <Link to="/app" className={styles.atriaTitle}>
              atria
            </Link>
          )}
          {leftContent && (
            <div className={styles.burgerWrapper}>{leftContent}</div>
          )}
        </div>

        <CenterContent context={context} />

        <div className={styles.navRight}>
          <MenuButton />
        </div>
      </div>
    </nav>
  );
};

export const TopNav = memo(TopNavComponent);
TopNav.displayName = 'TopNav';
