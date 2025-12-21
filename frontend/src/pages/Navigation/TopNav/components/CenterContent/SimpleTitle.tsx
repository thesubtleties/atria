import styles from './CenterContent.module.css';

type SimpleTitleProps = {
  children: React.ReactNode;
};

export const SimpleTitle = ({ children }: SimpleTitleProps) => (
  <h1 className={styles.title ?? ''}>{children}</h1>
);

