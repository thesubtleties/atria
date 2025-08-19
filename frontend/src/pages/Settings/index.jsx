import { useState } from 'react';
import { Text, Select } from '@mantine/core';
import { IconLock, IconUser, IconBell, IconShield, IconChevronDown } from '@tabler/icons-react';
import { Tabs } from '@mantine/core';
import PrivacySettings from './components/PrivacySettings';
import SecuritySettings from './components/SecuritySettings';
import styles from './styles/index.module.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('privacy');
  
  // Tab configuration with icons and labels
  const tabConfig = [
    { value: 'privacy', label: 'Privacy', icon: IconLock },
    { value: 'profile', label: 'Profile', icon: IconUser },
    { value: 'notifications', label: 'Notifications', icon: IconBell, disabled: true },
    { value: 'security', label: 'Security', icon: IconShield },
  ];
  
  // Get current tab info for mobile dropdown
  const currentTab = tabConfig.find(tab => tab.value === activeTab);
  const CurrentIcon = currentTab?.icon;
  
  return (
    <div className={styles.container}>
      {/* Background Shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />

      <div className={styles.contentWrapper}>
        {/* Header Section */}
        <section className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.subtitle}>Manage your privacy, security, and profile settings</p>
        </section>

        {/* Main Content Section */}
        <section className={styles.mainContent}>
          {/* Mobile Dropdown - Only visible on mobile */}
          <div className={styles.mobileTabSelector}>
            <Select
              value={activeTab}
              onChange={setActiveTab}
              data={tabConfig.map(tab => ({
                value: tab.value,
                label: tab.label,
                disabled: tab.disabled
              }))}
              leftSection={CurrentIcon && <CurrentIcon size={16} />}
              rightSection={<IconChevronDown size={16} />}
              className={styles.mobileSelect}
              classNames={{
                input: styles.mobileSelectInput,
                dropdown: styles.mobileSelectDropdown
              }}
              placeholder="Select Settings Tab"
              searchable={false}
              allowDeselect={false}
            />
          </div>
          
          <Tabs value={activeTab} onChange={setActiveTab} className={styles.tabsContainer}>
            {/* Desktop Tabs - Hidden on mobile */}
            <Tabs.List className={styles.tabsList}>
              {tabConfig.map(tab => {
                const TabIcon = tab.icon;
                return (
                  <Tabs.Tab 
                    key={tab.value}
                    value={tab.value} 
                    className={styles.tab}
                    leftSection={<TabIcon size={16} />}
                    disabled={tab.disabled}
                  >
                    {tab.label}
                  </Tabs.Tab>
                );
              })}
            </Tabs.List>
            
            <Tabs.Panel value="privacy" className={styles.tabPanel}>
              <PrivacySettings />
            </Tabs.Panel>
            
            <Tabs.Panel value="profile" className={styles.tabPanel}>
              <div className={styles.infoAlert}>
                <Text c="dimmed">
                  Profile settings can be updated on your{' '}
                  <a href="/app/profile" className={styles.link}>
                    profile page
                  </a>
                </Text>
              </div>
            </Tabs.Panel>
            
            <Tabs.Panel value="security" className={styles.tabPanel}>
              <SecuritySettings />
            </Tabs.Panel>
          </Tabs>
        </section>
      </div>
    </div>
  );
};

export default Settings;