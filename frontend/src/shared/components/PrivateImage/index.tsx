import { useState, useEffect } from 'react';
import { Image, Box } from '@mantine/core';
import type { ImageProps } from '@mantine/core';
import { LoadingSpinner } from '../loading';
import { useGetPrivateContentQuery } from '../../../app/features/uploads/api';

interface PrivateImageProps extends Omit<ImageProps, 'src'> {
  objectKey: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  placeholder?: React.ReactNode;
}

const PrivateImage = ({
  objectKey,
  alt,
  width,
  height,
  fit = 'contain',
  placeholder,
  ...props
}: PrivateImageProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { data, isLoading, error } = useGetPrivateContentQuery(objectKey, {
    skip: !objectKey,
  });

  useEffect(() => {
    // The query returns a Blob, we need to create a URL from it
    if (data instanceof Blob) {
      const url = URL.createObjectURL(data);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [data]);

  if (!objectKey) {
    return <>{placeholder}</> || null;
  }

  if (isLoading) {
    return (
      <Box
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LoadingSpinner size='sm' />
      </Box>
    );
  }

  if (error || !imageUrl) {
    return <>{placeholder}</> || null;
  }

  return <Image src={imageUrl} alt={alt} w={width} h={height} fit={fit} {...props} />;
};

export default PrivateImage;
