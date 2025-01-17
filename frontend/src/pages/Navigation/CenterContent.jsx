import React from 'react';
import styles from './CenterContent.module.css';

export const CenterContent = ({ context }) => {
  // Changed to named export
  const renderContent = () => {
    if (!context) return null;

    if (context.type === 'organization') {
      return <h1 className={styles.title}>{context.name}</h1>;
    }

    if (context.type === 'event') {
      return (
        <div className={styles.eventContainer}>
          {context.logo ? (
            <img
              src={context.logo}
              alt={context.name}
              className={styles.logo}
            />
          ) : (
            <h1 className={styles.title}>{context.name}</h1>
          )}
        </div>
      );
    }

    return null;
  };

  return <div className={styles.centerContent}>{renderContent()}</div>;
};
