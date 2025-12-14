import { useState } from 'react';
import { Tabs, TextInput, Select } from '@mantine/core';
import {
  IconSearch,
  IconUsers,
  IconMail,
  IconUserPlus,
  IconChevronDown,
} from '@tabler/icons-react';
import { Button } from '../../../../shared/components/buttons';
import MembersList from './MembersList';
import PendingInvitations from './PendingInvitations';
import InviteModal from './InviteModal';
import styles from './styles/index.module.css';

const MembersSection = ({ orgId, currentUserRole, activeTab, onTabChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [inviteModalOpened, setInviteModalOpened] = useState(false);

  const canInvite = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  // Tab configuration with icons and labels
  const tabConfig = [
    { value: 'members', label: 'Active Members', icon: IconUsers },
    ...(canInvite ? [{ value: 'invitations', label: 'Pending Invitations', icon: IconMail }] : []),
  ];

  // Get current tab info for mobile dropdown
  const currentTab = tabConfig.find((tab) => tab.value === activeTab);
  const CurrentIcon = currentTab?.icon;

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'OWNER', label: 'Owners' },
    { value: 'ADMIN', label: 'Admins' },
    { value: 'MEMBER', label: 'Members' },
  ];

  return (
    <section className={styles.membersSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Organization Members</h2>
        {canInvite && (
          <Button variant='primary' onClick={() => setInviteModalOpened(true)}>
            <IconUserPlus size={18} style={{ marginRight: '0.5rem' }} />
            Invite Members
          </Button>
        )}
      </div>

      {/* Mobile Dropdown - Only visible on mobile */}
      <div className={styles.mobileTabSelector}>
        <Select
          value={activeTab}
          onChange={onTabChange}
          data={tabConfig.map((tab) => ({
            value: tab.value,
            label: tab.label,
          }))}
          leftSection={CurrentIcon && <CurrentIcon size={16} />}
          rightSection={<IconChevronDown size={16} />}
          className={styles.mobileSelect}
          classNames={{
            input: styles.mobileSelectInput,
            dropdown: styles.mobileSelectDropdown,
          }}
          placeholder='Select Tab'
          searchable={false}
          allowDeselect={false}
        />
      </div>

      <Tabs value={activeTab} onChange={onTabChange} className={styles.tabsContainer}>
        {/* Desktop Tabs - Hidden on mobile */}
        <Tabs.List className={styles.tabsList}>
          {tabConfig.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <Tabs.Tab
                key={tab.value}
                value={tab.value}
                leftSection={<TabIcon size={16} />}
                className={styles.tab}
              >
                {tab.label}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>

        <div className={styles.filterBar}>
          <TextInput
            placeholder='Search by name or email...'
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />

          {activeTab === 'members' && (
            <Select
              data={roleOptions}
              value={roleFilter}
              onChange={(value) => setRoleFilter(value || 'all')}
              className={styles.roleFilter}
              clearable={false}
              allowDeselect={false}
            />
          )}
        </div>

        <Tabs.Panel value='members' className={styles.tabPanel}>
          <MembersList
            orgId={orgId}
            searchQuery={searchQuery}
            roleFilter={roleFilter}
            currentUserRole={currentUserRole}
          />
        </Tabs.Panel>

        {canInvite && (
          <Tabs.Panel value='invitations' className={styles.tabPanel}>
            <PendingInvitations orgId={orgId} searchQuery={searchQuery} />
          </Tabs.Panel>
        )}
      </Tabs>

      {canInvite && (
        <InviteModal
          opened={inviteModalOpened}
          onClose={() => setInviteModalOpened(false)}
          orgId={orgId}
          onSuccess={() => {
            if (activeTab === 'invitations') {
              // Trigger refetch of invitations
              window.location.reload();
            }
          }}
        />
      )}
    </section>
  );
};

export default MembersSection;
