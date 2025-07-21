// pages/EventHome/Hero/index.jsx
import { useState, useEffect } from 'react';
import { useGetPrivateContentQuery } from '@/app/features/uploads/api';
import styles from './styles/index.module.css';

export default function Hero({ title, description, images }) {
  const [backgroundUrl, setBackgroundUrl] = useState(null);
  
  // Get desktop image URL if available
  const { data: desktopData } = useGetPrivateContentQuery(images?.desktop, {
    skip: !images?.desktop,
  });

  // Get mobile image URL if available
  const { data: mobileData } = useGetPrivateContentQuery(images?.mobile, {
    skip: !images?.mobile,
  });

  useEffect(() => {
    // Use desktop image by default, or mobile if desktop not available
    if (desktopData?.url) {
      setBackgroundUrl(desktopData.url);
    } else if (mobileData?.url) {
      setBackgroundUrl(mobileData.url);
    }
  }, [desktopData, mobileData]);

  // Default gradient background if no image
  const defaultBackground = 'linear-gradient(135deg, #868e96 0%, #495057 100%)';

  // Create style object with both desktop and mobile images
  const backgroundStyle = {
    backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : defaultBackground,
  };
  
  // Add CSS variables for responsive images
  if (desktopData?.url && mobileData?.url) {
    backgroundStyle['--mobile-image-url'] = `url(${mobileData.url})`;
  }

  return (
    <div className={styles.hero}>
      <div
        className={styles.heroBackground}
        style={backgroundStyle}
      >
        <div className={styles.heroContent}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </div>
      </div>
    </div>
  );
}
