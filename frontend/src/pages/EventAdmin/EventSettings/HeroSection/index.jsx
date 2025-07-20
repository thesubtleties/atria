import { useState, useEffect } from 'react';
import { 
  Textarea, 
  Stack, 
  Group, 
  Button,
  Paper,
  Title,
  Text,
  Image,
  FileInput,
  Box,
  Card,
  Tabs
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconX, IconDeviceDesktop, IconDeviceMobile } from '@tabler/icons-react';
import { useUpdateEventMutation } from '@/app/features/events/api';
import { useUploadImageMutation } from '@/app/features/uploads/api';
import { heroSectionSchema } from '../schemas/eventSettingsSchemas';
import styles from './styles.module.css';

const HeroSection = ({ event, eventId }) => {
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('desktop');

  const form = useForm({
    initialValues: {
      hero_description: event?.hero_description || '',
      desktop_image: event?.hero_images?.desktop || null,
      mobile_image: event?.hero_images?.mobile || null,
    },
    resolver: zodResolver(heroSectionSchema),
  });

  // Track changes
  useEffect(() => {
    const checkChanges = () => {
      const descChanged = form.values.hero_description !== event?.hero_description;
      const desktopChanged = form.values.desktop_image !== event?.hero_images?.desktop;
      const mobileChanged = form.values.mobile_image !== event?.hero_images?.mobile;
      
      setHasChanges(descChanged || desktopChanged || mobileChanged);
    };

    checkChanges();
  }, [form.values, event]);

  const handleFileUpload = async (file, field) => {
    if (!file) return;

    try {
      const result = await uploadImage({
        file,
        context: field === 'desktop_image' ? 'event_hero_desktop' : 'event_hero_mobile',
        eventId
      }).unwrap();
      
      form.setFieldValue(field, result.url);
      
      notifications.show({
        title: 'Success',
        message: `${field === 'desktop_image' ? 'Desktop' : 'Mobile'} hero image uploaded successfully`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: `Failed to upload hero image`,
        color: 'red',
      });
    }
  };

  const handleRemoveImage = (field) => {
    form.setFieldValue(field, null);
  };

  const handleSubmit = async (values) => {
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
      setHasChanges(false);
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
      hero_description: event?.hero_description || '',
      desktop_image: event?.hero_images?.desktop || null,
      mobile_image: event?.hero_images?.mobile || null,
    });
    setHasChanges(false);
  };

  return (
    <Paper className={styles.section}>
      <Title order={3} mb="lg">Hero Section</Title>
      <Text c="dimmed" size="sm" mb="lg">
        The hero section appears at the top of your event page
      </Text>
      
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="lg">
          <Textarea
            label="Hero Description"
            description="A compelling description that appears in the hero section"
            placeholder="Join us for an amazing event..."
            minRows={4}
            {...form.getInputProps('hero_description')}
          />

          <Stack spacing="md">
            <Title order={4}>Hero Images</Title>
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
                {form.values.desktop_image ? (
                  <Card withBorder p="md">
                    <Box className={styles.heroImagePreview}>
                      <Image
                        src={form.values.desktop_image}
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
                {form.values.mobile_image ? (
                  <Card withBorder p="md">
                    <Box className={styles.heroImagePreview}>
                      <Image
                        src={form.values.mobile_image}
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

          {hasChanges && (
            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button type="submit" loading={isUpdating}>
                Save Changes
              </Button>
            </Group>
          )}
        </Stack>
      </form>
    </Paper>
  );
};

export default HeroSection;