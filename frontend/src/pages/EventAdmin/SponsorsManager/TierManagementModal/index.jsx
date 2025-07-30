import React, { useState, useEffect } from 'react';
import { Modal, Stack, Grid, TextInput, ActionIcon, Text, ColorInput } from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Button } from '../../../../shared/components/buttons';
import {
  useGetSponsorTiersQuery,
  useUpdateSponsorTiersMutation,
} from '../../../../app/features/sponsors/api';
import { tierSchema, tierArraySchema } from '../schemas/sponsorSchema';
import styles from './styles/index.module.css';

const TierManagementModal = ({ opened, onClose, eventId }) => {
  const [tierFormData, setTierFormData] = useState([]);
  const [errors, setErrors] = useState({});
  const { data: sponsorTiers = [] } = useGetSponsorTiersQuery({ eventId });
  const [updateSponsorTiers] = useUpdateSponsorTiersMutation();

  useEffect(() => {
    if (opened) {
      setTierFormData(
        sponsorTiers.length > 0
          ? sponsorTiers.map((tier) => ({ ...tier })) // Deep copy each tier object
          : [
              { id: 'platinum', name: 'Platinum', order: 1, color: '#E5E4E2' },
              { id: 'gold', name: 'Gold', order: 2, color: '#DEAE4A' },
              { id: 'silver', name: 'Silver', order: 3, color: '#C7D3DB' },
              { id: 'bronze', name: 'Bronze', order: 4, color: '#BB8F4C' },
            ]
      );
    }
  }, [opened, sponsorTiers]);

  const handleUpdateTiers = async () => {
    // Validate all tiers
    const validation = tierArraySchema.safeParse(tierFormData);
    console.log(tierFormData);

    if (!validation.success) {
      const newErrors = {};
      validation.error.errors.forEach((err) => {
        const path = err.path.join('.');
        newErrors[path] = err.message;
      });
      setErrors(newErrors);

      notifications.show({
        title: 'Validation Error',
        message: 'Please fix the errors in the tier configuration',
        color: 'red',
      });
      return;
    }

    try {
      await updateSponsorTiers({
        eventId,
        tiers: tierFormData,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: 'Sponsor tiers updated successfully',
        color: 'green',
      });

      onClose();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update sponsor tiers',
        color: 'red',
      });
    }
  };

  const updateTier = (index, field, value) => {
    const newTiers = [...tierFormData];
    newTiers[index][field] = value;
    setTierFormData(newTiers);

    // Validate the specific tier
    const validation = tierSchema.safeParse(newTiers[index]);
    const errorKey = `${index}.${field}`;

    if (!validation.success) {
      const fieldError = validation.error.errors.find((err) =>
        err.path.includes(field)
      );
      if (fieldError) {
        setErrors({ ...errors, [errorKey]: fieldError.message });
      }
    } else {
      const newErrors = { ...errors };
      // Clear all errors for this tier
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`${index}.`)) {
          delete newErrors[key];
        }
      });
      setErrors(newErrors);
    }
  };

  const deleteTier = (index) => {
    setTierFormData(tierFormData.filter((_, i) => i !== index));
  };

  const addTier = () => {
    setTierFormData([
      ...tierFormData,
      {
        id: '',
        name: '',
        order: tierFormData.length + 1,
        color: '#6B7280', // Default gray color
      },
    ]);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Manage Sponsor Tiers"
      size="lg"
      classNames={{
        content: styles.modalContent,
        header: styles.modalHeader,
      }}
    >
      <Stack spacing="md" p="lg">
        <Text className={styles.description}>
          Define the sponsorship tiers for your event. Sponsors will be grouped
          and sorted by these tiers.
        </Text>

        <Text size="xs" c="dimmed" ta="center" mb="xs">
          Tier IDs should be lowercase with no spaces (e.g., "platinum", "gold", "silver")
        </Text>

        {/* Header row */}
        <Grid align="center" gutter="sm" className={styles.tierHeader}>
          <Grid.Col span={1}>
            <Text size="sm" fw={500} ta="center">
              Order
            </Text>
          </Grid.Col>
          <Grid.Col span={3}>
            <Text size="sm" fw={500} ta="center">
              Tier ID
            </Text>
          </Grid.Col>
          <Grid.Col span={4}>
            <Text size="sm" fw={500} ta="center">
              Display Name
            </Text>
          </Grid.Col>
          <Grid.Col span={3}>
            <Text size="sm" fw={500} ta="center">
              Color
            </Text>
          </Grid.Col>
          <Grid.Col span={1}></Grid.Col>
        </Grid>

        {tierFormData.map((tier, index) => (
          <Grid
            key={index}
            align="center"
            gutter="sm"
            className={styles.tierGrid}
          >
            <Grid.Col span={1}>
              <Text size="lg" fw={600} c="dimmed" ta="center">
                {tier.order}
              </Text>
            </Grid.Col>
            <Grid.Col span={3}>
              <TextInput
                value={tier.id}
                onChange={(e) => updateTier(index, 'id', e.target.value)}
                placeholder="tier-id"
                error={errors[`${index}.id`]}
                classNames={{ input: styles.formInput }}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                value={tier.name}
                onChange={(e) => updateTier(index, 'name', e.target.value)}
                placeholder="Tier Name"
                error={errors[`${index}.name`]}
                classNames={{ input: styles.formInput }}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <ColorInput
                value={tier.color}
                onChange={(value) => updateTier(index, 'color', value)}
                placeholder="#000000"
                error={errors[`${index}.color`]}
                classNames={{ input: styles.formInput }}
                format="hex"
                swatches={['#E5E4E2', '#DEAE4A', '#C7D3DB', '#BB8F4C', '#8B5CF6', '#10B981', '#0891B2', '#6366F1']}
              />
            </Grid.Col>
            <Grid.Col span={1}>
              <ActionIcon
                color="red"
                variant="subtle"
                onClick={() => deleteTier(index)}
                className={styles.deleteButton}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Grid.Col>
          </Grid>
        ))}

        <Button
          variant="subtle"
          onClick={addTier}
          fullWidth
          className={styles.addTierButton}
        >
          <IconPlus size={16} />
          Add Tier
        </Button>

        <div className={styles.buttonGroup}>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateTiers}>
            Save Tiers
          </Button>
        </div>
      </Stack>
    </Modal>
  );
};

export default TierManagementModal;
