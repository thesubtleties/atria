import { useState, useEffect } from 'react';
import { Modal, Stack, Select, Text, Avatar, Group } from '@mantine/core';
import { Button } from '@/shared/components/buttons';
import {
  TOP_OPTIONS,
  HAIR_COLOR_OPTIONS,
  FACIAL_HAIR_OPTIONS,
  FACIAL_HAIR_COLOR_OPTIONS,
  EYES_OPTIONS,
  EYEBROW_OPTIONS,
  MOUTH_OPTIONS,
  CLOTHES_OPTIONS,
  CLOTHES_COLOR_OPTIONS,
  ACCESSORIES_OPTIONS,
  ACCESSORIES_COLOR_OPTIONS,
  HAT_COLOR_OPTIONS,
  HAT_TYPES,
  SKIN_OPTIONS,
  DEFAULT_AVATAR_OPTIONS,
} from './avatarOptions';
import styles from './styles/index.module.css';

// Avatar API endpoint - use env variable for production
const AVATAR_API_URL =
  import.meta.env.VITE_AVATAR_API_URL || 'http://localhost:5001';

export const EditAvatarModal = ({ opened, onClose, onSave, currentUrl }) => {
  console.log('🎨 EditAvatarModal opened, currentUrl:', currentUrl);

  // Parse existing avatar URL to extract current options, or use defaults
  const parseAvatarUrl = (url) => {
    console.log('🔍 Parsing avatar URL:', url);

    if (!url || !url.includes('avataaars')) {
      console.log('⚙️ Using default avatar options (no URL or not avataaars)');
      return DEFAULT_AVATAR_OPTIONS;
    }

    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);

      const parsed = {
        top: params.get('top') || DEFAULT_AVATAR_OPTIONS.top,
        // Check both old (topColor) and new (hairColor) parameter names
        topColor: params.get('hairColor') || params.get('topColor') || DEFAULT_AVATAR_OPTIONS.topColor,
        facialHair:
          params.get('facialHair') || DEFAULT_AVATAR_OPTIONS.facialHair,
        facialHairColor:
          params.get('facialHairColor') ||
          DEFAULT_AVATAR_OPTIONS.facialHairColor,
        eyes: params.get('eyes') || DEFAULT_AVATAR_OPTIONS.eyes,
        // Check both eyebrows (plural) and eyebrow (singular)
        eyebrow: params.get('eyebrows') || params.get('eyebrow') || DEFAULT_AVATAR_OPTIONS.eyebrow,
        mouth: params.get('mouth') || DEFAULT_AVATAR_OPTIONS.mouth,
        // Check both clothing and clothes
        clothes: params.get('clothing') || params.get('clothes') || DEFAULT_AVATAR_OPTIONS.clothes,
        clothesColor:
          params.get('clothesColor') || DEFAULT_AVATAR_OPTIONS.clothesColor,
        accessories:
          params.get('accessories') || DEFAULT_AVATAR_OPTIONS.accessories,
        accessoriesColor:
          params.get('accessoriesColor') || DEFAULT_AVATAR_OPTIONS.accessoriesColor,
        hatColor:
          params.get('hatColor') || DEFAULT_AVATAR_OPTIONS.hatColor,
        // Check both skinColor and skin
        skin: params.get('skinColor') || params.get('skin') || DEFAULT_AVATAR_OPTIONS.skin,
        seed: params.get('seed') || 'user',
      };

      console.log('✅ Parsed avatar options:', parsed);
      return parsed;
    } catch (error) {
      console.error('❌ Error parsing avatar URL:', error);
      return DEFAULT_AVATAR_OPTIONS;
    }
  };

  const [options, setOptions] = useState(() => parseAvatarUrl(currentUrl));
  const [previewUrl, setPreviewUrl] = useState('');

  // Build avatar URL from options
  const buildAvatarUrl = (opts) => {
    const params = new URLSearchParams();

    // Always include these - using correct parameter names from schema
    params.append('seed', opts.seed || 'user');
    params.append('top', opts.top);
    params.append('hairColor', opts.topColor); // Correct: hairColor (not topColor)
    params.append('eyes', opts.eyes);
    params.append('eyebrows', opts.eyebrow); // Correct: eyebrows (plural)
    params.append('mouth', opts.mouth);
    params.append('clothing', opts.clothes); // Correct: clothing (not clothes)
    params.append('clothesColor', opts.clothesColor);
    params.append('skinColor', opts.skin); // Correct: skinColor (not skin)

    // Only include facialHair if not blank
    if (opts.facialHair && opts.facialHair !== 'blank') {
      params.append('facialHair', opts.facialHair);
      params.append('facialHairColor', opts.facialHairColor);
      params.append('facialHairProbability', '100'); // Force facial hair to show
    }

    // Only include accessories if not blank
    if (opts.accessories && opts.accessories !== 'blank') {
      params.append('accessories', opts.accessories);
      params.append('accessoriesColor', opts.accessoriesColor);
      params.append('accessoriesProbability', '100'); // Force accessories to show
    }

    // Only include hatColor if wearing a hat
    if (HAT_TYPES.includes(opts.top)) {
      params.append('hatColor', opts.hatColor);
    }

    const url = `${AVATAR_API_URL}/7.x/avataaars/svg?${params.toString()}`;
    console.log('🔗 Built avatar URL:', url);
    return url;
  };

  // Update preview whenever options change
  useEffect(() => {
    const newUrl = buildAvatarUrl(options);
    console.log('👁️ Updating preview with URL:', newUrl);
    setPreviewUrl(newUrl);
  }, [options]);

  const handleOptionChange = (field, value) => {
    console.log(`🎛️ Option changed: ${field} = ${value}`);
    setOptions((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    console.log('💾 Saving avatar URL:', previewUrl);
    onSave(previewUrl);
    onClose();
  };

  const handleCancel = () => {
    // Reset to current avatar
    setOptions(parseAvatarUrl(currentUrl));
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleCancel}
      title="Customize Your Avatar"
      centered
      size="lg"
      lockScroll={false}
      classNames={{
        content: styles.modalContent,
        header: styles.modalHeader,
      }}
    >
      <div className={styles.modalLayout} style={{ padding: '1.5rem' }}>
        {/* Top Section: Preview + Basic Options */}
        <div className={styles.topSection}>
          {/* Preview on Left */}
          <div className={styles.previewSection}>
            <Text className={styles.previewLabel}>Preview</Text>
            <Avatar src={previewUrl} size={180} radius="md" />
          </div>

          {/* Basic Options on Right */}
          <div className={styles.basicOptions}>
            <Text className={styles.sectionTitle}>Hairstyle & Hair</Text>

            <Select
              label="Hairstyle"
              placeholder="Select hairstyle"
              data={TOP_OPTIONS}
              value={options.top}
              onChange={(value) => handleOptionChange('top', value)}
              classNames={{ input: styles.formSelect }}
              searchable
              allowDeselect={false}
            />

            <Select
              label="Hair Color"
              placeholder="Select hair color"
              data={HAIR_COLOR_OPTIONS}
              value={options.topColor}
              onChange={(value) => handleOptionChange('topColor', value)}
              classNames={{ input: styles.formSelect }}
              allowDeselect={false}
            />

            {HAT_TYPES.includes(options.top) && (
              <Select
                label="Headwear Color"
                placeholder="Select headwear color"
                data={HAT_COLOR_OPTIONS}
                value={options.hatColor}
                onChange={(value) => handleOptionChange('hatColor', value)}
                classNames={{ input: styles.formSelect }}
                allowDeselect={false}
              />
            )}

            <Text className={styles.sectionTitle}>Skin Tone</Text>

            <Select
              label="Skin Tone"
              placeholder="Select skin tone"
              data={SKIN_OPTIONS}
              value={options.skin}
              onChange={(value) => handleOptionChange('skin', value)}
              classNames={{ input: styles.formSelect }}
              allowDeselect={false}
            />
          </div>
        </div>

        {/* Full Width Options Below */}
        <div className={styles.fullWidthOptions}>
          <Text className={styles.sectionTitle}>Facial Features</Text>

        <Select
          label="Eyes"
          placeholder="Select eye style"
          data={EYES_OPTIONS}
          value={options.eyes}
          onChange={(value) => handleOptionChange('eyes', value)}
          classNames={{ input: styles.formSelect }}
          allowDeselect={false}
        />

        <Select
          label="Eyebrows"
          placeholder="Select eyebrow style"
          data={EYEBROW_OPTIONS}
          value={options.eyebrow}
          onChange={(value) => handleOptionChange('eyebrow', value)}
          classNames={{ input: styles.formSelect }}
          allowDeselect={false}
        />

        <Select
          label="Mouth"
          placeholder="Select mouth expression"
          data={MOUTH_OPTIONS}
          value={options.mouth}
          onChange={(value) => handleOptionChange('mouth', value)}
          classNames={{ input: styles.formSelect }}
          allowDeselect={false}
        />

        <Text className={styles.sectionTitle}>Facial Hair</Text>

        <Select
          label="Facial Hair Style"
          placeholder="Select facial hair"
          data={FACIAL_HAIR_OPTIONS}
          value={options.facialHair}
          onChange={(value) => handleOptionChange('facialHair', value)}
          classNames={{ input: styles.formSelect }}
        />

        <Select
          label="Facial Hair Color"
          placeholder="Select facial hair color"
          data={FACIAL_HAIR_COLOR_OPTIONS}
          value={options.facialHairColor}
          onChange={(value) => handleOptionChange('facialHairColor', value)}
          classNames={{ input: styles.formSelect }}
          disabled={options.facialHair === 'blank'}
        />

        <Text className={styles.sectionTitle}>Clothing & Accessories</Text>

        <Select
          label="Clothing"
          placeholder="Select clothing"
          data={CLOTHES_OPTIONS}
          value={options.clothes}
          onChange={(value) => handleOptionChange('clothes', value)}
          classNames={{ input: styles.formSelect }}
          allowDeselect={false}
        />

        <Select
          label="Clothing Color"
          placeholder="Select clothing color"
          data={CLOTHES_COLOR_OPTIONS}
          value={options.clothesColor}
          onChange={(value) => handleOptionChange('clothesColor', value)}
          classNames={{ input: styles.formSelect }}
          allowDeselect={false}
        />

        <Select
          label="Accessories"
          placeholder="Select accessories"
          data={ACCESSORIES_OPTIONS}
          value={options.accessories}
          onChange={(value) => handleOptionChange('accessories', value)}
          classNames={{ input: styles.formSelect }}
        />

        <Select
          label="Accessories Color"
          placeholder="Select accessories color"
          data={ACCESSORIES_COLOR_OPTIONS}
          value={options.accessoriesColor}
          onChange={(value) => handleOptionChange('accessoriesColor', value)}
          classNames={{ input: styles.formSelect }}
          disabled={options.accessories === 'blank'}
        />

        <div className={styles.buttonGroup} style={{ gridColumn: '1 / -1' }}>
          <Button variant="subtle" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Avatar
          </Button>
        </div>
        </div>
      </div>
    </Modal>
  );
};
