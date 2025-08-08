import React from 'react';
import {
  Text,
  Group,
  ActionIcon,
  Switch,
  Menu,
  Box,
  Badge,
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconGripVertical,
  IconDots,
  IconStar,
  IconStarFilled,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { openConfirmationModal } from '@/shared/components/modals/ConfirmationModal';
import { useSortable } from '@dnd-kit/react/sortable';
import {
  useDeleteSponsorMutation,
  useToggleSponsorActiveMutation,
  useToggleSponsorFeaturedMutation,
} from '../../../../app/features/sponsors/api';
import PrivateImage from '../../../../shared/components/PrivateImage';
import styles from './styles/index.module.css';

const SponsorCard = ({ 
  id,
  sponsor, 
  tierId,
  index,
  onEdit,
}) => {
  const [deleteSponsor] = useDeleteSponsorMutation();
  const [toggleActive] = useToggleSponsorActiveMutation();
  const [toggleFeatured] = useToggleSponsorFeaturedMutation();

  const { ref, isDragging } = useSortable({ 
    id,
    index,
    group: tierId,
    type: 'sponsor',
    accept: ['sponsor'],
  });

  const handleDelete = () => {
    openConfirmationModal({
      title: 'Delete Sponsor',
      message: 'Are you sure you want to delete this sponsor?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await deleteSponsor(sponsor.id).unwrap();
          notifications.show({
            title: 'Success',
            message: 'Sponsor deleted successfully',
            color: 'green',
          });
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: error.data?.message || 'Failed to delete sponsor',
            color: 'red',
          });
        }
      },
    });
  };

  const handleToggleActive = async () => {
    try {
      await toggleActive(sponsor.id).unwrap();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to toggle sponsor status',
        color: 'red',
      });
    }
  };

  const handleToggleFeatured = async () => {
    try {
      await toggleFeatured(sponsor.id).unwrap();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to toggle featured status',
        color: 'red',
      });
    }
  };

  return (
    <div
      ref={ref}
      className={`${styles.sponsorCard} ${isDragging ? styles.dragging : ''}`}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <Group align="center" justify="space-between" wrap="nowrap">
        <Group wrap="nowrap">
          <ActionIcon 
            variant="subtle" 
            size="sm" 
            className={styles.dragHandle}
            style={{ cursor: 'grab' }}
          >
            <IconGripVertical size={16} />
          </ActionIcon>

          <div className={styles.logoContainer}>
            {sponsor.logo_url ? (
              <PrivateImage
                objectKey={sponsor.logo_url}
                alt={sponsor.name}
                width={50}
                height={50}
                fit="contain"
                className={styles.logo}
                placeholder={<Box className={styles.logoPlaceholder} />}
              />
            ) : (
              <Box className={styles.logoPlaceholder} />
            )}
          </div>

          <div className={styles.sponsorInfo}>
            <Text fw={600} size="md" className={styles.sponsorName}>
              {sponsor.name}
            </Text>
            {sponsor.website_url && (
              <Text size="sm" c="dimmed" className={styles.sponsorUrl}>
                {sponsor.website_url}
              </Text>
            )}
          </div>
        </Group>

        <Group wrap="nowrap" gap="lg">
          <div className={styles.statusContainer}>
            <Switch
              checked={sponsor.is_active}
              onChange={handleToggleActive}
              label={sponsor.is_active ? 'Active' : 'Inactive'}
              classNames={{
                root: styles.statusSwitch,
                label: styles.switchLabel
              }}
              styles={{
                track: {
                  backgroundColor: sponsor.is_active ? '#8B5CF6' : '#E2E8F0',
                  borderColor: sponsor.is_active ? '#8B5CF6' : '#E2E8F0',
                },
                thumb: {
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                }
              }}
            />
          </div>

          <ActionIcon
            variant={sponsor.featured ? 'filled' : 'subtle'}
            onClick={handleToggleFeatured}
            className={styles.featuredButton}
            style={{
              backgroundColor: sponsor.featured ? '#FFD666' : undefined,
              color: sponsor.featured ? 'white' : '#FFD666',
            }}
          >
            {sponsor.featured ? (
              <IconStarFilled size={18} />
            ) : (
              <IconStar size={18} />
            )}
          </ActionIcon>

          <Menu position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" className={styles.actionButton}>
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown className={styles.menuDropdown}>
              <Menu.Item
                className={styles.menuItem}
                leftSection={<IconEdit size={14} />}
                onClick={() => onEdit(sponsor)}
              >
                Edit
              </Menu.Item>
              <Menu.Item
                className={`${styles.menuItem} ${styles.menuItemDanger}`}
                leftSection={<IconTrash size={14} />}
                color="red"
                onClick={handleDelete}
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </div>
  );
};

export default SponsorCard;