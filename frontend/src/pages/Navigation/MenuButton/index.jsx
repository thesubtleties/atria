// MenuButton.jsx
import { Menu, Button, rem } from '@mantine/core';
import {
  IconLogout,
  IconBuilding,
  IconCalendarEvent,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '@/app/features/auth/api'; // Adjust import path as needed
import styles from './MenuButton.module.css';

export const MenuButton = () => {
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate('/'); // Optionally redirect to landing page after logout
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Menu
      position="bottom-end"
      offset={5}
      withArrow
      styles={(theme) => ({
        dropdown: {
          borderTopRightRadius: 0, // Sharp top-right corner
          borderTopLeftRadius: rem(8),
          borderBottomLeftRadius: rem(8),
          borderBottomRightRadius: rem(8),
          border: `1px solid ${theme.colors.gray[2]}`,
          boxShadow: theme.shadows.md,
        },
        arrow: {
          border: `1px solid ${theme.colors.gray[2]}`,
        },
      })}
    >
      <Menu.Target>
        <Button
          variant="subtle"
          className={styles.menuButton}
          styles={{
            root: {
              padding: '8px',
              height: '40px',
              '&:hover': {
                backgroundColor: 'transparent',
              },
            },
          }}
        >
          <span className={styles.menuIcon}>☰</span>
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Navigation</Menu.Label>

        <Menu.Item
          leftSection={
            <IconBuilding style={{ width: rem(14), height: rem(14) }} />
          }
          onClick={() => navigate('/app/organizations')}
        >
          Organizations
        </Menu.Item>

        <Menu.Item
          leftSection={
            <IconCalendarEvent style={{ width: rem(14), height: rem(14) }} />
          }
          onClick={() => navigate('/app/events')}
        >
          Events
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          color="red"
          leftSection={
            <IconLogout style={{ width: rem(14), height: rem(14) }} />
          }
          onClick={handleLogout}
        >
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
