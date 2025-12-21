import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type WelcomeProps = {
  title?: string | null;
  content?: string | null;
};

export default function Welcome({ title, content }: WelcomeProps) {
  return (
    <section className={cn(styles.welcome)}>
      <div className={cn(styles.container)}>
        <h2 className={cn(styles.title)}>{title}</h2>
        <div className={cn(styles.content)}>{content}</div>
      </div>
    </section>
  );
}
