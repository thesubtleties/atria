import { Grid, TextInput, Text, Badge, Collapse } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import styles from './styles/index.module.css';

const ContactInfoSection = ({
  formData,
  errors,
  isMobile,
  expanded,
  onExpandedChange,
  onFieldChange,
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
          Contact Information
        </Badge>
      ) : (
        <Text className={styles.sectionTitle}>Contact Information</Text>
      )}

      <Collapse in={!isMobile || expanded}>
        <Grid gutter={isMobile ? 'xs' : 'md'}>
          <Grid.Col span={isMobile ? 12 : 4}>
            <TextInput
              label="Contact Name"
              placeholder="John Doe"
              value={formData.contactName}
              onChange={(e) => onFieldChange('contactName', e.target.value)}
              error={errors.contactName}
              classNames={{ input: styles.formInput }}
            />
          </Grid.Col>
          <Grid.Col span={isMobile ? 12 : 4}>
            <TextInput
              label="Contact Email"
              placeholder="contact@example.com"
              value={formData.contactEmail}
              onChange={(e) => onFieldChange('contactEmail', e.target.value)}
              error={errors.contactEmail}
              classNames={{ input: styles.formInput }}
            />
          </Grid.Col>
          <Grid.Col span={isMobile ? 12 : 4}>
            <TextInput
              label="Contact Phone"
              placeholder="+1234567890"
              value={formData.contactPhone}
              onChange={(e) => onFieldChange('contactPhone', e.target.value)}
              error={errors.contactPhone}
              classNames={{ input: styles.formInput }}
            />
          </Grid.Col>
        </Grid>
      </Collapse>
    </>
  );
};

export default ContactInfoSection;