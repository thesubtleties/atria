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
    <Group justify="center" gap="md">
      <Button variant="filled" onClick={handleLogin}>
        Log In
      </Button>
      <Button variant="outline" onClick={handleSignup}>
        Sign Up
      </Button>
    </Group>
  );
};
