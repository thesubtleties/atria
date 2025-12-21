import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MenuButton } from './components/MenuButton/index';
import { CenterContent } from './components/CenterContent/index';
import styles from './TopNav.module.css';

type TopNavProps = {
  context?: unknown;
  leftContent?: React.ReactNode;
};

const TopNavComponent = ({ context, leftContent }: TopNavProps) => {
  const location = useLocation();
  const isInEvent =
    location.pathname.includes('/events/') && !location.pathname.includes('/events/join');
  const hasLeftContent = Boolean(leftContent);

  return (
    <nav
      className={`${styles.navbar ?? ''} ${hasLeftContent && isInEvent ? styles.navbarWithBurger ?? '' : ''}`}
    >
      <div
        className={`${styles.navContent ?? ''} ${hasLeftContent && isInEvent ? styles.navContentWithBurger ?? '' : ''}`}
      >
        <div className={styles.navLeft ?? ''}>
          {!isInEvent && (
            <Link to='/app' className={styles.atriaTitle ?? ''}>
              atria
            </Link>
          )}
          {leftContent && <div className={styles.burgerWrapper ?? ''}>{leftContent}</div>}
        </div>

        <CenterContent context={context} />

        <div className={styles.navRight ?? ''}>
          <MenuButton />
        </div>
      </div>
    </nav>
  );
};

export const TopNav = memo(TopNavComponent);
TopNav.displayName = 'TopNav';

