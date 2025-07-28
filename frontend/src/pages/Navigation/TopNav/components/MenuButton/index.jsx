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
      offset={8}
      withArrow
      arrowOffset={16}
      transitionProps={{ transition: 'pop-top-right', duration: 150 }}
      styles={(theme) => ({
        dropdown: {
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: rem(8),
          border: '1px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.08)',
          padding: rem(6),
          minWidth: rem(200),
        },
        arrow: {
          border: '1px solid rgba(255, 255, 255, 0.95)',
          background: 'rgba(255, 255, 255, 0.9)',
        },
        item: {
          fontSize: rem(13),
          padding: `${rem(8)} ${rem(10)}`,
          borderRadius: rem(6),
          color: '#1E293B',
          fontWeight: 500,
          transition: 'all 0.2s ease',
          lineHeight: 1.4,
          '&[data-hovered]': {
            backgroundColor: 'rgba(139, 92, 246, 0.08)',
            color: '#8B5CF6',
            transform: 'translateX(2px)',
          },
        },
        label: {
          fontSize: rem(11),
          fontWeight: 600,
          color: '#94A3B8',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: `${rem(6)} ${rem(10)}`,
        },
        divider: {
          borderColor: 'rgba(139, 92, 246, 0.08)',
          margin: `${rem(6)} 0`,
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
              minHeight: '40px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // Option 1: Subtle gold/amber glow
              // background: 'rgba(255, 255, 255, 0.05)',
              // border: 'none',
              // boxShadow: '0 0 16px rgba(245, 158, 11, 0.15)',
              // '&:hover': {
              //   backgroundColor: 'rgba(255, 255, 255, 0.1)',
              //   boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)',
              //   transform: 'scale(1.05)',
              // },

              // Option 2: Purple glow to match brand (uncomment to try)
              // background: 'rgba(255, 255, 255, 0.05)',
              // border: 'none',
              // boxShadow: '0 0 16px rgba(139, 92, 246, 0.2)',
              // '&:hover': {
              //   backgroundColor: 'rgba(255, 255, 255, 0.1)',
              //   boxShadow: '0 0 24px rgba(139, 92, 246, 0.3)',
              //   transform: 'scale(1.05)',
              // },

              // Option 3: Minimal shadow only (uncomment to try)
              background: 'transparent',
              border: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                transform: 'translateY(-1px)',
              },
            },
          }}
        >
          <Image
            src="/favicon/android-chrome-192x192.png"
            alt="Atria"
            width={24}
            height={24}
            className={styles.menuIcon}
          />
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Navigation</Menu.Label>

        <Menu.Item
          leftSection={
            <IconLayoutDashboard
              style={{ width: rem(14), height: rem(14), color: '#8B5CF6' }}
            />
          }
          onClick={() => navigate('/app/dashboard')}
        >
          Dashboard
        </Menu.Item>

        <Menu.Item
          leftSection={
            <IconUser
              style={{ width: rem(14), height: rem(14), color: '#8B5CF6' }}
            />
          }
          onClick={() => navigate('/app/profile')}
        >
          Profile
        </Menu.Item>

        <Menu.Item
          leftSection={
            <IconUsers
              style={{ width: rem(14), height: rem(14), color: '#8B5CF6' }}
            />
          }
          onClick={() => navigate('/app/network')}
        >
          Network
        </Menu.Item>

        <Menu.Item
          leftSection={
            <IconBuilding
              style={{ width: rem(14), height: rem(14), color: '#8B5CF6' }}
            />
          }
          onClick={() => navigate('/app/organizations')}
        >
          Organizations
        </Menu.Item>

        <Menu.Item
          leftSection={
            <IconCalendarEvent
              style={{ width: rem(14), height: rem(14), color: '#8B5CF6' }}
            />
          }
          onClick={() => navigate('/app/events')}
        >
          Events
        </Menu.Item>

        <Menu.Item
          leftSection={
            <IconSettings
              style={{ width: rem(14), height: rem(14), color: '#8B5CF6' }}
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
