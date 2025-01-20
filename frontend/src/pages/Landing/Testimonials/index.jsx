import { Container } from '@mantine/core';
import { TestimonialCard } from './TestimonialCard';
import styles from './styles/index.module.css';

const SAMPLE_TESTIMONIAL = {
  quote:
    "Atria transformed how we manage our tech conferences. The platform's intuitive design made organizing our annual developer summit a breeze.",
  author: 'Sarah Chen',
  role: 'Tech Conference Organizer',
  image: '/path/to/image.jpg',
};

export const Testimonials = () => (
  <section className={styles.testimonials}>
    <Container size="lg">
      <TestimonialCard testimonial={SAMPLE_TESTIMONIAL} />
    </Container>
  </section>
);
