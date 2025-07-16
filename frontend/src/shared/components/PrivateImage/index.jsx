import React, { useState, useEffect } from 'react';
import { Image, Box, Loader } from '@mantine/core';
import { useGetPrivateContentQuery } from '../../../app/features/uploads/api';

const PrivateImage = ({ 
  objectKey, 
  alt, 
  width, 
  height, 
  fit = 'contain',
  placeholder,
  ...props 
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  
  // Debug logging
  console.log('PrivateImage received objectKey:', objectKey);
  
  const { data, isLoading, error } = useGetPrivateContentQuery(objectKey, {
    skip: !objectKey,
  });

  useEffect(() => {
    if (data?.url) {
      setImageUrl(data.url);
    }
  }, [data]);

  if (!objectKey) {
    return placeholder || null;
  }

  if (isLoading) {
    return (
      <Box 
        style={{ 
          width, 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        <Loader size="sm" />
      </Box>
    );
  }

  if (error || !imageUrl) {
    return placeholder || null;
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      fit={fit}
      {...props}
    />
  );
};

export default PrivateImage;