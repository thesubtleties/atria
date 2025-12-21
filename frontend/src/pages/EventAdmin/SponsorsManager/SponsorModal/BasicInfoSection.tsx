import { Grid, TextInput, Textarea, Select } from '@mantine/core';
import type { SponsorTierInfo } from '@/types/sponsors';
import styles from './styles/index.module.css';

type FormData = {
  name: string;
  tierId: string;
  description: string;
  websiteUrl: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  socialLinks: Record<string, string | null>;
};

type FormErrors = Record<string, string>;

type BasicInfoSectionProps = {
  formData: FormData;
  errors: FormErrors;
  isMobile: boolean;
  sponsorTiers: SponsorTierInfo[];
  onFieldChange: (field: keyof FormData, value: string) => void;
};

const BasicInfoSection = ({
  formData,
  errors,
  isMobile,
  sponsorTiers,
  onFieldChange,
}: BasicInfoSectionProps) => {
  return (
    <>
      <Grid>
        <Grid.Col span={isMobile ? 12 : 8}>
          <TextInput
            label='Sponsor Name'
            placeholder='Enter sponsor name'
            required
            value={formData.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            error={errors.name}
            classNames={{ input: styles.formInput ?? '' }}
          />
        </Grid.Col>
        <Grid.Col span={isMobile ? 12 : 4}>
          <Select
            label='Tier'
            placeholder='Select tier'
            required
            clearable={false}
            allowDeselect={false}
            data={sponsorTiers.map((tier) => ({
              value: tier.id,
              label: tier.name,
            }))}
            value={formData.tierId || null}
            onChange={(value) => {
              if (value) {
                onFieldChange('tierId', value);
              }
            }}
            error={errors.tierId}
            classNames={{ input: styles.formSelect ?? '' }}
          />
        </Grid.Col>
      </Grid>

      <Textarea
        label='Description'
        placeholder='Enter sponsor description'
        rows={3}
        value={formData.description}
        onChange={(e) => onFieldChange('description', e.target.value)}
        error={errors.description}
        classNames={{ input: styles.formTextarea ?? '' }}
      />

      <TextInput
        label='Website URL'
        placeholder='https://example.com'
        value={formData.websiteUrl}
        onChange={(e) => onFieldChange('websiteUrl', e.target.value)}
        error={errors.websiteUrl}
        classNames={{ input: styles.formInput ?? '' }}
      />
    </>
  );
};

export default BasicInfoSection;
