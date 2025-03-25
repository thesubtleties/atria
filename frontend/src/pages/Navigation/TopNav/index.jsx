import React, { memo } from 'react';
import { MenuButton } from './components/MenuButton/index.jsx';
import { CenterContent } from './components/CenterContent/index.jsx';
import styles from './TopNav.module.css';

const TopNavComponent = ({ context, leftContent }) => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navLeft}>{leftContent}</div>

      <CenterContent context={context} />

      <div className={styles.navRight}>
        <MenuButton />
      </div>
    </nav>
  );
};

export const TopNav = memo(TopNavComponent);
TopNav.displayName = 'TopNav';
