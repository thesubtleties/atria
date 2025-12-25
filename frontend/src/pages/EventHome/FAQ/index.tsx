import FAQItem from './FAQItem';
import type { EventFAQ } from '@/types/events';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type FAQProps = {
  faqs: EventFAQ[];
};

export default function FAQ({ faqs }: FAQProps) {
  return (
    <section className={cn(styles.faq)}>
      <div className={cn(styles.container)}>
        <h2 className={cn(styles.title)}>Frequently Asked Questions</h2>
        <div className={cn(styles.faqList)}>
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
