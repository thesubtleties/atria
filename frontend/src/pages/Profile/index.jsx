import { useState, useEffect, useRef } from 'react';
import { Container, Stack, Group, TextInput, Alert } from '@mantine/core';
import { IconCheck, IconX, IconUserPlus } from '@tabler/icons-react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetUserQuery, useUpdateUserMutation } from '@/app/features/users/api';
import { useGetConnectionsQuery, useRemoveConnectionMutation } from '@/app/features/networking/api';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { updateUserProfile } from '@/app/store/authSlice';
import { LoadingPage } from '../../shared/components/loading';
import { profileSchema } from './schemas/profileSchema';
import { ProfileHero } from './ProfileHero';
import { ProfessionalInfo } from './ProfessionalInfo';
import { SocialLinks } from './SocialLinks';
import { ActivityOverview } from './ActivityOverview';
import { AboutSection } from './AboutSection';
import { Button } from '@/shared/components/buttons';
import { openConfirmationModal } from '@/shared/components/modals/ConfirmationModal';
import { EditAvatarModal } from '@/shared/components/modals/profile/EditAvatarModal';
import styles from './styles/index.module.css';

export const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const { userId } = useParams(); // Get userId from URL params
  const [isEditing, setIsEditing] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const parallaxRef = useRef(null);

  // Determine which user profile to load
  const profileUserId = userId ? parseInt(userId) : currentUser?.id;
  const isOwnProfile = profileUserId === currentUser?.id;

  // Fetch user profile (backend will enforce connection requirement)
  const {
    data: userProfile,
    isLoading,
    error,
  } = useGetUserQuery(profileUserId, {
    skip: !profileUserId,
  });

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [removeConnection, { isLoading: isRemovingConnection }] = useRemoveConnectionMutation();

  // Check connection status if viewing another user's profile
  const { data: connectionsData } = useGetConnectionsQuery(
    { page: 1, perPage: 1000 },
    { skip: isOwnProfile },
  );

  // Find the connection object if it exists
  const connection =
    !isOwnProfile &&
    connectionsData?.connections?.find((conn) => {
      const isRequester = conn.requester.id === profileUserId;
      const isRecipient = conn.recipient.id === profileUserId;
      const isAccepted = conn.status === 'accepted' || conn.status === 'ACCEPTED';
      return (isRequester || isRecipient) && isAccepted;
    });

  const form = useForm({
    initialValues: {
      first_name: '',
      last_name: '',
      company_name: '',
      title: '',
      bio: '',
      image_url: '',
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
        image_url: userProfile.image_url || '',
        social_links: {
          linkedin: userProfile.social_links?.linkedin || '',
          twitter: userProfile.social_links?.twitter || '',
          website: userProfile.social_links?.website || '',
        },
      });
    }
    // IMPORTANT: DO NOT add 'form' to dependencies - it causes infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  // Parallax effect for background shapes
  useEffect(() => {
    const handleScroll = () => {
      if (!parallaxRef.current) return;

      const scrolled = window.pageYOffset;
      const parallax = scrolled * 0.3;

      const shapes = parallaxRef.current.querySelectorAll('.bg-shape-1, .bg-shape-2');
      shapes.forEach((shape, index) => {
        shape.style.transform = `translateY(${parallax * (index + 1) * 0.1}px) rotate(${parallax * 0.05}deg)`;
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSave = async (values) => {
    try {
      await updateUser({
        id: currentUser.id,
        ...values,
      }).unwrap();

      // Update the auth store with the new user data
      dispatch(
        updateUserProfile({
          ...values,
          full_name: `${values.first_name} ${values.last_name}`.trim(),
        }),
      );

      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully',
        color: 'green',
      });
      setIsEditing(false);
      setTempImageUrl(null);
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
        image_url: userProfile.image_url || '',
        social_links: {
          linkedin: userProfile.social_links?.linkedin || '',
          twitter: userProfile.social_links?.twitter || '',
          website: userProfile.social_links?.website || '',
        },
      });
    }
    setTempImageUrl(null);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    if (userProfile) {
      form.setValues({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        company_name: userProfile.company_name || '',
        title: userProfile.title || '',
        bio: userProfile.bio || '',
        image_url: userProfile.image_url || '',
        social_links: {
          linkedin: userProfile.social_links?.linkedin || '',
          twitter: userProfile.social_links?.twitter || '',
          website: userProfile.social_links?.website || '',
        },
      });
    }
    setIsEditing(true);
  };

  const handleAvatarEdit = () => {
    setIsAvatarModalOpen(true);
  };

  const handleAvatarSave = (newAvatarUrl) => {
    setTempImageUrl(newAvatarUrl);
    form.setFieldValue('image_url', newAvatarUrl);
  };

  const handleRemoveConnection = () => {
    if (!connection) return;

    openConfirmationModal({
      title: 'Remove Connection',
      message: `Are you sure you want to remove your connection with ${userProfile?.full_name || 'this user'}? You will no longer be able to send direct messages to each other.`,
      confirmLabel: 'Remove Connection',
      cancelLabel: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await removeConnection(connection.id).unwrap();
          notifications.show({
            title: 'Connection Removed',
            message: 'You are no longer connected with this user',
            color: 'blue',
          });

          // Navigate back to previous page or dashboard
          if (window.history.length > 1) {
            navigate(-1); // Go back to previous page
          } else {
            navigate('/app/dashboard'); // Fallback to dashboard
          }
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: error.data?.message || 'Failed to remove connection',
            color: 'red',
          });
        }
      },
    });
  };

  if (isLoading) {
    return <LoadingPage message='Loading profile...' />;
  }

  if (error) {
    // Handle 403 error for non-connected users
    if (error?.status === 403) {
      return (
        <Container size='xl' className={styles.profileContainer}>
          <Alert color='yellow' title='Connection Required' icon={<IconUserPlus size={20} />}>
            You must be connected with this user to view their profile.
          </Alert>
        </Container>
      );
    }

    return (
      <Container size='xl' className={styles.profileContainer}>
        <Alert color='red' title='Error'>
          Failed to load profile
        </Alert>
      </Container>
    );
  }

  // Prepare user data with form values when editing
  const displayUser =
    isEditing ?
      {
        ...userProfile,
        full_name:
          `${form.values.first_name} ${form.values.last_name}`.trim() || userProfile?.full_name,
        title: form.values.title,
        company_name: form.values.company_name,
        image_url: tempImageUrl || form.values.image_url || userProfile?.image_url,
      }
    : userProfile;

  return (
    <main className={styles.profileContainer} ref={parallaxRef}>
      {/* Background Shapes */}
      <div className={`${styles.bgShape1} bg-shape-1`} />
      <div className={`${styles.bgShape2} bg-shape-2`} />

      {/* Profile Hero */}
      <ProfileHero
        user={displayUser}
        onEditClick={handleEditClick}
        isOwnProfile={isOwnProfile}
        isEditing={isEditing}
        onAvatarEdit={handleAvatarEdit}
        connection={connection}
        onRemoveConnection={handleRemoveConnection}
        isRemovingConnection={isRemovingConnection}
      />

      {/* Content Grid */}
      <div className={styles.profileGrid}>
        {/* Left Column */}
        <div>
          {/* Professional Info */}
          {isEditing ?
            <section className={styles.profileSection}>
              <h2 className={styles.sectionTitle}>Professional Information</h2>
              <form onSubmit={form.onSubmit(handleSave)}>
                <Stack spacing='md'>
                  <Group grow>
                    <TextInput
                      label='First Name'
                      {...form.getInputProps('first_name')}
                      required
                      classNames={{ input: styles.formInput }}
                    />
                    <TextInput
                      label='Last Name'
                      {...form.getInputProps('last_name')}
                      required
                      classNames={{ input: styles.formInput }}
                    />
                  </Group>
                  <TextInput
                    label='Email'
                    value={userProfile?.email}
                    disabled
                    description='Email cannot be changed'
                    classNames={{ input: styles.formInput }}
                  />
                  <TextInput
                    label='Job Title'
                    placeholder='e.g., Software Engineer'
                    {...form.getInputProps('title')}
                    classNames={{ input: styles.formInput }}
                  />
                  <TextInput
                    label='Company'
                    placeholder='e.g., Acme Corp'
                    {...form.getInputProps('company_name')}
                    classNames={{ input: styles.formInput }}
                  />
                </Stack>
              </form>
            </section>
          : <ProfessionalInfo user={userProfile} />}

          {/* Social Links */}
          {isEditing ?
            <section className={`${styles.profileSection} ${styles.sectionMarginTop}`}>
              <h2 className={styles.sectionTitle}>Social Links</h2>
              <Stack spacing='sm'>
                <TextInput
                  label='LinkedIn'
                  placeholder='https://linkedin.com/in/username'
                  {...form.getInputProps('social_links.linkedin')}
                  classNames={{ input: styles.formInput }}
                />
                <TextInput
                  label='Twitter'
                  placeholder='https://twitter.com/username'
                  {...form.getInputProps('social_links.twitter')}
                  classNames={{ input: styles.formInput }}
                />
                <TextInput
                  label='Website'
                  placeholder='https://example.com'
                  {...form.getInputProps('social_links.website')}
                  classNames={{ input: styles.formInput }}
                />
              </Stack>
            </section>
          : <SocialLinks socialLinks={userProfile?.social_links} />}
        </div>

        {/* Right Column */}
        <div>
          {/* Activity Overview - Only show for own profile */}
          {isOwnProfile && <ActivityOverview userId={profileUserId} />}

          {/* About */}
          <AboutSection
            bio={userProfile?.bio}
            isEditing={isEditing}
            value={form.values.bio}
            onChange={(value) => form.setFieldValue('bio', value)}
          />
        </div>
      </div>

      {/* Edit Mode Action Buttons */}
      {isEditing && (
        <div className={styles.editActions}>
          <form onSubmit={form.onSubmit(handleSave)} className={styles.editForm}>
            <div className={styles.editButtonGroup}>
              <Button variant='subtle' onClick={handleCancel}>
                <IconX size={16} />
                Cancel
              </Button>
              <Button type='submit' variant='primary' disabled={isUpdating}>
                <IconCheck size={16} />
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Avatar Editor Modal */}
      <EditAvatarModal
        opened={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSave={handleAvatarSave}
        currentUrl={form.values.image_url || userProfile?.image_url}
      />
    </main>
  );
};

export default ProfilePage;
