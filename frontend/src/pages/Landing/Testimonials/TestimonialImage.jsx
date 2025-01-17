import { Image } from '@mantine/core';

export const TestimonialImage = ({ src, alt }) => (
  <Image
    src={src}
    alt={alt}
    radius="md"
    h={300}
    w={400}
    fit="cover"
    fallbackSrc="https://placehold.co/400x300" // Placeholder image
  />
);
