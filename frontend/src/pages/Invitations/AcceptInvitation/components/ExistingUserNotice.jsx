import { Title, Text, Group, ThemeIcon } from '@mantine/core';
import { Button } from '../../../../shared/components/buttons';
import { IconUserCheck, IconLogin } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/ExistingUserNotice.module.css';

const ExistingUserNotice = ({ email }) => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    // Navigate to login, storing return URL
    const returnUrl = encodeURIComponent(window.location.pathname);
    navigate(`/?returnUrl=${returnUrl}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <ThemeIcon size={80} radius="xl" variant="light" color="blue" className={styles.themeIcon}>
          <IconUserCheck size={40} />
        </ThemeIcon>
      </div>

      <Title order={2} className={styles.title}>
        Welcome Back!
      </Title>

      <Text size="lg" c="dimmed" className={styles.subtitle}>
        An account already exists with
      </Text>
      
      <Text fw={600} size="lg" className={styles.email}>
        {email}
      </Text>

      <Text size="md" c="dimmed" className={styles.description}>
        {"Please sign in to manage your invitations. After logging in, you'll be able to view and accept all pending invitations from your dashboard."}
      </Text>

      <Group justify="center" mt="xl">
        <Button 
          variant="primary"
          onClick={handleSignIn}
          className={styles.signInButton}
        >
          <IconLogin size={20} style={{ marginRight: '0.5rem' }} />
          Sign In to Accept Invitations
        </Button>
      </Group>

      <Text size="xs" c="dimmed" className={styles.footer}>
        Not your account? Contact the person who invited you for assistance.
      </Text>
    </div>
  );
};

export default ExistingUserNotice;