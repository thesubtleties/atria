import React, { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Grid,
  TextInput,
  NumberInput,
  Button,
  Group,
  ActionIcon,
  Text,
} from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useGetSponsorTiersQuery,
  useUpdateSponsorTiersMutation,
} from '../../../../app/features/sponsors/api';
import { tierSchema, tierArraySchema } from '../schemas/sponsorSchema';

const TierManagementModal = ({ opened, onClose, eventId }) => {
  const [tierFormData, setTierFormData] = useState([]);
  const [errors, setErrors] = useState({});
  const { data: sponsorTiers = [] } = useGetSponsorTiersQuery({ eventId });
  const [updateSponsorTiers] = useUpdateSponsorTiersMutation();

  useEffect(() => {
    if (opened) {
      setTierFormData(sponsorTiers.length > 0 ? [...sponsorTiers] : [
        { id: 'platinum', name: 'Platinum', order: 1 },
        { id: 'gold', name: 'Gold', order: 2 },
        { id: 'silver', name: 'Silver', order: 3 },
        { id: 'bronze', name: 'Bronze', order: 4 },
      ]);
    }
  }, [opened, sponsorTiers]);

  const handleUpdateTiers = async () => {
    // Validate all tiers
    const validation = tierArraySchema.safeParse(tierFormData);
    
    if (!validation.success) {
      const newErrors = {};
      validation.error.errors.forEach(err => {
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
      const fieldError = validation.error.errors.find(err => err.path.includes(field));
      if (fieldError) {
        setErrors({ ...errors, [errorKey]: fieldError.message });
      }
    } else {
      const newErrors = { ...errors };
      // Clear all errors for this tier
      Object.keys(newErrors).forEach(key => {
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
        order: tierFormData.length + 1 
      }
    ]);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Manage Sponsor Tiers"
      size="md"
    >
      <Stack>
        <Text size="sm" c="dimmed">
          Define the sponsorship tiers for your event. Sponsors will be grouped and sorted by these tiers.
        </Text>

        {tierFormData.map((tier, index) => (
          <Grid key={index} align="center" gutter="sm">
            <Grid.Col span={2}>
              <NumberInput
                label={index === 0 ? "Order" : undefined}
                value={tier.order}
                onChange={(value) => updateTier(index, 'order', value)}
                min={1}
                error={errors[`${index}.order`]}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label={index === 0 ? "Tier ID" : undefined}
                value={tier.id}
                onChange={(e) => updateTier(index, 'id', e.target.value)}
                placeholder="tier-id"
                description={index === 0 ? "Lowercase, no spaces" : undefined}
                error={errors[`${index}.id`]}
              />
            </Grid.Col>
            <Grid.Col span={5}>
              <TextInput
                label={index === 0 ? "Display Name" : undefined}
                value={tier.name}
                onChange={(e) => updateTier(index, 'name', e.target.value)}
                placeholder="Tier Name"
                error={errors[`${index}.name`]}
              />
            </Grid.Col>
            <Grid.Col span={1}>
              <ActionIcon
                color="red"
                variant="subtle"
                onClick={() => deleteTier(index)}
                style={{ marginTop: index === 0 ? '1.5rem' : 0 }}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Grid.Col>
          </Grid>
        ))}

        <Button
          variant="outline"
          leftSection={<IconPlus size={16} />}
          onClick={addTier}
          fullWidth
        >
          Add Tier
        </Button>

        <Group justify="flex-end" mt="xl">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpdateTiers}>
            Save Tiers
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default TierManagementModal;