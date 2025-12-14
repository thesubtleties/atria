import styles from './NavBar.module.css';

const NavBar = ({ links = [], className = '', animated = true }) => {
  return (
    <nav className={`${styles.nav} ${className}`}>
      <div className={styles.navContent}>
        <div className={styles.navLinks}>
          {links.map((link, index) => (
            <a key={index} href={link.href} className={styles.navLink} data-animated={animated}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
