import { Container } from '@mantine/core';
import { TestimonialCard } from './TestimonialCard';

const SAMPLE_TESTIMONIAL = {
  quote:
    "Atria transformed how we manage our tech conferences. The platform's intuitive design and powerful features made organizing our annual developer summit a breeze.",
  author: 'Sarah Chen',
  role: 'Tech Conference Organizer',
  image: '/path/to/image.jpg', // Add your image path
};

export const Testimonial = () => (
  <Container size="lg" py="xl">
    <TestimonialCard testimonial={SAMPLE_TESTIMONIAL} />
  </Container>
);
