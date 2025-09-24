import { Group, Box, Text, FileButton, Image } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { Button } from '../../../../shared/components/buttons';
import PrivateImage from '../../../../shared/components/PrivateImage';
import styles from './styles/index.module.css';

const LogoUploadSection = ({
  logoFile,
  logoPreview,
  existingLogoKey,
  isMobile,
  onLogoSelect,
}) => {
  const handleFileSelect = (file) => {
    if (file) {
      onLogoSelect(file);
    }
  };

  return (
    <Group className={styles.logoSection}>
      <Box className={styles.logoUpload}>
        <Text className={styles.logoLabel}>Logo</Text>
        <FileButton
          onChange={handleFileSelect}
          accept="image/png,image/jpeg,image/gif,image/webp"
        >
          {(props) => (
            <Button {...props} variant="secondary">
              <IconUpload size={16} />
              {existingLogoKey || logoPreview ? 'Change Logo' : 'Upload Logo'}
            </Button>
          )}
        </FileButton>
      </Box>

      {logoPreview ? (
        <Image
          src={logoPreview}
          alt="Logo preview"
          width={isMobile ? 60 : 80}
          height={isMobile ? 60 : 80}
          fit="contain"
          className={styles.logoPreview}
        />
      ) : existingLogoKey ? (
        <PrivateImage
          objectKey={existingLogoKey}
          alt="Current logo"
          width={isMobile ? 60 : 80}
          height={isMobile ? 60 : 80}
          fit="contain"
          className={styles.logoPreview}
        />
      ) : null}
    </Group>
  );
};

export default LogoUploadSection;