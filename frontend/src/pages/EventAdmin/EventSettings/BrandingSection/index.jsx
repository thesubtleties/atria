import { useState, useEffect } from 'react';
import { 
  ColorInput, 
  Stack, 
  Group, 
  Button,
  Paper,
  Title,
  Text,
  FileInput,
  Box,
  Card,
  Tabs,
  Textarea
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconX, IconDeviceDesktop, IconDeviceMobile } from '@tabler/icons-react';
import { useUpdateEventBrandingMutation, useUpdateEventMutation } from '@/app/features/events/api';
import { useUploadImageMutation } from '@/app/features/uploads/api';
import { eventBrandingSchema } from '../schemas/eventSettingsSchemas';
import PrivateImage from '@/shared/components/PrivateImage';
import styles from './styles.module.css';

const BrandingSection = ({ event, eventId }) => {
  const [updateBranding, { isLoading: isUpdatingBranding }] = useUpdateEventBrandingMutation();
  const [updateEvent, { isLoading: isUpdatingHero }] = useUpdateEventMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();
  const [hasChanges, setHasChanges] = useState(false);
  const [hasHeroChanges, setHasHeroChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('desktop');

  const form = useForm({
    initialValues: {
      primary_color: event?.branding?.primary_color || '#000000',
      secondary_color: event?.branding?.secondary_color || '#ffffff',
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
      primary_color: event?.branding?.primary_color || '#000000',
      secondary_color: event?.branding?.secondary_color || '#ffffff',
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
    <Paper className={styles.section}>
      <Title order={3} mb="lg">Event Branding</Title>
      
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="lg">
          <Group grow>
            <ColorInput
              label="Primary Color"
              description="Main brand color for the event"
              format="hex"
              swatches={['#25262b', '#868e96', '#fa5252', '#e64980', '#be4bdb', '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886', '#40c057', '#82c91e', '#fab005', '#fd7e14']}
              {...form.getInputProps('primary_color')}
            />

            <ColorInput
              label="Secondary Color"
              description="Accent color for the event"
              format="hex"
              swatches={['#25262b', '#868e96', '#fa5252', '#e64980', '#be4bdb', '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886', '#40c057', '#82c91e', '#fab005', '#fd7e14']}
              {...form.getInputProps('secondary_color')}
            />
          </Group>

          <Stack spacing="md">
            <Title order={4}>Event Logo</Title>
            {form.values.logo_url ? (
              <Card withBorder p="md">
                <Group>
                  <Box className={styles.imagePreview}>
                    <PrivateImage
                      objectKey={form.values.logo_url}
                      alt="Event logo"
                      fit="contain"
                      height={100}
                    />
                  </Box>
                  <Button
                    variant="light"
                    color="red"
                    leftSection={<IconX size={16} />}
                    onClick={() => handleRemoveImage('logo_url')}
                  >
                    Remove Logo
                  </Button>
                </Group>
              </Card>
            ) : (
              <FileInput
                label="Upload Logo"
                description="Recommended: 200x200px, PNG or JPG"
                placeholder="Click to upload logo"
                accept="image/*"
                leftSection={<IconUpload size={16} />}
                onChange={(file) => handleFileUpload(file, 'logo_url')}
                disabled={isUploading}
              />
            )}
          </Stack>

          {hasChanges && (
            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button type="submit" loading={isUpdatingBranding}>
                Save Branding
              </Button>
            </Group>
          )}
        </Stack>
      </form>

      {/* Hero Section */}
      <form onSubmit={heroForm.onSubmit(handleHeroSubmit)}>
        <Stack spacing="lg" mt="xl">
          <Title order={4}>Hero Section</Title>
          <Text c="dimmed" size="sm">
            The hero section appears at the top of your event page
          </Text>
          
          <Textarea
            label="Hero Description"
            description="A compelling description that appears in the hero section"
            placeholder="Join us for an amazing event..."
            minRows={4}
            {...heroForm.getInputProps('hero_description')}
          />

          <Stack spacing="md">
            <Title order={5}>Hero Images</Title>
            <Text c="dimmed" size="sm">
              Upload different images for desktop and mobile views
            </Text>

            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="desktop" leftSection={<IconDeviceDesktop size={16} />}>
                  Desktop Image
                </Tabs.Tab>
                <Tabs.Tab value="mobile" leftSection={<IconDeviceMobile size={16} />}>
                  Mobile Image
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="desktop" pt="md">
                {heroForm.values.desktop_image ? (
                  <Card withBorder p="md">
                    <Box className={styles.heroImagePreview}>
                      <PrivateImage
                        objectKey={heroForm.values.desktop_image}
                        alt="Desktop hero image"
                        fit="cover"
                        height={300}
                      />
                    </Box>
                    <Button
                      variant="light"
                      color="red"
                      leftSection={<IconX size={16} />}
                      onClick={() => handleRemoveImage('desktop_image')}
                      mt="md"
                    >
                      Remove Desktop Image
                    </Button>
                  </Card>
                ) : (
                  <FileInput
                    label="Upload Desktop Hero Image"
                    description="Recommended: 1920x600px, PNG or JPG"
                    placeholder="Click to upload desktop hero image"
                    accept="image/*"
                    leftSection={<IconUpload size={16} />}
                    onChange={(file) => handleFileUpload(file, 'desktop_image')}
                    disabled={isUploading}
                  />
                )}
              </Tabs.Panel>

              <Tabs.Panel value="mobile" pt="md">
                {heroForm.values.mobile_image ? (
                  <Card withBorder p="md">
                    <Box className={styles.heroImagePreview}>
                      <PrivateImage
                        objectKey={heroForm.values.mobile_image}
                        alt="Mobile hero image"
                        fit="cover"
                        height={300}
                      />
                    </Box>
                    <Button
                      variant="light"
                      color="red"
                      leftSection={<IconX size={16} />}
                      onClick={() => handleRemoveImage('mobile_image')}
                      mt="md"
                    >
                      Remove Mobile Image
                    </Button>
                  </Card>
                ) : (
                  <FileInput
                    label="Upload Mobile Hero Image"
                    description="Recommended: 800x400px, PNG or JPG"
                    placeholder="Click to upload mobile hero image"
                    accept="image/*"
                    leftSection={<IconUpload size={16} />}
                    onChange={(file) => handleFileUpload(file, 'mobile_image')}
                    disabled={isUploading}
                  />
                )}
              </Tabs.Panel>
            </Tabs>
          </Stack>

          {hasHeroChanges && (
            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={handleHeroReset}>
                Cancel
              </Button>
              <Button type="submit" loading={isUpdatingHero}>
                Save Hero Section
              </Button>
            </Group>
          )}
        </Stack>
      </form>
    </Paper>
  );
};

export default BrandingSection;