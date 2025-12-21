import { useNavigate } from 'react-router-dom';
import { TextInput, Button, Stack, Title, Container } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useCreateOrganizationMutation } from '@/app/features/organizations/api';
import { createOrgSchema } from './schemas/createOrgSchema';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type CreateOrgFormValues = {
  name: string;
};

type CreateOrgResponse = {
  id: number;
};

export const CreateOrganization = () => {
  const navigate = useNavigate();
  const [createOrg, { isLoading }] = useCreateOrganizationMutation();

  const form = useForm<CreateOrgFormValues>({
    initialValues: {
      name: '',
    },
    validate: zodResolver(createOrgSchema),
  });

  const handleSubmit = async (values: CreateOrgFormValues) => {
    try {
      const newOrg = (await createOrg(values).unwrap()) as CreateOrgResponse;
      navigate(`/app/organizations/${newOrg.id}`, { replace: true });
    } catch (error) {
      console.error('Failed to create organization:', error);
    }
  };

  return (
    <Container size='sm' className={cn(styles.container)}>
      <Stack gap='xl' align='center'>
        <Title order={1} ta='center'>
          Name Your Organization
        </Title>

        <form onSubmit={form.onSubmit(handleSubmit)} className={cn(styles.form)}>
          <Stack gap='xl' w='100%'>
            <TextInput
              required
              size='xl'
              placeholder='Enter organization name'
              {...form.getInputProps('name')}
              styles={{
                input: {
                  fontSize: '1.5rem',
                  textAlign: 'center',
                },
              }}
            />

            <Button
              type='submit'
              loading={isLoading}
              size='lg'
              fullWidth
              variant='gradient'
              gradient={{ from: '#9c42f5', to: '#6d42f5', deg: 135 }}
              className={cn(styles.button)}
            >
              Create Organization
            </Button>
          </Stack>
        </form>
      </Stack>
    </Container>
  );
};
