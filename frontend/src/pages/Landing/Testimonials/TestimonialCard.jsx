import { Group } from '@mantine/core';
import { TestimonialImage } from './TestimonialImage';
import { TestimonialContent } from './TestimonialContent';

export const TestimonialCard = ({ testimonial }) => (
  <Group align="center" gap="xl">
    <TestimonialImage
      src={testimonial.image}
      alt={`${testimonial.author} photo`}
    />
    <TestimonialContent
      quote={testimonial.quote}
      author={testimonial.author}
      role={testimonial.role}
    />
  </Group>
);
