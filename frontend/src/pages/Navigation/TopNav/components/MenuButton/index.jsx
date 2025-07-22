// MenuButton.jsx
import { Menu, Button, rem, Image } from '@mantine/core';
import {
  IconLogout,
  IconBuilding,
  IconCalendarEvent,
  IconUser,
  IconUsers,
  IconSettings,
  IconLayoutDashboard,
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
              borderRadius: '6px',
              transition: 'background-color 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(139, 92, 246, 0.08)',
              },
            },
          }}
        >
          <Image
            src="/favicon/android-chrome-192x192.png"
            alt="Atria"
            width={24}
            height={24}
          />
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Navigation</Menu.Label>

        <Menu.Item
          leftSection={
            <IconLayoutDashboard style={{ width: rem(14), height: rem(14) }} />
          }
          onClick={() => navigate('/app/dashboard')}
        >
          Dashboard
        </Menu.Item>

        <Menu.Item
          leftSection={
            <IconUser style={{ width: rem(14), height: rem(14) }} />
          }
          onClick={() => navigate('/app/profile')}
        >
          Profile
        </Menu.Item>

        <Menu.Item
          leftSection={
            <IconUsers style={{ width: rem(14), height: rem(14) }} />
          }
          onClick={() => navigate('/app/network')}
        >
          Network
        </Menu.Item>

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

        <Menu.Item
          leftSection={
            <IconSettings style={{ width: rem(14), height: rem(14) }} />
          }
          onClick={() => navigate('/app/settings')}
        >
          Settings
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
