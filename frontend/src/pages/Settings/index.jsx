import { useState } from 'react';
import { Text } from '@mantine/core';
import { IconLock, IconUser, IconBell, IconShield } from '@tabler/icons-react';
import { Tabs } from '@mantine/core';
import PrivacySettings from './components/PrivacySettings';
import SecuritySettings from './components/SecuritySettings';
import styles from './styles/index.module.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('privacy');
  
  return (
    <div className={styles.container}>
      {/* Background Shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />

      <div className={styles.contentWrapper}>
        {/* Header Section */}
        <section className={styles.headerSection}>
          <h2 className={styles.pageTitle}>Settings</h2>
        </section>

        {/* Main Content Section */}
        <section className={styles.mainContent}>
          <Tabs value={activeTab} onChange={setActiveTab} className={styles.tabsContainer}>
            <Tabs.List className={styles.tabsList}>
              <Tabs.Tab 
                value="privacy" 
                className={styles.tab}
                leftSection={<IconLock size={16} />}
              >
                Privacy
              </Tabs.Tab>
              <Tabs.Tab 
                value="profile" 
                className={styles.tab}
                leftSection={<IconUser size={16} />}
              >
                Profile
              </Tabs.Tab>
              <Tabs.Tab 
                value="notifications" 
                className={styles.tab}
                leftSection={<IconBell size={16} />} 
                disabled
              >
                Notifications
              </Tabs.Tab>
              <Tabs.Tab 
                value="security" 
                className={styles.tab}
                leftSection={<IconShield size={16} />}
              >
                Security
              </Tabs.Tab>
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