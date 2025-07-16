import { Card, Text, Group, Badge, ActionIcon, Anchor } from '@mantine/core';
import { IconExternalLink, IconMail, IconPhone, IconBrandTwitter, IconBrandLinkedin, IconBrandFacebook, IconBrandInstagram } from '@tabler/icons-react';
import PrivateImage from '../../../../shared/components/PrivateImage';
import styles from './styles/index.module.css';

export default function SponsorCard({ sponsor }) {
  // Handle snake_case from API
  const { 
    name, 
    description, 
    logo_url, 
    website_url, 
    tier_name,
    contact_name,
    contact_email,
    contact_phone,
    social_links,
    featured
  } = sponsor;
  
  // Debug logging
  console.log('SponsorCard sponsor data:', sponsor);
  console.log('SponsorCard logo_url:', logo_url);

  const socialIcons = {
    twitter: IconBrandTwitter,
    linkedin: IconBrandLinkedin,
    facebook: IconBrandFacebook,
    instagram: IconBrandInstagram
  };

  return (
    <Card 
      shadow="sm" 
      padding="lg" 
      radius="md" 
      withBorder
      className={`${styles.card} ${featured ? styles.featured : ''}`}
    >
      {featured && (
        <Badge 
          color="yellow" 
          variant="filled" 
          className={styles.featuredBadge}
        >
          Featured Sponsor
        </Badge>
      )}

      <Card.Section className={styles.logoSection}>
        {logo_url ? (
          <PrivateImage 
            objectKey={logo_url} 
            alt={`${name} logo`}
            fit="contain"
            className={styles.logo}
            placeholder={
              <div className={styles.placeholderLogo}>
                <Text size="xl" fw={700} c="dimmed">{name.charAt(0)}</Text>
              </div>
            }
          />
        ) : (
          <div className={styles.placeholderLogo}>
            <Text size="xl" fw={700} c="dimmed">{name.charAt(0)}</Text>
          </div>
        )}
      </Card.Section>

      <Badge color="blue" variant="light" className={styles.tierBadge}>
        {tier_name}
      </Badge>

      <Text fw={500} size="lg" mt="md" className={styles.sponsorName}>
        {name}
      </Text>

      {description && (
        <Text size="sm" c="dimmed" mt="sm" lineClamp={3}>
          {description}
        </Text>
      )}

      <Group justify="space-between" mt="md" className={styles.actions}>
        {website_url && (
          <Anchor href={website_url} target="_blank" size="sm">
            <Group gap={4}>
              <IconExternalLink size={16} />
              Visit Website
            </Group>
          </Anchor>
        )}

        {social_links && (
          <Group gap={8}>
            {Object.entries(social_links).map(([platform, url]) => {
              if (!url) return null;
              const Icon = socialIcons[platform];
              return (
                <ActionIcon
                  key={platform}
                  component="a"
                  href={url}
                  target="_blank"
                  size="sm"
                  variant="subtle"
                  color="gray"
                >
                  <Icon size={16} />
                </ActionIcon>
              );
            })}
          </Group>
        )}
      </Group>

      {(contact_email || contact_phone) && (
        <Group gap="xs" mt="md" className={styles.contact}>
          {contact_email && (
            <Anchor href={`mailto:${contact_email}`} size="xs" c="dimmed">
              <Group gap={4}>
                <IconMail size={14} />
                {contact_name || 'Contact'}
              </Group>
            </Anchor>
          )}
          {contact_phone && (
            <Anchor href={`tel:${contact_phone}`} size="xs" c="dimmed">
              <Group gap={4}>
                <IconPhone size={14} />
                {contact_phone}
              </Group>
            </Anchor>
          )}
        </Group>
      )}
    </Card>
  );
}