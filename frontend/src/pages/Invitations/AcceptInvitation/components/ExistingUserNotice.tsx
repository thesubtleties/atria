import { Title, Text, Group, ThemeIcon } from '@mantine/core';
import { Button } from '@/shared/components/buttons';
import { IconUserCheck, IconLogin } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import styles from '../styles/ExistingUserNotice.module.css';

type ExistingUserNoticeProps = {
  email: string;
};

const ExistingUserNotice = ({ email }: ExistingUserNoticeProps) => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    // Navigate to login, storing return URL
    const returnUrl = encodeURIComponent(window.location.pathname);
    navigate(`/?returnUrl=${returnUrl}`);
  };

  return (
    <div className={cn(styles.container)}>
      <div className={cn(styles.iconWrapper)}>
        <ThemeIcon
          size={80}
          radius='xl'
          variant='light'
          color='blue'
          className={cn(styles.themeIcon)}
        >
          <IconUserCheck size={40} />
        </ThemeIcon>
      </div>

      <Title order={2} className={cn(styles.title)}>
        Welcome Back!
      </Title>

      <Text size='lg' c='dimmed' className={cn(styles.subtitle)}>
        An account already exists with
      </Text>

      <Text fw={600} size='lg' className={cn(styles.email)}>
        {email}
      </Text>

      <Text size='md' c='dimmed' className={cn(styles.description)}>
        {
          "Please sign in to manage your invitations. After logging in, you'll be able to view and accept all pending invitations from your dashboard."
        }
      </Text>

      <Group justify='center' mt='xl'>
        <Button variant='primary' onClick={handleSignIn} className={cn(styles.signInButton)}>
          <IconLogin size={20} style={{ marginRight: '0.5rem' }} />
          Sign In to Accept Invitations
        </Button>
      </Group>

      <Text size='xs' c='dimmed' className={cn(styles.footer)}>
        Not your account? Contact the person who invited you for assistance.
      </Text>
    </div>
  );
};

export default ExistingUserNotice;
