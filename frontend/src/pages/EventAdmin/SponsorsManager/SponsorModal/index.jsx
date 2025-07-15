import React, { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Grid,
  TextInput,
  Textarea,
  Select,
  Text,
  Group,
  Button,
  FileButton,
  Image,
  Box,
} from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useCreateSponsorMutation,
  useUpdateSponsorMutation,
  useGetSponsorTiersQuery,
} from '../../../../app/features/sponsors/api';
import { useUploadImageMutation } from '../../../../app/features/uploads/api';
import { validateField, validateSocialLink, sponsorSchema } from '../schemas/sponsorSchema';
import styles from './styles/index.module.css';

const SponsorModal = ({ opened, onClose, eventId, mode, sponsor }) => {
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    websiteUrl: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    tierId: '',
    socialLinks: {
      twitter: '',
      linkedin: '',
      facebook: '',
      instagram: '',
    },
  });

  const { data: sponsorTiers = [] } = useGetSponsorTiersQuery({ eventId });
  const [createSponsor, { isLoading: isCreating }] = useCreateSponsorMutation();
  const [updateSponsor, { isLoading: isUpdating }] = useUpdateSponsorMutation();
  const [uploadImage] = useUploadImageMutation();

  useEffect(() => {
    if (mode === 'edit' && sponsor) {
      setFormData({
        name: sponsor.name,
        description: sponsor.description || '',
        websiteUrl: sponsor.website_url || '',
        contactName: sponsor.contact_name || '',
        contactEmail: sponsor.contact_email || '',
        contactPhone: sponsor.contact_phone || '',
        tierId: sponsor.tier_id || '',
        socialLinks: sponsor.social_links || {
          twitter: '',
          linkedin: '',
          facebook: '',
          instagram: '',
        },
      });
      setLogoPreview(sponsor.logo_url);
    }
  }, [mode, sponsor]);

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Map frontend field names to schema field names
    const schemaField = {
      websiteUrl: 'website_url',
      contactName: 'contact_name',
      contactEmail: 'contact_email',
      contactPhone: 'contact_phone',
      tierId: 'tier_id',
    }[field] || field;
    
    const validation = validateField(schemaField, value);
    if (!validation.success) {
      setErrors({ ...errors, [field]: validation.error.errors[0].message });
    } else {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleSocialLinkChange = (platform, value) => {
    setFormData({
      ...formData,
      socialLinks: { ...formData.socialLinks, [platform]: value }
    });
    
    const validation = validateSocialLink(platform, value);
    const errorKey = `social_${platform}`;
    
    if (!validation.success) {
      setErrors({ ...errors, [errorKey]: validation.error.errors[0].message });
    } else {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const handleSubmit = async () => {
    // Validate all fields before submission
    const dataToValidate = {
      name: formData.name,
      description: formData.description,
      website_url: formData.websiteUrl,
      contact_name: formData.contactName,
      contact_email: formData.contactEmail,
      contact_phone: formData.contactPhone,
      tier_id: formData.tierId,
      social_links: formData.socialLinks,
    };
    
    const validation = sponsorSchema.safeParse(dataToValidate);
    
    if (!validation.success) {
      const fieldErrors = {};
      validation.error.errors.forEach(err => {
        const path = err.path.join('.');
        // Map schema fields back to frontend field names
        const frontendField = {
          'website_url': 'websiteUrl',
          'contact_name': 'contactName',
          'contact_email': 'contactEmail',
          'contact_phone': 'contactPhone',
          'tier_id': 'tierId',
        }[path] || path;
        fieldErrors[frontendField] = err.message;
      });
      setErrors(fieldErrors);
      
      notifications.show({
        title: 'Validation Error',
        message: 'Please fix the errors in the form',
        color: 'red',
      });
      return;
    }
    
    try {
      let logoUrl = null;

      // Upload logo if provided
      if (logoFile) {
        const uploadResult = await uploadImage({
          file: logoFile,
          context: 'sponsor_logo',
          eventId,
        }).unwrap();
        logoUrl = uploadResult.url;
      }

      // Convert empty strings to null and map field names
      const dataToSend = {
        name: formData.name,
        description: formData.description || null,
        website_url: formData.websiteUrl || null,
        contact_name: formData.contactName || null,
        contact_email: formData.contactEmail || null,
        contact_phone: formData.contactPhone || null,
        tier_id: formData.tierId || null,
        social_links: formData.socialLinks,
        ...(logoUrl && { logo_url: logoUrl }),
      };

      if (mode === 'create') {
        await createSponsor({
          eventId,
          ...dataToSend,
        }).unwrap();
      } else {
        await updateSponsor({
          sponsorId: sponsor.id,
          ...dataToSend,
        }).unwrap();
      }

      notifications.show({
        title: 'Success',
        message: `Sponsor ${mode === 'create' ? 'created' : 'updated'} successfully`,
        color: 'green',
      });

      handleClose();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || `Failed to ${mode} sponsor`,
        color: 'red',
      });
    }
  };

  const handleClose = () => {
    resetForm();
    setErrors({});
    onClose();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      websiteUrl: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      tierId: '',
      socialLinks: {
        twitter: '',
        linkedin: '',
        facebook: '',
        instagram: '',
      },
    });
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleLogoSelect = (file) => {
    setLogoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={mode === 'edit' ? 'Edit Sponsor' : 'Add New Sponsor'}
      size="lg"
    >
      <Stack>
        <Grid>
          <Grid.Col span={8}>
            <TextInput
              label="Sponsor Name"
              placeholder="Enter sponsor name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              label="Tier"
              placeholder="Select tier"
              data={sponsorTiers.map(tier => ({
                value: tier.id,
                label: tier.name,
              }))}
              value={formData.tierId}
              onChange={(value) => handleFieldChange('tierId', value)}
              clearable
              error={errors.tierId}
            />
          </Grid.Col>
        </Grid>

        <Textarea
          label="Description"
          placeholder="Enter sponsor description"
          rows={3}
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          error={errors.description}
        />

        <TextInput
          label="Website URL"
          placeholder="https://example.com"
          value={formData.websiteUrl}
          onChange={(e) => handleFieldChange('websiteUrl', e.target.value)}
          error={errors.websiteUrl}
        />

        <Group>
          <Box>
            <Text size="sm" fw={500} mb="xs">Logo</Text>
            <FileButton
              onChange={handleLogoSelect}
              accept="image/png,image/jpeg,image/gif,image/webp"
            >
              {(props) => (
                <Button {...props} variant="outline" leftSection={<IconUpload size={16} />}>
                  Upload Logo
                </Button>
              )}
            </FileButton>
          </Box>
          {logoPreview && (
            <Image
              src={logoPreview}
              alt="Logo preview"
              width={100}
              height={100}
              fit="contain"
            />
          )}
        </Group>

        <Text fw={500} size="lg" mt="md">Contact Information</Text>
        
        <Grid>
          <Grid.Col span={4}>
            <TextInput
              label="Contact Name"
              placeholder="John Doe"
              value={formData.contactName}
              onChange={(e) => handleFieldChange('contactName', e.target.value)}
              error={errors.contactName}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label="Contact Email"
              placeholder="contact@example.com"
              value={formData.contactEmail}
              onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
              error={errors.contactEmail}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label="Contact Phone"
              placeholder="+1234567890"
              value={formData.contactPhone}
              onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
              error={errors.contactPhone}
            />
          </Grid.Col>
        </Grid>

        <Text fw={500} size="lg" mt="md">Social Media Links</Text>

        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="Twitter"
              placeholder="https://twitter.com/username"
              value={formData.socialLinks.twitter}
              onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
              error={errors.social_twitter}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="LinkedIn"
              placeholder="https://linkedin.com/company/name"
              value={formData.socialLinks.linkedin}
              onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
              error={errors.social_linkedin}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Facebook"
              placeholder="https://facebook.com/page"
              value={formData.socialLinks.facebook}
              onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
              error={errors.social_facebook}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Instagram"
              placeholder="https://instagram.com/username"
              value={formData.socialLinks.instagram}
              onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
              error={errors.social_instagram}
            />
          </Grid.Col>
        </Grid>

        <Group justify="flex-end" mt="xl">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isCreating || isUpdating}
          >
            {mode === 'edit' ? 'Update' : 'Create'} Sponsor
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default SponsorModal;