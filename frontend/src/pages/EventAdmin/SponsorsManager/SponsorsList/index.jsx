import React, { useState, useRef } from 'react';
import { Table, Text, Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useReorderSponsorsMutation } from '../../../../app/features/sponsors/api';
import SponsorRow from '../SponsorRow';
import SponsorModal from '../SponsorModal';
import styles from './styles/index.module.css';

const SponsorsList = ({ sponsors, eventId }) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [draggedSponsor, setDraggedSponsor] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const draggedOverRef = useRef(null);
  const [reorderSponsors] = useReorderSponsorsMutation();

  const handleDragStart = (e, sponsor, index) => {
    setDraggedSponsor({ sponsor, index });
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedSponsor(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (!draggedSponsor) return;
    
    e.dataTransfer.dropEffect = 'move';
    
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
      draggedOverRef.current = index;
    }
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (!draggedSponsor || draggedSponsor.index === targetIndex) {
      return;
    }

    const { sponsor, index: sourceIndex } = draggedSponsor;
    
    // Reorder the array
    const items = Array.from(sponsors);
    const [reorderedItem] = items.splice(sourceIndex, 1);
    items.splice(targetIndex, 0, reorderedItem);

    const sponsorOrders = items.map((sponsor, index) => ({
      sponsor_id: sponsor.id,
      display_order: index,
    }));

    try {
      await reorderSponsors({ eventId, sponsorOrders }).unwrap();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to reorder sponsors',
        color: 'red',
      });
    }
  };

  const handleEditClick = (sponsor) => {
    setSelectedSponsor(sponsor);
    setEditModalOpen(true);
  };

  if (sponsors.length === 0) {
    return (
      <Box className={styles.emptyState}>
        <Text c="dimmed" ta="center">
          No sponsors added yet. Click "Add Sponsor" to get started.
        </Text>
      </Box>
    );
  }

  return (
    <>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th />
            <Table.Th>Logo</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Tier</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Featured</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sponsors.map((sponsor, index) => (
            <SponsorRow
              key={sponsor.id}
              sponsor={sponsor}
              index={index}
              onEdit={handleEditClick}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragging={draggedSponsor?.sponsor.id === sponsor.id}
              isDragOver={dragOverIndex === index && draggedSponsor?.index !== index}
            />
          ))}
        </Table.Tbody>
      </Table>

      {editModalOpen && (
        <SponsorModal
          opened={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedSponsor(null);
          }}
          eventId={eventId}
          mode="edit"
          sponsor={selectedSponsor}
        />
      )}
    </>
  );
};

export default SponsorsList;