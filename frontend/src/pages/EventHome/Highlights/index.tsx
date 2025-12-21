import HighlightCard from './HighlightCard';
import type { EventHighlight } from '@/types/events';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type HighlightsProps = {
  highlights: EventHighlight[];
};

export default function Highlights({ highlights }: HighlightsProps) {
  return (
    <section className={cn(styles.highlights)}>
      <div className={cn(styles.container)}>
        <div className={cn(styles.grid)}>
          {highlights.map((highlight, index) => (
            <HighlightCard
              key={index}
              title={highlight.title}
              description={highlight.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
