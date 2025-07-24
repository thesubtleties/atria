import React from 'react';
import {
  Table,
  Text,
  ActionIcon,
  Switch,
  Menu,
  Box,
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
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useDeleteSponsorMutation,
  useToggleSponsorActiveMutation,
  useToggleSponsorFeaturedMutation,
} from '../../../../app/features/sponsors/api';
import PrivateImage from '../../../../shared/components/PrivateImage';
import styles from './styles/index.module.css';

const SponsorRow = ({ 
  sponsor, 
  onEdit,
  isDragging,
  isOverlay
}) => {
  const [deleteSponsor] = useDeleteSponsorMutation();
  const [toggleActive] = useToggleSponsorActiveMutation();
  const [toggleFeatured] = useToggleSponsorFeaturedMutation();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: sponsor.id,
    disabled: isOverlay
  });

  const style = isOverlay 
    ? {} 
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this sponsor?')) {
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
    }
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
    <Table.Tr
      ref={setNodeRef}
      style={style}
      className={`${styles.sponsorRow} ${isDragging ? styles.dragging : ''}`}
    >
      <Table.Td className={styles.dragHandleCell}>
        <ActionIcon 
          variant="subtle" 
          size="sm" 
          className={styles.dragHandle}
          {...attributes}
          {...listeners}
        >
          <IconGripVertical size={16} />
        </ActionIcon>
      </Table.Td>
      <Table.Td className={styles.logoCell}>
        {sponsor.logo_url ? (
          <PrivateImage
            objectKey={sponsor.logo_url}
            alt={sponsor.name}
            width={40}
            height={40}
            fit="contain"
            className={styles.logo}
            placeholder={<Box className={styles.logoPlaceholder} />}
          />
        ) : (
          <Box className={styles.logoPlaceholder} />
        )}
      </Table.Td>
      <Table.Td>
        <Text fw={500} className={styles.sponsorName}>{sponsor.name}</Text>
        {sponsor.website_url && (
          <Text size="sm" c="dimmed" className={styles.sponsorUrl}>
            {sponsor.website_url}
          </Text>
        )}
      </Table.Td>
      <Table.Td className={styles.statusCell}>
        <div className={styles.switchWrapper}>
          <Switch
            checked={sponsor.is_active}
            onChange={handleToggleActive}
            label={sponsor.is_active ? 'Active' : 'Inactive'}
            disabled={isOverlay}
            classNames={{
              root: styles.statusSwitch,
              label: styles.switchLabel
            }}
          />
        </div>
      </Table.Td>
      <Table.Td className={styles.featuredCell}>
        <ActionIcon
          variant={sponsor.featured ? 'filled' : 'subtle'}
          color="yellow"
          onClick={handleToggleFeatured}
          disabled={isOverlay}
          className={styles.featuredButton}
        >
          {sponsor.featured ? (
            <IconStarFilled size={16} />
          ) : (
            <IconStar size={16} />
          )}
        </ActionIcon>
      </Table.Td>
      <Table.Td className={styles.actionsCell}>
        <Menu position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" className={styles.actionButton}>
              <IconDots size={16} />
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
      </Table.Td>
    </Table.Tr>
  );
};

export default SponsorRow;