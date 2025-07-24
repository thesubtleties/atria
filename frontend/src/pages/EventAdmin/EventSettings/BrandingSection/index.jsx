import { useState, useEffect } from 'react';
import { 
  ColorInput, 
  Stack, 
  Group,
  Text,
  FileInput,
  Box,
  Tabs,
  Textarea,
  Divider
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconX, IconDeviceDesktop, IconDeviceMobile, IconCheck } from '@tabler/icons-react';
import { useUpdateEventBrandingMutation, useUpdateEventMutation } from '@/app/features/events/api';
import { useUploadImageMutation } from '@/app/features/uploads/api';
import { eventBrandingSchema } from '../schemas/eventSettingsSchemas';
import PrivateImage from '@/shared/components/PrivateImage';
import { Button } from '@/shared/components/buttons';
import styles from './styles.module.css';
import parentStyles from '../styles/index.module.css';

const BrandingSection = ({ event, eventId }) => {
  const [updateBranding, { isLoading: isUpdatingBranding }] = useUpdateEventBrandingMutation();
  const [updateEvent, { isLoading: isUpdatingHero }] = useUpdateEventMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();
  const [hasChanges, setHasChanges] = useState(false);
  const [hasHeroChanges, setHasHeroChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('desktop');

  const form = useForm({
    initialValues: {
      primary_color: event?.branding?.primary_color || '#8B5CF6',
      secondary_color: event?.branding?.secondary_color || '#F59E0B',
      logo_url: event?.branding?.logo_url || null,
    },
    resolver: zodResolver(eventBrandingSchema),
  });

  const heroForm = useForm({
    initialValues: {
      hero_description: event?.hero_description || '',
      desktop_image: event?.hero_images?.desktop || null,
      mobile_image: event?.hero_images?.mobile || null,
    },
  });

  // Track changes
  useEffect(() => {
    const checkChanges = () => {
      const changed = Object.keys(form.values).some(key => {
        return form.values[key] !== event?.branding?.[key];
      });
      setHasChanges(changed);
    };

    checkChanges();
  }, [form.values, event]);

  // Track hero changes
  useEffect(() => {
    const checkHeroChanges = () => {
      const descChanged = heroForm.values.hero_description !== event?.hero_description;
      const desktopChanged = heroForm.values.desktop_image !== event?.hero_images?.desktop;
      const mobileChanged = heroForm.values.mobile_image !== event?.hero_images?.mobile;
      
      setHasHeroChanges(descChanged || desktopChanged || mobileChanged);
    };

    checkHeroChanges();
  }, [heroForm.values, event]);

  const handleFileUpload = async (file, field) => {
    if (!file) return;

    let context;
    if (field === 'logo_url') {
      context = 'event_logo';
    } else if (field === 'desktop_image' || field === 'mobile_image') {
      context = 'event_banner';
    }

    try {
      const result = await uploadImage({
        file,
        context,
        eventId
      }).unwrap();
      
      // Store the object_key instead of URL for private images
      if (field === 'logo_url') {
        form.setFieldValue(field, result.object_key);
      } else {
        heroForm.setFieldValue(field, result.object_key);
      }
      
      notifications.show({
        title: 'Success',
        message: `${field === 'logo_url' ? 'Logo' : field === 'desktop_image' ? 'Desktop hero image' : 'Mobile hero image'} uploaded successfully`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: `Failed to upload ${field === 'logo_url' ? 'logo' : 'hero image'}`,
        color: 'red',
      });
    }
  };

  const handleRemoveImage = (field) => {
    if (field === 'logo_url') {
      form.setFieldValue(field, null);
    } else {
      heroForm.setFieldValue(field, null);
    }
  };

  const handleSubmit = async (values) => {
    try {
      await updateBranding({
        id: eventId,
        ...values,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: 'Event branding updated successfully',
        color: 'green',
      });
      setHasChanges(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to update branding',
        color: 'red',
      });
    }
  };

  const handleHeroSubmit = async (values) => {
    try {
      await updateEvent({
        id: eventId,
        hero_description: values.hero_description,
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
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to update hero section',
        color: 'red',
      });
    }
  };

  const handleReset = () => {
    form.setValues({
      primary_color: event?.branding?.primary_color || '#8B5CF6',
      secondary_color: event?.branding?.secondary_color || '#F59E0B',
      logo_url: event?.branding?.logo_url || null,
    });
    setHasChanges(false);
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
    <div className={parentStyles.section}>
      {/* Branding Section */}
      <div className={styles.brandingSection}>
        <h3 className={parentStyles.sectionTitle}>Event Branding</h3>
        <Text c="dimmed" size="sm" mb="xl">
          Customize your event's visual identity
        </Text>
        
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack spacing="lg">
            <Group grow>
              <ColorInput
                label="Primary Color"
                description="Main brand color for the event"
                format="hex"
                swatches={['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95', '#F59E0B', '#EAB308', '#CA8A04', '#A16207', '#854D0E']}
                classNames={{
                  input: styles.colorInput,
                  label: styles.formLabel,
                  description: styles.formDescription
                }}
                {...form.getInputProps('primary_color')}
              />

              <ColorInput
                label="Secondary Color"
                description="Accent color for the event"
                format="hex"
                swatches={['#F59E0B', '#FB923C', '#F97316', '#EA580C', '#DC2626', '#8B5CF6', '#A855F7', '#A78BFA', '#818CF8', '#6366F1']}
                classNames={{
                  input: styles.colorInput,
                  label: styles.formLabel,
                  description: styles.formDescription
                }}
                {...form.getInputProps('secondary_color')}
              />
            </Group>

            <div className={styles.logoSection}>
              <h4 className={styles.subsectionTitle}>Event Logo</h4>
              {form.values.logo_url ? (
                <div className={styles.imagePreviewCard}>
                  <Box className={styles.imagePreviewWrapper}>
                    <PrivateImage
                      objectKey={form.values.logo_url}
                      alt="Event logo"
                      fit="contain"
                      height={100}
                    />
                  </Box>
                  <Button
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => handleRemoveImage('logo_url')}
                  >
                    <IconX size={16} />
                    Remove Logo
                  </Button>
                </div>
              ) : (
                <FileInput
                  label="Upload Logo"
                  description="Recommended: 200x200px, PNG or JPG"
                  placeholder="Click to upload logo"
                  accept="image/*"
                  leftSection={<IconUpload size={16} />}
                  onChange={(file) => handleFileUpload(file, 'logo_url')}
                  disabled={isUploading}
                  classNames={{
                    input: styles.formInput,
                    label: styles.formLabel,
                    description: styles.formDescription
                  }}
                />
              )}
            </div>

            {hasChanges && (
              <Group justify="flex-end" className={parentStyles.formActions}>
                <Button variant="subtle" onClick={handleReset}>
                  <IconX size={16} />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  loading={isUpdatingBranding}
                >
                  <IconCheck size={16} />
                  Save Branding
                </Button>
              </Group>
            )}
          </Stack>
        </form>
      </div>

      <Divider my="xl" className={styles.sectionDivider} />

      {/* Hero Section */}
      <div className={styles.heroSection}>
        <h3 className={parentStyles.sectionTitle}>Hero Section</h3>
        <Text c="dimmed" size="sm" mb="xl">
          The hero section appears at the top of your event page
        </Text>
        
        <form onSubmit={heroForm.onSubmit(handleHeroSubmit)}>
          <Stack spacing="lg">
            <Textarea
              label="Hero Description"
              description="A compelling description that appears in the hero section"
              placeholder="Join us for an amazing event..."
              minRows={4}
              classNames={{
                input: styles.formInput,
                label: styles.formLabel,
                description: styles.formDescription
              }}
              {...heroForm.getInputProps('hero_description')}
            />

            <div>
              <h4 className={styles.subsectionTitle}>Hero Images</h4>
              <Text c="dimmed" size="sm" mb="md">
                Upload different images for desktop and mobile views
              </Text>

              <Tabs 
                value={activeTab} 
                onChange={setActiveTab}
                classNames={{
                  root: styles.heroTabs,
                  list: styles.heroTabsList,
                  tab: styles.heroTab
                }}
              >
                <Tabs.List>
                  <Tabs.Tab value="desktop" leftSection={<IconDeviceDesktop size={16} />}>
                    Desktop Image
                  </Tabs.Tab>
                  <Tabs.Tab value="mobile" leftSection={<IconDeviceMobile size={16} />}>
                    Mobile Image
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="desktop" className={styles.heroTabPanel}>
                  {heroForm.values.desktop_image ? (
                    <div className={styles.heroImagePreviewCard}>
                      <Box className={styles.heroImagePreviewWrapper}>
                        <PrivateImage
                          objectKey={heroForm.values.desktop_image}
                          alt="Desktop hero image"
                          fit="cover"
                          height={300}
                        />
                      </Box>
                      <Button
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => handleRemoveImage('desktop_image')}
                        mt="md"
                      >
                        <IconX size={16} />
                        Remove Desktop Image
                      </Button>
                    </div>
                  ) : (
                    <FileInput
                      label="Upload Desktop Hero Image"
                      description="Recommended: 1920x600px, PNG or JPG"
                      placeholder="Click to upload desktop hero image"
                      accept="image/*"
                      leftSection={<IconUpload size={16} />}
                      onChange={(file) => handleFileUpload(file, 'desktop_image')}
                      disabled={isUploading}
                      classNames={{
                        input: styles.formInput,
                        label: styles.formLabel,
                        description: styles.formDescription
                      }}
                    />
                  )}
                </Tabs.Panel>

                <Tabs.Panel value="mobile" className={styles.heroTabPanel}>
                  {heroForm.values.mobile_image ? (
                    <div className={styles.heroImagePreviewCard}>
                      <Box className={styles.heroImagePreviewWrapper}>
                        <PrivateImage
                          objectKey={heroForm.values.mobile_image}
                          alt="Mobile hero image"
                          fit="cover"
                          height={300}
                        />
                      </Box>
                      <Button
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => handleRemoveImage('mobile_image')}
                        mt="md"
                      >
                        <IconX size={16} />
                        Remove Mobile Image
                      </Button>
                    </div>
                  ) : (
                    <FileInput
                      label="Upload Mobile Hero Image"
                      description="Recommended: 800x400px, PNG or JPG"
                      placeholder="Click to upload mobile hero image"
                      accept="image/*"
                      leftSection={<IconUpload size={16} />}
                      onChange={(file) => handleFileUpload(file, 'mobile_image')}
                      disabled={isUploading}
                      classNames={{
                        input: styles.formInput,
                        label: styles.formLabel,
                        description: styles.formDescription
                      }}
                    />
                  )}
                </Tabs.Panel>
              </Tabs>
            </div>

            {hasHeroChanges && (
              <Group justify="flex-end" className={parentStyles.formActions}>
                <Button variant="subtle" onClick={handleHeroReset}>
                  <IconX size={16} />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  loading={isUpdatingHero}
                >
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