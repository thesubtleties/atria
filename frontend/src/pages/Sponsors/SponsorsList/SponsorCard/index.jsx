import { Card, Text, Group, Badge, ActionIcon, Anchor, Image } from '@mantine/core';
import { IconExternalLink, IconMail, IconPhone, IconBrandTwitter, IconBrandLinkedin, IconBrandFacebook, IconBrandInstagram } from '@tabler/icons-react';
import styles from './styles/index.module.css';

export default function SponsorCard({ sponsor }) {
  const { 
    name, 
    description, 
    logoUrl, 
    websiteUrl, 
    tierName,
    contactName,
    contactEmail,
    contactPhone,
    socialLinks,
    featured
  } = sponsor;

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
        {logoUrl ? (
          <Image 
            src={logoUrl} 
            alt={`${name} logo`}
            fit="contain"
            className={styles.logo}
          />
        ) : (
          <div className={styles.placeholderLogo}>
            <Text size="xl" fw={700} c="dimmed">{name.charAt(0)}</Text>
          </div>
        )}
      </Card.Section>

      <Badge color="blue" variant="light" className={styles.tierBadge}>
        {tierName}
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
        {websiteUrl && (
          <Anchor href={websiteUrl} target="_blank" size="sm">
            <Group gap={4}>
              <IconExternalLink size={16} />
              Visit Website
            </Group>
          </Anchor>
        )}

        {socialLinks && (
          <Group gap={8}>
            {Object.entries(socialLinks).map(([platform, url]) => {
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

      {(contactEmail || contactPhone) && (
        <Group gap="xs" mt="md" className={styles.contact}>
          {contactEmail && (
            <Anchor href={`mailto:${contactEmail}`} size="xs" c="dimmed">
              <Group gap={4}>
                <IconMail size={14} />
                {contactName || 'Contact'}
              </Group>
            </Anchor>
          )}
          {contactPhone && (
            <Anchor href={`tel:${contactPhone}`} size="xs" c="dimmed">
              <Group gap={4}>
                <IconPhone size={14} />
                {contactPhone}
              </Group>
            </Anchor>
          )}
        </Group>
      )}
    </Card>
  );
}