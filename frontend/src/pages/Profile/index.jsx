import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Stack,
  Group,
  TextInput,
  LoadingOverlay,
  Alert,
} from '@mantine/core';
import { IconCheck, IconX, IconUserPlus } from '@tabler/icons-react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useGetUserQuery, useUpdateUserMutation } from '@/app/features/users/api';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { updateUserProfile } from '@/app/store/authSlice';
import { profileSchema } from './schemas/profileSchema';
import { ProfileHero } from './ProfileHero';
import { ProfessionalInfo } from './ProfessionalInfo';
import { SocialLinks } from './SocialLinks';
import { ActivityOverview } from './ActivityOverview';
import { AboutSection } from './AboutSection';
import { Button } from '@/shared/components/buttons';
import styles from './styles/index.module.css';

export const ProfilePage = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const { userId } = useParams(); // Get userId from URL params
  const [isEditing, setIsEditing] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(null);
  const parallaxRef = useRef(null);
  
  // Determine which user profile to load
  const profileUserId = userId ? parseInt(userId) : currentUser?.id;
  const isOwnProfile = profileUserId === currentUser?.id;
  
  // Fetch user profile (backend will enforce connection requirement)
  const { data: userProfile, isLoading, error } = useGetUserQuery(profileUserId, {
    skip: !profileUserId,
  });
  
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  
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
      dispatch(updateUserProfile({
        ...values,
        full_name: `${values.first_name} ${values.last_name}`.trim(),
      }));
      
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

  // Generate random seed for DiceBear avatar
  const generateRandomSeed = () => {
    const length = Math.floor(Math.random() * 6) + 8; // 8-13 characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let seed = '';
    for (let i = 0; i < length; i++) {
      seed += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return seed;
  };

  const handleAvatarReroll = () => {
    const newSeed = generateRandomSeed();
    const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${newSeed}`;
    setTempImageUrl(newAvatarUrl);
    form.setFieldValue('image_url', newAvatarUrl);
  };
  
  if (isLoading) {
    return <LoadingOverlay visible />;
  }
  
  if (error) {
    // Handle 403 error for non-connected users
    if (error?.status === 403) {
      return (
        <Container size="xl" className={styles.profileContainer}>
          <Alert 
            color="yellow" 
            title="Connection Required"
            icon={<IconUserPlus size={20} />}
          >
            You must be connected with this user to view their profile.
          </Alert>
        </Container>
      );
    }
    
    return (
      <Container size="xl" className={styles.profileContainer}>
        <Alert color="red" title="Error">
          Failed to load profile
        </Alert>
      </Container>
    );
  }
  
  // Prepare user data with form values when editing
  const displayUser = isEditing ? {
    ...userProfile,
    full_name: `${form.values.first_name} ${form.values.last_name}`.trim() || userProfile?.full_name,
    title: form.values.title,
    company_name: form.values.company_name,
    image_url: tempImageUrl || form.values.image_url || userProfile?.image_url,
  } : userProfile;
  
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
        onAvatarReroll={handleAvatarReroll}
      />
      
      {/* Content Grid */}
      <div className={styles.profileGrid}>
        {/* Left Column */}
        <div>
          {/* Professional Info */}
          {isEditing ? (
            <section className={styles.profileSection}>
              <h2 className={styles.sectionTitle}>Professional Information</h2>
              <form onSubmit={form.onSubmit(handleSave)}>
                <Stack spacing="md">
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
                </Stack>
              </form>
            </section>
          ) : (
            <ProfessionalInfo user={userProfile} />
          )}
          
          {/* Social Links */}
          {isEditing ? (
            <section className={`${styles.profileSection} ${styles.sectionMarginTop}`}>
              <h2 className={styles.sectionTitle}>Social Links</h2>
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
            </section>
          ) : (
            <SocialLinks socialLinks={userProfile?.social_links} />
          )}
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
              <Button
                variant="subtle"
                onClick={handleCancel}
              >
                <IconX size={16} />
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isUpdating}
              >
                <IconCheck size={16} />
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

export default ProfilePage;