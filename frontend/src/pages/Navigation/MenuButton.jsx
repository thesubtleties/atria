// MenuButton.jsx
import { Menu, Button, rem } from '@mantine/core';
import { IconUser, IconLogout, IconSettings } from '@tabler/icons-react';
import styles from './MenuButton.module.css';

export const MenuButton = () => {
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
        <Menu.Label>Account</Menu.Label>

        <Menu.Item
          leftSection={<IconUser style={{ width: rem(14), height: rem(14) }} />}
        >
          Profile
        </Menu.Item>

        <Menu.Item
          leftSection={
            <IconSettings style={{ width: rem(14), height: rem(14) }} />
          }
        >
          Settings
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          color="red"
          leftSection={
            <IconLogout style={{ width: rem(14), height: rem(14) }} />
          }
          onClick={() => {
            /* handle logout */
          }}
        >
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
