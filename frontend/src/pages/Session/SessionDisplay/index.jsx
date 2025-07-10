// pages/Session/SessionDisplay/index.jsx
import { Card } from '@mantine/core';
import { VimeoEmbed } from './VimeoEmbed';
import styles from './styles/index.module.css';

export const SessionDisplay = ({ streamUrl }) => {
  return (
    <Card className={styles.displayCard}>
      <div className={styles.displayContainer}>
        <VimeoEmbed url={streamUrl} />
      </div>
    </Card>
  );
};
