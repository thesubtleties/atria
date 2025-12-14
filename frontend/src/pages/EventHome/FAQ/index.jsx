// pages/EventHome/FAQ/index.jsx
import FAQItem from './FAQItem';
import styles from './styles/index.module.css';

export default function FAQ({ faqs }) {
  return (
    <section className={styles.faq}>
      <div className={styles.container}>
        <h2 className={styles.title}>Frequently Asked Questions</h2>
        <div className={styles.faqList}>
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
