import { Link } from 'react-router-dom';
import styles from './styles/ActionCard.module.css';

export const ActionCard = ({ title, description, to }) => (
  <Link to={to} className={styles.card}>
    <h3>{title}</h3>
    <p>{description}</p>
  </Link>
);
