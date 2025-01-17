import React from 'react';
import styles from './MenuButton.module.css';

export const MenuButton = () => {
  return (
    <button
      className={styles.menuButton}
      onClick={() => console.log('Menu clicked')}
    >
      <span className={styles.menuIcon}>☰</span>
    </button>
  );
};
