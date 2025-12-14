// pages/EventHome/FAQ/FAQItem.jsx
import { useState } from 'react';
import { Paper, UnstyledButton, Text, Collapse } from '@mantine/core';
import styles from './styles/FAQItem.module.css';

export default function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Paper shadow='sm' radius='md' withBorder>
      <UnstyledButton
        className={styles.question}
        onClick={() => setIsOpen(!isOpen)}
        w='100%'
        p='md'
      >
        <div className={styles.questionContent}>
          <Text fw={500}>{question}</Text>
          <Text c='violet' fw={700}>
            {isOpen ? '−' : '+'}
          </Text>
        </div>
      </UnstyledButton>

      <Collapse in={isOpen}>
        <Text p='md' c='dimmed'>
          {answer}
        </Text>
      </Collapse>
    </Paper>
  );
}
