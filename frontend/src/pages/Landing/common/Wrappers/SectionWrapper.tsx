import type { ReactNode } from 'react';
import type { BackgroundVariant, PaddingSize, OverflowType } from '../../types';
import styles from './SectionWrapper.module.css';

type SectionWrapperProps = {
  children: ReactNode;
  className?: string;
  background?: BackgroundVariant;
  padding?: PaddingSize;
  overflow?: OverflowType;
  id?: string;
};

const SectionWrapper = ({
  children,
  className = '',
  background = 'default',
  padding = 'normal',
  overflow = 'hidden',
  id = '',
}: SectionWrapperProps) => {
  return (
    <section
      id={id}
      className={`
        ${styles.section} 
        ${styles[`bg-${background}`]} 
        ${styles[`padding-${padding}`]}
        ${styles[`overflow-${overflow}`]}
        ${className}
      `}
    >
      {children}
    </section>
  );
};

export default SectionWrapper;
