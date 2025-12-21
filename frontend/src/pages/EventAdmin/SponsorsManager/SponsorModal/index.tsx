import { useState } from 'react';
import { Modal, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { Button } from '@/shared/components/buttons';
import {
  useCreateSponsorMutation,
  useUpdateSponsorMutation,
  useGetSponsorTiersQuery,
} from '@/app/features/sponsors/api';
import { useUploadImageMutation } from '@/app/features/uploads/api';
import useSponsorForm from './useSponsorForm';
import BasicInfoSection from './BasicInfoSection';
import ContactInfoSection from './ContactInfoSection';
import SocialLinksSection from './SocialLinksSection';
import LogoUploadSection from './LogoUploadSection';
import type { Sponsor } from '@/types/sponsors';
import styles from './styles/index.module.css';

type SponsorModalProps = {
  opened: boolean;
  onClose: () => void;
  eventId: number;
  mode: 'create' | 'edit';
  sponsor?: Sponsor | null;
  sponsors?: Sponsor[];
};

const SponsorModal = ({
  opened,
  onClose,
  eventId,
  mode,
  sponsor = null,
  sponsors = [],
}: SponsorModalProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)') ?? false;
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

  const { data: tiersResponse } = useGetSponsorTiersQuery({ eventId });

  // Convert tiers record to array
  const sponsorTiers =
    tiersResponse?.tiers ?
      Object.entries(tiersResponse.tiers).map(([id, tier]) => ({
        ...tier,
        id,
        order_index: tier.order,
      }))
    : [];
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
      let logoUrl: string | null = null;

      if (logoFile) {
        const uploadResult = await uploadImage({
          file: logoFile,
          context: 'sponsor_logo',
          eventId,
        }).unwrap();
        logoUrl = uploadResult.object_key;
      }

      const submissionData = prepareDataForSubmission();

      if (mode === 'create') {
        let newDisplayOrder: number | null = null;
        if (formData.tierId && sponsors.length > 0) {
          const tierSponsors = sponsors.filter((s) => s.tier_id === formData.tierId);
          if (tierSponsors.length > 0) {
            const maxOrder = Math.max(...tierSponsors.map((s) => s.display_order ?? 0));
            newDisplayOrder = maxOrder + 10.0;
          }
        } else if (sponsors.length > 0) {
          const maxOrder = Math.max(...sponsors.map((s) => s.display_order ?? 0));
          newDisplayOrder = maxOrder + 10.0;
        }

        await createSponsor({
          eventId,
          name: submissionData.name,
          description: submissionData.description,
          website_url: submissionData.website_url,
          logo_url: logoUrl,
          contact_name: submissionData.contact_name,
          contact_email: submissionData.contact_email,
          contact_phone: submissionData.contact_phone,
          tier_id: submissionData.tier_id,
          social_links: submissionData.social_links,
          display_order: newDisplayOrder,
        }).unwrap();
      } else if (sponsor) {
        await updateSponsor({
          sponsorId: sponsor.id,
          name: submissionData.name,
          description: submissionData.description,
          website_url: submissionData.website_url,
          logo_url: logoUrl,
          contact_name: submissionData.contact_name,
          contact_email: submissionData.contact_email,
          contact_phone: submissionData.contact_phone,
          tier_id: submissionData.tier_id,
          social_links: submissionData.social_links,
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
        message:
          (
            error &&
            typeof error === 'object' &&
            'data' in error &&
            error.data &&
            typeof error.data === 'object' &&
            'message' in error.data
          ) ?
            String(error.data.message)
          : `Failed to ${mode} sponsor`,
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
      size='lg'
      lockScroll={false}
      classNames={{
        content: styles.modalContent ?? '',
        header: styles.modalHeader ?? '',
      }}
    >
      <Stack gap={isMobile ? 'sm' : 'md'} p={isMobile ? 'md' : 'lg'}>
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

        <div className={styles.buttonGroup ?? ''}>
          <Button variant='subtle' onClick={handleClose}>
            Cancel
          </Button>
          <Button variant='primary' onClick={handleSubmit} loading={isCreating || isUpdating}>
            {mode === 'edit' ? 'Update' : 'Create'} Sponsor
          </Button>
        </div>
      </Stack>
    </Modal>
  );
};

export default SponsorModal;
