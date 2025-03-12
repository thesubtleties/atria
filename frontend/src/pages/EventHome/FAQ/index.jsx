// pages/EventHome/FAQ/index.jsx
import { Title, Container } from '@mantine/core';
import FAQItem from './FAQItem';
import styles from './styles/index.module.css';

export default function FAQ({ faqs }) {
  return (
    <section className={styles.faq}>
      <Container size="md">
        <Title order={2} ta="center" mb="xl">
          Frequently Asked Questions
        </Title>
        <div className={styles.faqList}>
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </Container>
    </section>
  );
}
