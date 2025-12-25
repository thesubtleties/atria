import { useState, useEffect } from 'react';
import { useGetPrivateContentQuery } from '@/app/features/uploads/api';
import type { HeroImages } from '@/types/events';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type HeroProps = {
  title: string;
  description?: string | null;
  images?: HeroImages | null;
};

type ContentResponse = {
  url?: string;
};

export default function Hero({ title, description, images }: HeroProps) {
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);

  // Get desktop image URL if available
  const { data: desktopData } = useGetPrivateContentQuery(images?.desktop as string, {
    skip: !images?.desktop,
  });

  // Get mobile image URL if available
  const { data: mobileData } = useGetPrivateContentQuery(images?.mobile as string, {
    skip: !images?.mobile,
  });

  const typedDesktopData = desktopData as ContentResponse | undefined;
  const typedMobileData = mobileData as ContentResponse | undefined;

  useEffect(() => {
    // Use desktop image by default, or mobile if desktop not available
    if (typedDesktopData?.url) {
      setBackgroundUrl(typedDesktopData.url);
    } else if (typedMobileData?.url) {
      setBackgroundUrl(typedMobileData.url);
    }
  }, [typedDesktopData, typedMobileData]);

  // Default gradient background if no image
  const defaultBackground = 'linear-gradient(90deg, #D6C7F0 0%, #E9DFF9 50%, #FAF9FC 100%)';

  // Create style object with both desktop and mobile images
  const backgroundStyle: React.CSSProperties & { '--mobile-image-url'?: string } = {
    backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : defaultBackground,
  };

  // Add CSS variables for responsive images
  if (typedDesktopData?.url && typedMobileData?.url) {
    backgroundStyle['--mobile-image-url'] = `url(${typedMobileData.url})`;
  }

  return (
    <div className={cn(styles.hero)}>
      <div className={cn(styles.heroBackground)} style={backgroundStyle}>
        <div className={cn(styles.heroContent)}>
          <h1 className={cn(styles.title)}>{title}</h1>
          <p className={cn(styles.description)}>{description}</p>
        </div>
      </div>
    </div>
  );
}
