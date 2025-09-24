import { Grid, TextInput, Text, Badge, Collapse } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import styles from './styles/index.module.css';

const SOCIAL_PLATFORMS = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/name' },
  { key: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/username' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@username' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/page' },
  { key: 'other', label: 'Other', placeholder: 'https://example.com/profile' },
];

const SocialLinksSection = ({
  socialLinks,
  errors,
  isMobile,
  expanded,
  onExpandedChange,
  onSocialLinkChange,
}) => {
  return (
    <>
      {isMobile ? (
        <Badge
          variant="light"
          color="gray"
          radius="sm"
          className={styles.collapsibleHeader}
          onClick={() => onExpandedChange(!expanded)}
          rightSection={
            expanded ? (
              <IconChevronUp size={14} />
            ) : (
              <IconChevronDown size={14} />
            )
          }
          fullWidth
        >
          Social Media Links
        </Badge>
      ) : (
        <Text className={styles.sectionTitle}>Social Media Links</Text>
      )}

      <Collapse in={!isMobile || expanded}>
        <Grid gutter={isMobile ? 'xs' : 'md'}>
          {SOCIAL_PLATFORMS.map((platform) => (
            <Grid.Col key={platform.key} span={isMobile ? 12 : 6}>
              <TextInput
                label={platform.label}
                placeholder={platform.placeholder}
                value={socialLinks[platform.key] || ''}
                onChange={(e) => onSocialLinkChange(platform.key, e.target.value)}
                error={errors[`social_${platform.key}`]}
                classNames={{ input: styles.formInput }}
              />
            </Grid.Col>
          ))}
        </Grid>
      </Collapse>
    </>
  );
};

export default SocialLinksSection;