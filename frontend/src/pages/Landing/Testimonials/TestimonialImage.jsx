import { Image } from '@mantine/core';

export const TestimonialImage = ({ src, alt }) => (
  <Image
    src={src}
    alt={alt}
    radius="md"
    h={400}
    w={400}
    fit="cover"
    fallbackSrc="https://cdn.midjourney.com/5d6f3487-c90a-4cda-a099-c27bc0588445/0_2.png" // Placeholder image
  />
);
