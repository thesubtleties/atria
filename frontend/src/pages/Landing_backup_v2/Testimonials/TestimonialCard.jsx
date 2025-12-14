import styles from './styles/TestimonialCard.module.css';
import { TestimonialImage } from './TestimonialImage';
import { TestimonialContent } from './TestimonialContent';

export const TestimonialCard = ({ testimonial }) => (
  <div className={styles.card}>
    <TestimonialImage src={testimonial.image} alt={`${testimonial.author} photo`} />
    <TestimonialContent
      quote={testimonial.quote}
      author={testimonial.author}
      role={testimonial.role}
    />
  </div>
);
