import { useState } from 'react';
import { Modal, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { Button } from '../../../../shared/components/buttons';
import {
  useCreateSponsorMutation,
  useUpdateSponsorMutation,
  useGetSponsorTiersQuery,
} from '../../../../app/features/sponsors/api';
import { useUploadImageMutation } from '../../../../app/features/uploads/api';
import useSponsorForm from './useSponsorForm';
import BasicInfoSection from './BasicInfoSection';
import ContactInfoSection from './ContactInfoSection';
import SocialLinksSection from './SocialLinksSection';
import LogoUploadSection from './LogoUploadSection';
import styles from './styles/index.module.css';

const SponsorModal = ({
  opened,
  onClose,
  eventId,
  mode,
  sponsor,
  sponsors = [],
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [contactExpanded, setContactExpanded] = useState(false);
  const [socialExpanded, setSocialExpanded] = useState(false);

  const {
    formData,
    errors,
    logoFile,
    logoPreview,
    existingLogoKey,
    handleFieldChange,
    handleSocialLinkChange,
    handleLogoSelect,
    validateForm,
    prepareDataForSubmission,
    resetForm,
  } = useSponsorForm(sponsor, mode);

  const { data: sponsorTiers = [] } = useGetSponsorTiersQuery({ eventId });
  const [createSponsor, { isLoading: isCreating }] = useCreateSponsorMutation();
  const [updateSponsor, { isLoading: isUpdating }] = useUpdateSponsorMutation();
  const [uploadImage] = useUploadImageMutation();


  const handleSubmit = async () => {
    if (!validateForm()) {
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
        logoUrl = uploadResult.object_key;
      }

      const dataToSend = {
        ...prepareDataForSubmission(),
        ...(logoUrl && { logo_url: logoUrl }),
      };

      if (mode === 'create') {
        // Calculate display_order for new sponsor
        let newDisplayOrder = 10.0;
        if (formData.tierId && sponsors.length > 0) {
          // Find the highest display_order in the selected tier
          const tierSponsors = sponsors.filter(
            (s) => s.tier_id === formData.tierId
          );
          if (tierSponsors.length > 0) {
            const maxOrder = Math.max(
              ...tierSponsors.map((s) => s.display_order || 0)
            );
            newDisplayOrder = maxOrder + 10.0;
          }
        } else if (sponsors.length > 0) {
          // No tier selected, just get the highest overall
          const maxOrder = Math.max(
            ...sponsors.map((s) => s.display_order || 0)
          );
          newDisplayOrder = maxOrder + 10.0;
        }

        await createSponsor({
          eventId,
          ...dataToSend,
          display_order: newDisplayOrder,
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
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={mode === 'edit' ? 'Edit Sponsor' : 'Add New Sponsor'}
      size="lg"
      lockScroll={false}
      classNames={{
        content: styles.modalContent,
        header: styles.modalHeader,
      }}
    >
      <Stack spacing={isMobile ? 'sm' : 'md'} p={isMobile ? 'md' : 'lg'}>
        <BasicInfoSection
          formData={formData}
          errors={errors}
          isMobile={isMobile}
          sponsorTiers={sponsorTiers}
          onFieldChange={handleFieldChange}
        />

        <LogoUploadSection
          logoPreview={logoPreview}
          existingLogoKey={existingLogoKey}
          isMobile={isMobile}
          onLogoSelect={handleLogoSelect}
        />

        <ContactInfoSection
          formData={formData}
          errors={errors}
          isMobile={isMobile}
          expanded={contactExpanded}
          onExpandedChange={setContactExpanded}
          onFieldChange={handleFieldChange}
        />

        <SocialLinksSection
          socialLinks={formData.socialLinks}
          errors={errors}
          isMobile={isMobile}
          expanded={socialExpanded}
          onExpandedChange={setSocialExpanded}
          onSocialLinkChange={handleSocialLinkChange}
        />

        <div className={styles.buttonGroup}>
          <Button variant="subtle" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isCreating || isUpdating}
          >
            {mode === 'edit' ? 'Update' : 'Create'} Sponsor
          </Button>
        </div>
      </Stack>
    </Modal>
  );
};

export default SponsorModal;
