import { useState, useEffect } from 'react';
import { Stack, Group, Text, FileInput, Box, Tabs, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconUpload,
  IconX,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconCheck,
} from '@tabler/icons-react';
import { useUpdateEventMutation } from '@/app/features/events/api';
import { useUploadImageMutation } from '@/app/features/uploads/api';
import PrivateImage from '@/shared/components/PrivateImage';
import { Button } from '@/shared/components/buttons';
import { cn } from '@/lib/cn';
import type { Event, ApiError } from '@/types';
import styles from './styles.module.css';
import parentStyles from '../styles/index.module.css';

type BrandingSectionProps = {
  event: Event | undefined;
  eventId: number;
};

type HeroFormValues = {
  hero_description: string;
  desktop_image: string | null;
  mobile_image: string | null;
};

const BrandingSection = ({ event, eventId }: BrandingSectionProps) => {
  const [updateEvent, { isLoading: isUpdatingHero }] = useUpdateEventMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();
  const [hasHeroChanges, setHasHeroChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('desktop');

  const heroForm = useForm<HeroFormValues>({
    initialValues: {
      hero_description: event?.hero_description || '',
      desktop_image: event?.hero_images?.desktop || null,
      mobile_image: event?.hero_images?.mobile || null,
    },
  });

  // Track hero changes
  useEffect(() => {
    const checkHeroChanges = () => {
      const descChanged = heroForm.values.hero_description !== (event?.hero_description || '');
      const desktopChanged =
        heroForm.values.desktop_image !== (event?.hero_images?.desktop || null);
      const mobileChanged = heroForm.values.mobile_image !== (event?.hero_images?.mobile || null);

      setHasHeroChanges(descChanged || desktopChanged || mobileChanged);
    };

    checkHeroChanges();
  }, [heroForm.values, event]);

  const handleFileUpload = async (file: File | null, field: string) => {
    if (!file) return;

    let context: string;
    if (field === 'logo_url') {
      context = 'event_logo';
    } else if (field === 'desktop_image' || field === 'mobile_image') {
      context = 'event_banner';
    } else {
      return;
    }

    try {
      const result = await uploadImage({
        file,
        context,
        eventId,
      }).unwrap();

      // Store the object_key instead of URL for private images
      heroForm.setFieldValue(
        field as keyof HeroFormValues,
        (result as { object_key: string }).object_key,
      );

      notifications.show({
        title: 'Success',
        message: `${
          field === 'logo_url' ? 'Logo'
          : field === 'desktop_image' ? 'Desktop hero image'
          : 'Mobile hero image'
        } uploaded successfully`,
        color: 'green',
      });
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage =
        apiError.data?.message ||
        `Failed to upload ${field === 'logo_url' ? 'logo' : 'hero image'}`;
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    }
  };

  const handleRemoveImage = (field: string) => {
    heroForm.setFieldValue(field as keyof HeroFormValues, null);
  };

  const handleHeroSubmit = async (values: HeroFormValues) => {
    try {
      await updateEvent({
        id: eventId,
        hero_description: values.hero_description || null,
        hero_images: {
          desktop: values.desktop_image,
          mobile: values.mobile_image,
        },
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: 'Hero section updated successfully',
        color: 'green',
      });
      setHasHeroChanges(false);
    } catch (error) {
      const apiError = error as ApiError;
      notifications.show({
        title: 'Error',
        message: apiError.data?.message || 'Failed to update hero section',
        color: 'red',
      });
    }
  };

  const handleHeroReset = () => {
    heroForm.setValues({
      hero_description: event?.hero_description || '',
      desktop_image: event?.hero_images?.desktop || null,
      mobile_image: event?.hero_images?.mobile || null,
    });
    setHasHeroChanges(false);
  };

  return (
    <div className={cn(parentStyles.section)}>
      {/* Hero Section */}
      <div className={cn(styles.heroSection)}>
        <h3 className={cn(parentStyles.sectionTitle)}>Hero Section</h3>
        <Text c='dimmed' size='sm' mb='xl'>
          The hero section appears at the top of your event page
        </Text>

        <form onSubmit={heroForm.onSubmit(handleHeroSubmit)}>
          <Stack gap='lg'>
            <Textarea
              label='Hero Description'
              description='A compelling description that appears in the hero section'
              placeholder='Join us for an amazing event...'
              minRows={4}
              classNames={{
                input: styles.formInput ?? '',
                label: styles.formLabel ?? '',
                description: styles.formDescription ?? '',
              }}
              {...heroForm.getInputProps('hero_description')}
            />

            <div>
              <h4 className={cn(styles.subsectionTitle)}>Hero Images</h4>
              <Text c='dimmed' size='sm' mb='md'>
                Upload different images for desktop and mobile views
              </Text>

              <Tabs
                value={activeTab}
                onChange={setActiveTab}
                classNames={{
                  root: styles.heroTabs ?? '',
                  list: styles.heroTabsList ?? '',
                  tab: styles.heroTab ?? '',
                }}
              >
                <Tabs.List>
                  <Tabs.Tab value='desktop' leftSection={<IconDeviceDesktop size={16} />}>
                    <span className={cn(styles.tabTextFull)}>Desktop Image</span>
                    <span className={cn(styles.tabTextShort)}>Desktop</span>
                  </Tabs.Tab>
                  <Tabs.Tab value='mobile' leftSection={<IconDeviceMobile size={16} />}>
                    <span className={cn(styles.tabTextFull)}>Mobile Image</span>
                    <span className={cn(styles.tabTextShort)}>Mobile</span>
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value='desktop' className={cn(styles.heroTabPanel)}>
                  {heroForm.values.desktop_image ?
                    <div className={cn(styles.heroImagePreviewCard)}>
                      <Box className={cn(styles.heroImagePreviewWrapper)}>
                        <PrivateImage
                          objectKey={heroForm.values.desktop_image}
                          alt='Desktop hero image'
                          fit='cover'
                          height={300}
                        />
                      </Box>
                      <Button
                        variant='secondary'
                        onClick={() => handleRemoveImage('desktop_image')}
                        style={{ marginTop: 'var(--mantine-spacing-md)' }}
                      >
                        <IconX size={16} />
                        Remove Desktop Image
                      </Button>
                    </div>
                  : <FileInput
                      label='Upload Desktop Hero Image'
                      description='Recommended: 1920x600px, PNG or JPG'
                      placeholder='Click to upload desktop hero image'
                      accept='image/*'
                      leftSection={<IconUpload size={16} />}
                      onChange={(file) => handleFileUpload(file, 'desktop_image')}
                      disabled={isUploading}
                      classNames={{
                        input: styles.formInput ?? '',
                        label: styles.formLabel ?? '',
                        description: styles.formDescription ?? '',
                      }}
                    />
                  }
                </Tabs.Panel>

                <Tabs.Panel value='mobile' className={cn(styles.heroTabPanel)}>
                  {heroForm.values.mobile_image ?
                    <div className={cn(styles.heroImagePreviewCard)}>
                      <Box className={cn(styles.heroImagePreviewWrapper)}>
                        <PrivateImage
                          objectKey={heroForm.values.mobile_image}
                          alt='Mobile hero image'
                          fit='cover'
                          height={300}
                        />
                      </Box>
                      <Button
                        variant='secondary'
                        onClick={() => handleRemoveImage('mobile_image')}
                        style={{ marginTop: 'var(--mantine-spacing-md)' }}
                      >
                        <IconX size={16} />
                        Remove Mobile Image
                      </Button>
                    </div>
                  : <FileInput
                      label='Upload Mobile Hero Image'
                      description='Recommended: 800x400px, PNG or JPG'
                      placeholder='Click to upload mobile hero image'
                      accept='image/*'
                      leftSection={<IconUpload size={16} />}
                      onChange={(file) => handleFileUpload(file, 'mobile_image')}
                      disabled={isUploading}
                      classNames={{
                        input: styles.formInput ?? '',
                        label: styles.formLabel ?? '',
                        description: styles.formDescription ?? '',
                      }}
                    />
                  }
                </Tabs.Panel>
              </Tabs>
            </div>

            {hasHeroChanges && (
              <Group justify='flex-end' className={cn(parentStyles.formActions)}>
                <Button variant='secondary' onClick={handleHeroReset}>
                  <IconX size={16} />
                  Cancel
                </Button>
                <Button type='submit' variant='primary' loading={isUpdatingHero}>
                  <IconCheck size={16} />
                  Save Hero Section
                </Button>
              </Group>
            )}
          </Stack>
        </form>
      </div>
    </div>
  );
};

export default BrandingSection;
