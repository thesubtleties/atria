import { Badge } from '@mantine/core';
import styles from './styles/index.module.css';

export const NewsSection = ({ news }) => {
  const getTimeDifference = (date) => {
    const now = new Date();
    const newsDate = new Date(date);
    const diffInDays = Math.floor((now - newsDate) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) > 1 ? 's' : ''} ago`;
  };

  const getDotClass = (date, isNew) => {
    const now = new Date();
    const newsDate = new Date(date);
    const diffInDays = Math.floor((now - newsDate) / (1000 * 60 * 60 * 24));
    
    if (isNew || diffInDays < 3) return styles.new;
    if (diffInDays < 14) return styles.recent;
    return styles.older;
  };

  const getBadgeClass = (type) => {
    switch (type) {
      case 'platform_update':
        return styles.platformUpdateBadge;
      case 'product_launch':
        return styles.productLaunchBadge;
      case 'feature_release':
        return styles.featureReleaseBadge;
      case 'security':
        return styles.securityBadge;
      default:
        return styles.platformUpdateBadge;
    }
  };

  const getTagLabel = (type) => {
    switch (type) {
      case 'platform_update':
        return 'Platform Update';
      case 'product_launch':
        return 'Product Launch';
      case 'feature_release':
        return 'Feature Release';
      case 'security':
        return 'Security';
      default:
        return type;
    }
  };

  const getItemClass = (type) => {
    switch (type) {
      case 'platform_update':
        return styles.platformUpdateItem;
      case 'product_launch':
        return styles.productLaunchItem;
      case 'feature_release':
        return styles.featureReleaseItem;
      case 'security':
        return styles.securityItem;
      default:
        return '';
    }
  };

  return (
    <section className={styles.dashboardSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>News</h2>
      </div>

      {news && news.length > 0 ? (
        <div className={styles.newsList}>
          {news.map((item) => (
            <div key={item.id} className={`${styles.newsItem} ${getItemClass(item.type)}`}>
              <div className={`${styles.newsDot} ${getDotClass(item.date, item.is_new)}`} />
              <div className={styles.newsContent}>
                <div className={styles.newsTitle}>{item.title}</div>
                <div className={styles.newsDescription}>{item.description}</div>
                <div className={styles.newsMeta}>
                  <span>{getTimeDifference(item.date)}</span>
                  <Badge 
                    className={getBadgeClass(item.type)}
                    styles={{ root: { textTransform: 'none' } }}
                  >
                    {getTagLabel(item.type)}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>No news at this time.</p>
        </div>
      )}
    </section>
  );
};