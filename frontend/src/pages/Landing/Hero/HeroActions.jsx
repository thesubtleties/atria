import { Button, Group } from '@mantine/core';
import styles from './styles/HeroActions.module.css';

export const HeroActions = () => {
  const handleLogin = () => {
    // TODO: Open login modal
    console.log('Open login modal');
  };

  const handleSignup = () => {
    // TODO: Open signup modal
    console.log('Open signup modal');
  };

  return (
    <div className={styles.actionsWrapper}>
      <Group className={styles.buttonGroup} justify="center" gap="md">
        <Button
          className={styles.loginButton}
          variant="filled"
          onClick={handleLogin}
          size="lg"
        >
          Log In
        </Button>
        <Button
          className={styles.signupButton}
          variant="outline"
          onClick={handleSignup}
          size="lg"
        >
          Sign Up
        </Button>
      </Group>
    </div>
  );
};
