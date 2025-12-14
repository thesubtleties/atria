import styles from './SectionWrapper.module.css';

const SectionWrapper = ({
  children,
  className = '',
  background = 'default',
  padding = 'normal',
  overflow = 'hidden',
  id = '',
}) => {
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
