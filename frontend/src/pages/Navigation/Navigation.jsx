import React from 'react';
import { MenuButton } from './MenuButton';
import { CenterContent } from './CenterContent';
import styles from './Navigation.module.css';

export const Navigation = ({ context }) => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navLeft}>{/* Left side content */}</div>

      <CenterContent context={context} />

      <div className={styles.navRight}>
        <MenuButton />
      </div>
    </nav>
  );
};
