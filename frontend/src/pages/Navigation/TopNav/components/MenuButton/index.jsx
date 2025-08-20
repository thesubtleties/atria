// MenuButton.jsx
import { Menu, Button, rem } from '@mantine/core';
import {
  IconLogout,
  IconCalendarEvent,
  IconUser,
  IconUsers,
  IconSettings,
  IconLayoutDashboard,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '@/app/features/auth/api'; // Adjust import path as needed
import AtriaLogo from '@/assets/atria-logo.svg';
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
      offset={8}
      withArrow
      arrowOffset={16}
      zIndex={1100}
      transitionProps={{ transition: 'pop-top-right', duration: 150 }}
      classNames={{
        dropdown: styles.menuDropdown,
        arrow: styles.menuArrow,
        item: styles.menuItem,
        label: styles.menuLabel,
        divider: styles.menuDivider,
      }}
    >
      <Menu.Target>
        <Button
          variant="subtle"
          className={styles.menuButton}
        >
          <img 
            src={AtriaLogo} 
            alt="Atria" 
            className={styles.menuIcon}
            width="24"
            height="24"
          />
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Navigation</Menu.Label>

        <Menu.Item
          leftSection={
            <IconLayoutDashboard
              style={{ width: rem(14), height: rem(14), color: 'var(--color-primary)' }}
            />
          }
          onClick={() => navigate('/app/dashboard')}
        >
          Dashboard
        </Menu.Item>

        <Menu.Item
          leftSection={
            <IconUser
              style={{ width: rem(14), height: rem(14), color: 'var(--color-primary)' }}
            />
          }
          onClick={() => navigate('/app/profile')}
        >
          Profile
        </Menu.Item>

        <Menu.Item
          leftSection={
            <IconUsers
              style={{ width: rem(14), height: rem(14), color: 'var(--color-primary)' }}
            />
          }
          onClick={() => navigate('/app/network')}
        >
          Network
        </Menu.Item>

        <Menu.Item
          leftSection={
            <IconCalendarEvent
              style={{ width: rem(14), height: rem(14), color: 'var(--color-primary)' }}
            />
          }
          onClick={() => navigate('/app/events')}
        >
          Events
        </Menu.Item>

        <Menu.Item
          leftSection={
            <IconSettings
              style={{ width: rem(14), height: rem(14), color: 'var(--color-primary)' }}
            />
          }
          onClick={() => navigate('/app/settings')}
        >
          Settings
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          className={styles.logoutItem}
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
