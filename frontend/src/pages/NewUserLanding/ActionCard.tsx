import { Link } from 'react-router-dom';
import styles from './styles/ActionCard.module.css';

interface ActionCardProps {
  title: string;
  description: string;
  to: string;
}

export const ActionCard = ({ title, description, to }: ActionCardProps) => (
  <Link to={to} className={styles.card}>
    <h3>{title}</h3>
    <p>{description}</p>
  </Link>
);
