import { useState, useEffect } from 'react';
import { 
  ColorInput, 
  Stack, 
  Group, 
  Button,
  Paper,
  Title,
  Text,
  Image,
  FileInput,
  Box,
  Card
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconX } from '@tabler/icons-react';
import { useUpdateEventBrandingMutation } from '@/app/features/events/api';
import { useUploadImageMutation } from '@/app/features/uploads/api';
import { eventBrandingSchema } from '../schemas/eventSettingsSchemas';
import styles from './styles.module.css';

const BrandingSection = ({ event, eventId }) => {
  const [updateBranding, { isLoading: isUpdating }] = useUpdateEventBrandingMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();
  const [hasChanges, setHasChanges] = useState(false);

  const form = useForm({
    initialValues: {
      primary_color: event?.branding?.primary_color || '#000000',
      secondary_color: event?.branding?.secondary_color || '#ffffff',
      logo_url: event?.branding?.logo_url || null,
      banner_url: event?.branding?.banner_url || null,
    },
    resolver: zodResolver(eventBrandingSchema),
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

  const handleFileUpload = async (file, field) => {
    if (!file) return;

    try {
      const result = await uploadImage({
        file,
        context: field === 'logo_url' ? 'event_logo' : 'event_banner',
        eventId
      }).unwrap();
      form.setFieldValue(field, result.url);
      
      notifications.show({
        title: 'Success',
        message: `${field === 'logo_url' ? 'Logo' : 'Banner'} uploaded successfully`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: `Failed to upload ${field === 'logo_url' ? 'logo' : 'banner'}`,
        color: 'red',
      });
    }
  };

  const handleRemoveImage = (field) => {
    form.setFieldValue(field, null);
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

  const handleReset = () => {
    form.setValues({
      primary_color: event?.branding?.primary_color || '#000000',
      secondary_color: event?.branding?.secondary_color || '#ffffff',
      logo_url: event?.branding?.logo_url || null,
      banner_url: event?.branding?.banner_url || null,
    });
    setHasChanges(false);
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
                    <Image
                      src={form.values.logo_url}
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

          <Stack spacing="md">
            <Title order={4}>Event Banner</Title>
            {form.values.banner_url ? (
              <Card withBorder p="md">
                <Box className={styles.bannerPreview}>
                  <Image
                    src={form.values.banner_url}
                    alt="Event banner"
                    fit="cover"
                    height={150}
                  />
                </Box>
                <Button
                  variant="light"
                  color="red"
                  leftSection={<IconX size={16} />}
                  onClick={() => handleRemoveImage('banner_url')}
                  mt="md"
                >
                  Remove Banner
                </Button>
              </Card>
            ) : (
              <FileInput
                label="Upload Banner"
                description="Recommended: 1200x300px, PNG or JPG"
                placeholder="Click to upload banner"
                accept="image/*"
                leftSection={<IconUpload size={16} />}
                onChange={(file) => handleFileUpload(file, 'banner_url')}
                disabled={isUploading}
              />
            )}
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

export default BrandingSection;