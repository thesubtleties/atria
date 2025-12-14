import { motion } from 'motion/react';
import { IconMail } from '@tabler/icons-react';
import styles from './OptionPanel.module.css';

export const OptionPanel = ({ type, title, subtitle, description, cta, ctaIcon }) => {
  const isOpenSource = type === 'opensource';
  const href = isOpenSource ? 'https://github.com/thesubtleties/atria' : 'mailto:steven@sbtl.dev';

  return (
    <div className={`${styles.panel} ${styles[type + 'Panel']} panel`}>
      <div className={`${styles.panelContent} panel-content`}>
        <div className={styles.contentWrapper}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>{title}</h3>
            <p className={styles.panelSubtitle}>{subtitle}</p>
            {description && <p className={styles.panelDescription}>{description}</p>}
          </div>

          <motion.a
            href={href}
            className={`${styles.ctaButton} ${!isOpenSource ? styles.enterpriseButton : ''}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            target={isOpenSource ? '_blank' : undefined}
            rel={isOpenSource ? 'noopener noreferrer' : undefined}
          >
            {ctaIcon === 'github' ?
              <svg
                className={styles.githubIcon}
                width='20'
                height='20'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.17 20 14.42 20 10c0-5.523-4.477-10-10-10z'
                />
              </svg>
            : <IconMail size={20} />}
            <span>{!isOpenSource ? 'Contact' : cta}</span>
          </motion.a>
        </div>
      </div>
    </div>
  );
};
