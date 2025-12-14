import { Image } from '@mantine/core';

export const TestimonialImage = ({ src, alt }) => (
  <Image
    src={src}
    alt={alt}
    radius='md'
    h={400}
    w={{ base: '90%', sm: 400 }}
    fit='cover'
    fallbackSrc='/images/virtuallanding.png' // Placeholder image
  />
);
