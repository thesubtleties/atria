import { cn } from '@/lib/cn';
import styles from './styles/HighlightCard.module.css';

type HighlightCardProps = {
  title: string;
  description: string;
};

export default function HighlightCard({ title, description }: HighlightCardProps) {
  return (
    <div className={cn(styles.card)}>
      <h3 className={cn(styles.title)}>{title}</h3>
      <p className={cn(styles.description)}>{description}</p>
    </div>
  );
}
