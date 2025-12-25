import { useState, useEffect } from 'react';
import {
  validateField,
  validateSocialLink,
  sponsorSchema,
  type SponsorFieldName,
} from '../schemas/sponsorSchema';
import type { Sponsor, SponsorSocialLinks } from '@/types/sponsors';

type SponsorFormMode = 'create' | 'edit';

type SponsorFormData = {
  name: string;
  tierId: string;
  description: string;
  websiteUrl: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  socialLinks: SponsorSocialLinks;
};

type FormErrors = Record<string, string>;

type SponsorSubmissionData = {
  name: string;
  description: string | null;
  website_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  tier_id: string;
  social_links: SponsorSocialLinks;
};

type UseSponsorFormResult = {
  formData: SponsorFormData;
  setFormData: React.Dispatch<React.SetStateAction<SponsorFormData>>;
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  logoFile: File | null;
  logoPreview: string | null;
  existingLogoKey: string | null;
  handleFieldChange: (field: keyof SponsorFormData, value: string) => void;
  handleSocialLinkChange: (platform: keyof SponsorSocialLinks, value: string) => void;
  handleLogoSelect: (file: File | null) => void;
  validateForm: () => boolean;
  prepareDataForSubmission: () => SponsorSubmissionData;
  resetForm: () => void;
};

const defaultSocialLinks: SponsorSocialLinks = {
  linkedin: null,
  twitter: null,
  youtube: null,
  tiktok: null,
  instagram: null,
  facebook: null,
  other: null,
};

const useSponsorForm = (sponsor: Sponsor | null, mode: SponsorFormMode): UseSponsorFormResult => {
  const [formData, setFormData] = useState<SponsorFormData>({
    name: '',
    tierId: '',
    description: '',
    websiteUrl: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    socialLinks: { ...defaultSocialLinks },
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [existingLogoKey, setExistingLogoKey] = useState<string | null>(null);

  // Initialize form data from sponsor when editing
  useEffect(() => {
    if (mode === 'edit' && sponsor) {
      setFormData({
        name: sponsor.name || '',
        tierId: sponsor.tier_id || '',
        description: sponsor.description || '',
        websiteUrl: sponsor.website_url || '',
        contactName: sponsor.contact_name || '',
        contactEmail: sponsor.contact_email || '',
        contactPhone: sponsor.contact_phone || '',
        socialLinks: sponsor.social_links || { ...defaultSocialLinks },
      });
      setExistingLogoKey(sponsor.logo_url || null);
      setLogoPreview(null);
    }
  }, [sponsor, mode]);

  const handleFieldChange = (field: keyof SponsorFormData, value: string): void => {
    // Special handling for tierId - prevent clearing once set
    if (field === 'tierId' && !value && formData.tierId) {
      return; // Don't allow clearing the tier once it's set
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    // Map frontend field names to schema field names
    const fieldMapping: Record<string, string> = {
      websiteUrl: 'website_url',
      contactName: 'contact_name',
      contactEmail: 'contact_email',
      contactPhone: 'contact_phone',
      tierId: 'tier_id',
    };
    const schemaField = fieldMapping[field] || field;

    const validation = validateField(schemaField as SponsorFieldName, value);
    if (!validation.success && 'error' in validation) {
      setErrors((prev) => ({ ...prev, [field]: validation.error.errors[0]?.message ?? 'Invalid' }));
    } else {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleSocialLinkChange = (platform: keyof SponsorSocialLinks, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }));

    const validation = validateSocialLink(platform, value);
    const errorKey = `social_${platform}`;

    if (!validation.success && 'error' in validation) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: validation.error.errors[0]?.message ?? 'Invalid',
      }));
    } else {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const handleLogoSelect = (file: File | null): void => {
    setLogoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const dataToValidate = {
      name: formData.name,
      tier_id: formData.tierId,
      description: formData.description,
      website_url: formData.websiteUrl,
      contact_name: formData.contactName,
      contact_email: formData.contactEmail,
      contact_phone: formData.contactPhone,
      social_links: formData.socialLinks,
    };

    const validation = sponsorSchema.safeParse(dataToValidate);

    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      validation.error.errors.forEach((err) => {
        const path = err.path.join('.');
        // Map schema fields back to frontend field names
        const backendToFrontend: Record<string, string> = {
          tier_id: 'tierId',
          website_url: 'websiteUrl',
          contact_name: 'contactName',
          contact_email: 'contactEmail',
          contact_phone: 'contactPhone',
        };
        const frontendField =
          backendToFrontend[path] ||
          (path.startsWith('social_links.') ? `social_${path.replace('social_links.', '')}` : path);
        fieldErrors[frontendField] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }

    return true;
  };

  const prepareDataForSubmission = (): SponsorSubmissionData => {
    return {
      name: formData.name,
      description: formData.description || null,
      website_url: formData.websiteUrl || null,
      contact_name: formData.contactName || null,
      contact_email: formData.contactEmail || null,
      contact_phone: formData.contactPhone || null,
      tier_id: formData.tierId,
      social_links: formData.socialLinks,
    };
  };

  const resetForm = (): void => {
    setFormData({
      name: '',
      tierId: '',
      description: '',
      websiteUrl: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      socialLinks: { ...defaultSocialLinks },
    });
    setLogoFile(null);
    setLogoPreview(null);
    setExistingLogoKey(null);
    setErrors({});
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    logoFile,
    logoPreview,
    existingLogoKey,
    handleFieldChange,
    handleSocialLinkChange,
    handleLogoSelect,
    validateForm,
    prepareDataForSubmission,
    resetForm,
  };
};

export default useSponsorForm;
