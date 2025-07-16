import React from 'react';
import {
  Table,
  Text,
  Badge,
  ActionIcon,
  Switch,
  Menu,
  Image,
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
import {
  useDeleteSponsorMutation,
  useToggleSponsorActiveMutation,
  useToggleSponsorFeaturedMutation,
} from '../../../../app/features/sponsors/api';
import PrivateImage from '../../../../shared/components/PrivateImage';
import styles from './styles/index.module.css';

const SponsorRow = ({ 
  sponsor, 
  index,
  onEdit,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging,
  isDragOver
}) => {
  const [deleteSponsor] = useDeleteSponsorMutation();
  const [toggleActive] = useToggleSponsorActiveMutation();
  const [toggleFeatured] = useToggleSponsorFeaturedMutation();

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
      draggable
      onDragStart={(e) => onDragStart(e, sponsor, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className={`${isDragging ? styles.dragging : ''} ${isDragOver ? styles.dragOver : ''}`}
      style={{ cursor: 'move' }}
    >
      <Table.Td>
        <ActionIcon variant="subtle" size="sm" style={{ cursor: 'grab' }}>
          <IconGripVertical size={16} />
        </ActionIcon>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        {sponsor.logo_url ? (
          <>
            <PrivateImage
              objectKey={sponsor.logo_url}
              alt={sponsor.name}
              width={40}
              height={40}
              fit="contain"
              style={{ display: 'inline-block' }}
              placeholder={<Box className={styles.logoPlaceholder} style={{ margin: '0 auto' }} />}
            />
            {/* Temporary debug info */}
            <Text size="xs" c="dimmed">{sponsor.logo_url}</Text>
          </>
        ) : (
          <Box className={styles.logoPlaceholder} style={{ margin: '0 auto' }} />
        )}
      </Table.Td>
      <Table.Td>
        <Text fw={500}>{sponsor.name}</Text>
        {sponsor.website_url && (
          <Text size="sm" c="dimmed">
            {sponsor.website_url}
          </Text>
        )}
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <Box style={{ minWidth: '100px', display: 'inline-block' }}>
          <Switch
            checked={sponsor.is_active}
            onChange={handleToggleActive}
            label={sponsor.is_active ? 'Active' : 'Inactive'}
          />
        </Box>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <ActionIcon
          variant={sponsor.featured ? 'filled' : 'subtle'}
          color="yellow"
          onClick={handleToggleFeatured}
        >
          {sponsor.featured ? (
            <IconStarFilled size={16} />
          ) : (
            <IconStar size={16} />
          )}
        </ActionIcon>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <Menu position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle">
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconEdit size={14} />}
              onClick={() => onEdit(sponsor)}
            >
              Edit
            </Menu.Item>
            <Menu.Item
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