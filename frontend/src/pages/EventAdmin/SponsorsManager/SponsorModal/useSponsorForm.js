import { useState, useEffect } from 'react';
import { validateField, validateSocialLink, sponsorSchema } from '../schemas/sponsorSchema';

const useSponsorForm = (sponsor, mode) => {
  const [formData, setFormData] = useState({
    name: '',
    tierId: '',
    description: '',
    websiteUrl: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    socialLinks: {
      linkedin: '',
      twitter: '',
      youtube: '',
      tiktok: '',
      instagram: '',
      facebook: '',
      other: '',
    },
  });

  const [errors, setErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [existingLogoKey, setExistingLogoKey] = useState(null);

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
        socialLinks: sponsor.social_links || {
          linkedin: '',
          twitter: '',
          youtube: '',
          tiktok: '',
          instagram: '',
          facebook: '',
          other: '',
        },
      });
      setExistingLogoKey(sponsor.logo_url || null);
      setLogoPreview(null);
    }
  }, [sponsor, mode]);

  const handleFieldChange = (field, value) => {
    // Special handling for tierId - prevent clearing once set
    if (field === 'tierId' && !value && formData.tierId) {
      return; // Don't allow clearing the tier once it's set
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    // Map frontend field names to schema field names
    const schemaField =
      {
        websiteUrl: 'website_url',
        contactName: 'contact_name',
        contactEmail: 'contact_email',
        contactPhone: 'contact_phone',
        tierId: 'tier_id',
      }[field] || field;

    const validation = validateField(schemaField, value);
    if (!validation.success) {
      setErrors((prev) => ({ ...prev, [field]: validation.error.errors[0].message }));
    } else {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleSocialLinkChange = (platform, value) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }));

    const validation = validateSocialLink(platform, value);
    const errorKey = `social_${platform}`;

    if (!validation.success) {
      setErrors((prev) => ({ ...prev, [errorKey]: validation.error.errors[0].message }));
    } else {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
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

  const validateForm = () => {
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
      const fieldErrors = {};
      validation.error.errors.forEach((err) => {
        const path = err.path.join('.');
        // Map schema fields back to frontend field names
        const frontendField =
          {
            tier_id: 'tierId',
            website_url: 'websiteUrl',
            contact_name: 'contactName',
            contact_email: 'contactEmail',
            contact_phone: 'contactPhone',
          }[path] ||
          (path.startsWith('social_links.') ? `social_${path.replace('social_links.', '')}` : path);
        fieldErrors[frontendField] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }

    return true;
  };

  const prepareDataForSubmission = () => {
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

  const resetForm = () => {
    setFormData({
      name: '',
      tierId: '',
      description: '',
      websiteUrl: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      socialLinks: {
        linkedin: '',
        twitter: '',
        youtube: '',
        tiktok: '',
        instagram: '',
        facebook: '',
        other: '',
      },
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
