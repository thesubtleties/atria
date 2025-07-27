// pages/Session/SessionDisplay/index.jsx
import { VimeoEmbed } from './VimeoEmbed';
import styles from './styles/index.module.css';

export const SessionDisplay = ({ streamUrl }) => {
  return (
    <div className={styles.displayContainer}>
      <VimeoEmbed url={streamUrl} />
    </div>
  );
};
