import { useState, useEffect, useMemo } from 'react';
import { Modal, Stack, Grid, TextInput, ActionIcon, Text, ColorInput } from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Button } from '@/shared/components/buttons';
import {
  useGetSponsorTiersQuery,
  useUpdateSponsorTiersMutation,
} from '@/app/features/sponsors/api';
import { tierSchema, tierArraySchema } from '../schemas/sponsorSchema';
import styles from './styles/index.module.css';

type TierFormData = {
  id: string;
  name: string;
  order: number;
  color: string;
};

type TierManagementModalProps = {
  opened: boolean;
  onClose: () => void;
  eventId: number;
};

const TierManagementModal = ({ opened, onClose, eventId }: TierManagementModalProps) => {
  const [tierFormData, setTierFormData] = useState<TierFormData[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: tiersResponse } = useGetSponsorTiersQuery({ eventId });
  const [updateSponsorTiers] = useUpdateSponsorTiersMutation();

  // Backend returns array directly, map to include order_index for compatibility
  const sponsorTiers = useMemo(
    () =>
      tiersResponse ?
        tiersResponse.map((tier) => ({
          ...tier,
          order_index: tier.order,
        }))
      : [],
    [tiersResponse],
  );

  useEffect(() => {
    if (opened) {
      setTierFormData(
        sponsorTiers.length > 0 ?
          sponsorTiers
            .map((tier) => ({
              id: tier.id ?? '',
              name: tier.name ?? '',
              order: tier.order_index ?? tier.order ?? 1,
              color: tier.color ?? '#6B7280',
            }))
            .filter((tier): tier is TierFormData => Boolean(tier.id && tier.name))
        : [
            { id: 'platinum', name: 'Platinum', order: 1, color: '#E5E4E2' },
            { id: 'gold', name: 'Gold', order: 2, color: '#DEAE4A' },
            { id: 'silver', name: 'Silver', order: 3, color: '#C7D3DB' },
            { id: 'bronze', name: 'Bronze', order: 4, color: '#BB8F4C' },
          ],
      );
    }
  }, [opened, sponsorTiers]);

  const handleUpdateTiers = async () => {
    const validation = tierArraySchema.safeParse(tierFormData);

    if (!validation.success) {
      const newErrors: Record<string, string> = {};
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
      // Send array format as expected by backend
      const tiersArray = tierFormData.map((tier) => ({
        id: tier.id,
        name: tier.name,
        order: tier.order,
        color: tier.color,
      }));

      await updateSponsorTiers({
        eventId,
        tiers: tiersArray,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: 'Sponsor tiers updated successfully',
        color: 'green',
      });

      onClose();
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to update sponsor tiers',
        color: 'red',
      });
    }
  };

  const updateTier = (index: number, field: keyof TierFormData, value: string | number) => {
    const newTiers = [...tierFormData];
    const currentTier = newTiers[index];
    if (!currentTier) return;

    const updatedTier: TierFormData = {
      id: field === 'id' ? (value as string) : currentTier.id,
      name: field === 'name' ? (value as string) : currentTier.name,
      order: field === 'order' ? (value as number) : currentTier.order,
      color: field === 'color' ? (value as string) : currentTier.color,
    };
    newTiers[index] = updatedTier;
    setTierFormData(newTiers);

    const validation = tierSchema.safeParse(updatedTier);
    const errorKey = `${index}.${field}`;

    if (!validation.success) {
      const fieldError = validation.error.errors.find((err) => err.path.includes(field));
      if (fieldError) {
        setErrors({ ...errors, [errorKey]: fieldError.message });
      }
    } else {
      const newErrors = { ...errors };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`${index}.`)) {
          delete newErrors[key];
        }
      });
      setErrors(newErrors);
    }
  };

  const deleteTier = (index: number) => {
    setTierFormData(tierFormData.filter((_, i) => i !== index));
  };

  const addTier = () => {
    setTierFormData([
      ...tierFormData,
      {
        id: '',
        name: '',
        order: tierFormData.length + 1,
        color: '#6B7280',
      },
    ]);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title='Manage Sponsor Tiers'
      size='lg'
      lockScroll={false}
      classNames={{
        content: styles.modalContent ?? '',
        header: styles.modalHeader ?? '',
      }}
    >
      <Stack gap='md' p='lg'>
        <Text className={styles.description ?? ''}>
          Define the sponsorship tiers for your event. Sponsors will be grouped and sorted by these
          tiers.
        </Text>

        <Text size='xs' c='dimmed' ta='center' mb='xs'>
          {'Tier IDs should be lowercase with no spaces (e.g., "platinum", "gold", "silver")'}
        </Text>

        <Grid align='center' gutter='sm' className={styles.tierHeader ?? ''}>
          <Grid.Col span={1}>
            <Text size='sm' fw={500} ta='center'>
              Order
            </Text>
          </Grid.Col>
          <Grid.Col span={3}>
            <Text size='sm' fw={500} ta='center'>
              Tier ID
            </Text>
          </Grid.Col>
          <Grid.Col span={4}>
            <Text size='sm' fw={500} ta='center'>
              Display Name
            </Text>
          </Grid.Col>
          <Grid.Col span={3}>
            <Text size='sm' fw={500} ta='center'>
              Color
            </Text>
          </Grid.Col>
          <Grid.Col span={1}></Grid.Col>
        </Grid>

        {tierFormData.map((tier, index) => (
          <Grid key={index} align='center' gutter='sm' className={styles.tierGrid ?? ''}>
            <Grid.Col span={1}>
              <Text size='lg' fw={600} c='dimmed' ta='center'>
                {tier.order}
              </Text>
            </Grid.Col>
            <Grid.Col span={3}>
              <TextInput
                value={tier.id}
                onChange={(e) => updateTier(index, 'id', e.target.value)}
                placeholder='tier-id'
                error={errors[`${index}.id`]}
                classNames={{ input: styles.formInput ?? '' }}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                value={tier.name}
                onChange={(e) => updateTier(index, 'name', e.target.value)}
                placeholder='Tier Name'
                error={errors[`${index}.name`]}
                classNames={{ input: styles.formInput ?? '' }}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <ColorInput
                value={tier.color}
                onChange={(value) => updateTier(index, 'color', value)}
                placeholder='#000000'
                error={errors[`${index}.color`]}
                classNames={{ input: styles.formInput ?? '' }}
                format='hex'
                swatches={[
                  '#E5E4E2',
                  '#DEAE4A',
                  '#C7D3DB',
                  '#BB8F4C',
                  '#8B5CF6',
                  '#10B981',
                  '#0891B2',
                  '#6366F1',
                ]}
              />
            </Grid.Col>
            <Grid.Col span={1}>
              <ActionIcon
                color='red'
                variant='subtle'
                onClick={() => deleteTier(index)}
                className={styles.deleteButton ?? ''}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Grid.Col>
          </Grid>
        ))}

        <Button variant='subtle' onClick={addTier} className={styles.addTierButton ?? ''}>
          <IconPlus size={16} />
          Add Tier
        </Button>

        <div className={styles.buttonGroup ?? ''}>
          <Button variant='subtle' onClick={onClose}>
            Cancel
          </Button>
          <Button variant='primary' onClick={handleUpdateTiers}>
            Save Tiers
          </Button>
        </div>
      </Stack>
    </Modal>
  );
};

export default TierManagementModal;
