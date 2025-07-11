import { useState, useEffect } from 'react';
import {
  Container,
  Stack,
  Title,
  Paper,
  Group,
  Button,
  Text,
  Avatar,
  TextInput,
  Textarea,
  LoadingOverlay,
  Alert,
} from '@mantine/core';
import { IconEdit, IconCheck, IconX } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useGetUserQuery, useUpdateUserMutation } from '@/app/features/users/api';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { profileSchema } from './schemas/profileSchema';
import styles from './styles/index.module.css';

export const ProfilePage = () => {
  const currentUser = useSelector((state) => state.auth.user);
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: userProfile, isLoading, error } = useGetUserQuery(currentUser?.id, {
    skip: !currentUser?.id,
  });
  
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  
  const form = useForm({
    initialValues: {
      first_name: '',
      last_name: '',
      company_name: '',
      title: '',
      bio: '',
      social_links: {
        linkedin: '',
        twitter: '',
        website: '',
      },
    },
    validate: zodResolver(profileSchema),
  });
  
  // Update form when user data loads
  useEffect(() => {
    if (userProfile) {
      form.setValues({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        company_name: userProfile.company_name || '',
        title: userProfile.title || '',
        bio: userProfile.bio || '',
        social_links: {
          linkedin: userProfile.social_links?.linkedin || '',
          twitter: userProfile.social_links?.twitter || '',
          website: userProfile.social_links?.website || '',
        },
      });
    }
  }, [userProfile]);
  
  const handleSave = async (values) => {
    try {
      await updateUser({
        id: currentUser.id,
        ...values,
      }).unwrap();
      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully',
        color: 'green',
      });
      setIsEditing(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to update profile',
        color: 'red',
      });
    }
  };
  
  const handleCancel = () => {
    // Reset form to current user values
    if (userProfile) {
      form.setValues({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        company_name: userProfile.company_name || '',
        title: userProfile.title || '',
        bio: userProfile.bio || '',
        social_links: {
          linkedin: userProfile.social_links?.linkedin || '',
          twitter: userProfile.social_links?.twitter || '',
          website: userProfile.social_links?.website || '',
        },
      });
    }
    setIsEditing(false);
  };
  
  if (isLoading) {
    return <LoadingOverlay visible />;
  }
  
  if (error) {
    return (
      <Container size="xl" className={styles.container}>
        <Alert color="red" title="Error">
          Failed to load profile
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container size="xl" className={styles.container}>
      <Stack spacing="xl">
        {/* Header */}
        <Group position="apart">
          <Title order={1} className={styles.title}>
            My Profile
          </Title>
          {!isEditing && (
            <Button
              leftIcon={<IconEdit size={16} />}
              onClick={() => {
                // Populate form with current values when entering edit mode
                if (userProfile) {
                  form.setValues({
                    first_name: userProfile.first_name || '',
                    last_name: userProfile.last_name || '',
                    company_name: userProfile.company_name || '',
                    title: userProfile.title || '',
                    bio: userProfile.bio || '',
                    social_links: {
                      linkedin: userProfile.social_links?.linkedin || '',
                      twitter: userProfile.social_links?.twitter || '',
                      website: userProfile.social_links?.website || '',
                    },
                  });
                }
                setIsEditing(true);
              }}
              variant="subtle"
            >
              Edit Profile
            </Button>
          )}
        </Group>
        
        {/* Profile Content */}
        <Paper shadow="sm" p="xl" className={styles.profileCard}>
          <form onSubmit={form.onSubmit(handleSave)}>
            <Stack spacing="lg">
              {/* Avatar and Basic Info */}
              <Group spacing="xl" align="flex-start">
                <Avatar
                  src={userProfile?.image_url}
                  size={120}
                  radius="md"
                  className={styles.avatar}
                />
                
                <Stack spacing="sm" style={{ flex: 1 }}>
                  {isEditing ? (
                    <>
                      <Group grow>
                        <TextInput
                          label="First Name"
                          {...form.getInputProps('first_name')}
                          required
                        />
                        <TextInput
                          label="Last Name"
                          {...form.getInputProps('last_name')}
                          required
                        />
                      </Group>
                      <TextInput
                        label="Email"
                        value={userProfile?.email}
                        disabled
                        description="Email cannot be changed"
                      />
                    </>
                  ) : (
                    <>
                      <Title order={2} className={styles.name}>
                        {userProfile?.full_name}
                      </Title>
                      <Text color="dimmed" size="sm">
                        {userProfile?.email}
                      </Text>
                    </>
                  )}
                </Stack>
              </Group>
              
              {/* Professional Info */}
              <Stack spacing="md">
                <Title order={4} className={styles.sectionTitle}>
                  Professional Information
                </Title>
                
                {isEditing ? (
                  <>
                    <TextInput
                      label="Job Title"
                      placeholder="e.g., Software Engineer"
                      {...form.getInputProps('title')}
                    />
                    <TextInput
                      label="Company"
                      placeholder="e.g., Acme Corp"
                      {...form.getInputProps('company_name')}
                    />
                  </>
                ) : (
                  <div className={styles.infoGroup}>
                    {userProfile?.title && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Title</span>
                        <span className={styles.infoValue}>{userProfile.title}</span>
                      </div>
                    )}
                    {userProfile?.company_name && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Company</span>
                        <span className={styles.infoValue}>{userProfile.company_name}</span>
                      </div>
                    )}
                    {!userProfile?.title && !userProfile?.company_name && (
                      <Text color="dimmed" size="sm">
                        No professional information added
                      </Text>
                    )}
                  </div>
                )}
              </Stack>
              
              {/* Bio */}
              <Stack spacing="md">
                <Title order={4} className={styles.sectionTitle}>
                  About Me
                </Title>
                
                {isEditing ? (
                  <Textarea
                    placeholder="Tell us about yourself..."
                    minRows={4}
                    {...form.getInputProps('bio')}
                  />
                ) : (
                  <Text className={styles.bio}>
                    {userProfile?.bio || (
                      <Text component="span" color="dimmed" size="sm">
                        No bio added
                      </Text>
                    )}
                  </Text>
                )}
              </Stack>
              
              {/* Social Links */}
              <Stack spacing="md">
                <Title order={4} className={styles.sectionTitle}>
                  Social Links
                </Title>
                
                {isEditing ? (
                  <Stack spacing="sm">
                    <TextInput
                      label="LinkedIn"
                      placeholder="https://linkedin.com/in/username"
                      {...form.getInputProps('social_links.linkedin')}
                    />
                    <TextInput
                      label="Twitter"
                      placeholder="https://twitter.com/username"
                      {...form.getInputProps('social_links.twitter')}
                    />
                    <TextInput
                      label="Website"
                      placeholder="https://example.com"
                      {...form.getInputProps('social_links.website')}
                    />
                  </Stack>
                ) : (
                  <div className={styles.infoGroup}>
                    {userProfile?.social_links?.linkedin && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>LinkedIn</span>
                        <a
                          href={userProfile.social_links.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.link}
                        >
                          {userProfile.social_links.linkedin}
                        </a>
                      </div>
                    )}
                    {userProfile?.social_links?.twitter && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Twitter</span>
                        <a
                          href={userProfile.social_links.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.link}
                        >
                          {userProfile.social_links.twitter}
                        </a>
                      </div>
                    )}
                    {userProfile?.social_links?.website && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Website</span>
                        <a
                          href={userProfile.social_links.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.link}
                        >
                          {userProfile.social_links.website}
                        </a>
                      </div>
                    )}
                    {!userProfile?.social_links?.linkedin &&
                      !userProfile?.social_links?.twitter &&
                      !userProfile?.social_links?.website && (
                        <Text color="dimmed" size="sm">
                          No social links added
                        </Text>
                      )}
                  </div>
                )}
              </Stack>
              
              {/* Action Buttons */}
              {isEditing && (
                <Group position="right" mt="xl">
                  <Button
                    variant="subtle"
                    color="gray"
                    onClick={handleCancel}
                    leftIcon={<IconX size={16} />}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={isUpdating}
                    leftIcon={<IconCheck size={16} />}
                  >
                    Save Changes
                  </Button>
                </Group>
              )}
            </Stack>
          </form>
        </Paper>
        
        {/* Account Information */}
        <Paper shadow="sm" p="xl" className={styles.accountCard}>
          <Stack spacing="md">
            <Title order={4} className={styles.sectionTitle}>
              Account Information
            </Title>
            <div className={styles.infoGroup}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Member Since</span>
                <span className={styles.infoValue}>
                  {new Date(userProfile?.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Account Status</span>
                <Text component="span" color={userProfile?.is_active ? 'green' : 'red'} weight={500}>
                  {userProfile?.is_active ? 'Active' : 'Inactive'}
                </Text>
              </div>
            </div>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default ProfilePage;