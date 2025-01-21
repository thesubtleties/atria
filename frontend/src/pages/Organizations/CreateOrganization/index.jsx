import { useNavigate } from 'react-router-dom';
import { TextInput, Button, Stack, Title, Container } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useCreateOrganizationMutation } from '@/app/features/organizations/api';
import { createOrgSchema } from './schemas/createOrgSchema';
import styles from './styles/index.module.css';

export const CreateOrganization = () => {
  const navigate = useNavigate();
  const [createOrg, { isLoading }] = useCreateOrganizationMutation();

  const form = useForm({
    initialValues: {
      name: '',
    },
    validate: zodResolver(createOrgSchema),
  });

  const handleSubmit = async (values) => {
    try {
      await createOrg(values).unwrap();
      navigate('/app/organizations', { replace: true });
    } catch (error) {
      // Handle error
      console.error('Failed to create organization:', error);
    }
  };

  return (
    <Container size="sm" className={styles.container}>
      <Stack spacing="xl" align="center">
        <Title order={1} align="center">
          Name Your Organization
        </Title>

        <form onSubmit={form.onSubmit(handleSubmit)} className={styles.form}>
          <Stack spacing="xl" w="100%">
            <TextInput
              required
              size="xl"
              placeholder="Enter organization name"
              {...form.getInputProps('name')}
              styles={(theme) => ({
                input: {
                  fontSize: '1.5rem',
                  textAlign: 'center',
                  '&::placeholder': {
                    color: theme.colors.gray[5],
                  },
                },
              })}
            />

            <Button
              type="submit"
              loading={isLoading}
              size="lg"
              fullWidth
              variant="gradient"
              gradient={{ from: '#9c42f5', to: '#6d42f5', deg: 135 }}
              className={styles.button}
            >
              Create Organization
            </Button>
          </Stack>
        </form>
      </Stack>
    </Container>
  );
};
