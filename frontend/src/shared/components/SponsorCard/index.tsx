import { Card, Text, Group, ActionIcon, Anchor } from '@mantine/core';
import {
  IconExternalLink,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandYoutubeFilled,
  IconBrandTiktok,
  IconWorld,
} from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';
import PrivateImage from '../PrivateImage';
import { useGradientBadge } from '../../hooks/useGradientBadge';
import styles from './SponsorCard.module.css';

type SocialPlatform =
  | 'linkedin'
  | 'twitter'
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'facebook'
  | 'other';

const socialIcons: Record<SocialPlatform, Icon> = {
  linkedin: IconBrandLinkedin,
  twitter: IconBrandTwitter,
  youtube: IconBrandYoutubeFilled,
  tiktok: IconBrandTiktok,
  instagram: IconBrandInstagram,
  facebook: IconBrandFacebook,
  other: IconWorld,
};

interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  instagram?: string;
  facebook?: string;
  other?: string;
}

interface Sponsor {
  name: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  tier_name?: string;
  tier_color?: string;
  social_links?: SocialLinks;
  featured?: boolean;
}

interface SponsorCardProps {
  sponsor: Sponsor;
}

export const SponsorCard = ({ sponsor }: SponsorCardProps) => {
  const {
    name,
    description,
    logo_url,
    website_url,
    tier_name,
    tier_color,
    social_links,
    featured,
  } = sponsor;

  // Get gradient badge styles
  const badgeStyles = useGradientBadge(tier_color);

  return (
    <Card
      className={`${styles.card} ${featured ? styles.featured : ''}`}
      padding={0}
      radius='md'
      withBorder={false}
      shadow='none'
      styles={{
        root: {
          boxShadow: 'inherit',
        },
      }}
    >
      {/* Tier indicator - subtle, not centered */}
      {tier_name && (
        <div className={styles.tierIndicator} style={badgeStyles}>
          <span className={styles.tierText}>{tier_name}</span>
        </div>
      )}

      {/* Logo section */}
      <div className={styles.logoSection}>
        {logo_url ?
          <PrivateImage
            objectKey={logo_url}
            alt={`${name} logo`}
            width={100}
            height={100}
            fit='contain'
            className={styles.logo || ''}
            placeholder={
              <div className={styles.logoPlaceholder}>
                <Text size='2rem' fw={700} className={styles.placeholderText || ''}>
                  {name.substring(0, 2).toUpperCase()}
                </Text>
              </div>
            }
          />
        : <div className={styles.logoPlaceholder}>
            <Text size='2rem' fw={700} className={styles.placeholderText || ''}>
              {name.substring(0, 2).toUpperCase()}
            </Text>
          </div>
        }
      </div>

      {/* Content section */}
      <div className={styles.content}>
        <Text className={styles.sponsorName || ''}>{name}</Text>

        {description && (
          <Text className={styles.description || ''} lineClamp={2}>
            {description}
          </Text>
        )}

        {/* Footer with website and social links */}
        <div className={styles.footer}>
          {website_url && (
            <Anchor href={website_url} target='_blank' className={styles.websiteLink || ''}>
              <IconExternalLink size={16} />
              <span>Visit Website</span>
            </Anchor>
          )}

          {social_links &&
            Object.keys(social_links).length > 0 &&
            (() => {
              // Count how many social links are actually populated
              const activeSocialCount = Object.values(social_links).filter((url) => url).length;
              // Use smaller size only when we have all 7 social links
              const isCompact = activeSocialCount >= 7;

              const platforms: SocialPlatform[] = [
                'linkedin',
                'twitter',
                'youtube',
                'tiktok',
                'instagram',
                'facebook',
                'other',
              ];

              return (
                <Group
                  gap={0}
                  className={`${styles.socialLinks} ${isCompact ? styles.socialLinksCompact : ''}`}
                >
                  {platforms.map((platform) => {
                    const url = social_links[platform];
                    if (!url) return null;
                    const IconComponent = socialIcons[platform];
                    return IconComponent ?
                        <ActionIcon
                          key={platform}
                          component='a'
                          href={url}
                          target='_blank'
                          size={isCompact ? 'sm' : 'md'}
                          variant='subtle'
                          className={`${styles.socialIcon} ${styles[`socialIcon${platform.charAt(0).toUpperCase() + platform.slice(1)}`]}`}
                          aria-label={`${name} on ${platform}`}
                        >
                          <IconComponent size={isCompact ? 16 : 20} />
                        </ActionIcon>
                      : null;
                  })}
                </Group>
              );
            })()}
        </div>
      </div>
    </Card>
  );
};

export default SponsorCard;
