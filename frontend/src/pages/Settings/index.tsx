import { useState } from 'react';
import { Text, Select } from '@mantine/core';
import { IconLock, IconUser, IconBell, IconShield, IconChevronDown } from '@tabler/icons-react';
import { Tabs } from '@mantine/core';
import type { Icon } from '@tabler/icons-react';
import PrivacySettings from './components/PrivacySettings';
import SecuritySettings from './components/SecuritySettings';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type TabConfig = {
  value: string;
  label: string;
  icon: Icon;
  disabled?: boolean;
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState<string | null>('privacy');

  // Tab configuration with icons and labels
  const tabConfig: TabConfig[] = [
    { value: 'privacy', label: 'Privacy', icon: IconLock },
    { value: 'profile', label: 'Profile', icon: IconUser },
    { value: 'notifications', label: 'Notifications', icon: IconBell, disabled: true },
    { value: 'security', label: 'Security', icon: IconShield },
  ];

  // Get current tab info for mobile dropdown
  const currentTab = tabConfig.find((tab) => tab.value === activeTab);
  const CurrentIcon = currentTab?.icon;

  return (
    <div className={cn(styles.container)}>
      {/* Background Shapes */}
      <div className={cn(styles.bgShape1)} />
      <div className={cn(styles.bgShape2)} />

      <div className={cn(styles.contentWrapper)}>
        {/* Header Section */}
        <section className={cn(styles.headerSection)}>
          <h1 className={cn(styles.pageTitle)}>Settings</h1>
          <p className={cn(styles.subtitle)}>Manage your privacy, security, and profile settings</p>
        </section>

        {/* Main Content Section */}
        <section className={cn(styles.mainContent)}>
          {/* Mobile Dropdown - Only visible on mobile */}
          <div className={cn(styles.mobileTabSelector)}>
            <Select
              value={activeTab}
              onChange={setActiveTab}
              data={tabConfig.map((tab) => ({
                value: tab.value,
                label: tab.label,
                disabled: tab.disabled ?? false,
              }))}
              leftSection={CurrentIcon && <CurrentIcon size={16} />}
              rightSection={<IconChevronDown size={16} />}
              className={cn(styles.mobileSelect)}
              classNames={{
                input: cn(styles.mobileSelectInput),
                dropdown: cn(styles.mobileSelectDropdown),
              }}
              placeholder='Select Settings Tab'
              searchable={false}
              allowDeselect={false}
            />
          </div>

          <Tabs value={activeTab} onChange={setActiveTab} className={cn(styles.tabsContainer)}>
            {/* Desktop Tabs - Hidden on mobile */}
            <Tabs.List className={cn(styles.tabsList)}>
              {tabConfig.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <Tabs.Tab
                    key={tab.value}
                    value={tab.value}
                    className={cn(styles.tab)}
                    leftSection={<TabIcon size={16} />}
                    disabled={tab.disabled}
                  >
                    {tab.label}
                  </Tabs.Tab>
                );
              })}
            </Tabs.List>

            <Tabs.Panel value='privacy' className={cn(styles.tabPanel)}>
              <PrivacySettings />
            </Tabs.Panel>

            <Tabs.Panel value='profile' className={cn(styles.tabPanel)}>
              <div className={cn(styles.infoAlert)}>
                <Text c='dimmed'>
                  Profile settings can be updated on your{' '}
                  <a href='/app/profile' className={cn(styles.link)}>
                    profile page
                  </a>
                </Text>
              </div>
            </Tabs.Panel>

            <Tabs.Panel value='security' className={cn(styles.tabPanel)}>
              <SecuritySettings />
            </Tabs.Panel>
          </Tabs>
        </section>
      </div>
    </div>
  );
};

export default Settings;
