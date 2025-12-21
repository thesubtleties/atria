import { useState, type ChangeEvent } from 'react';
import { Tabs, TextInput, Select } from '@mantine/core';
import {
  IconSearch,
  IconUsers,
  IconMail,
  IconUserPlus,
  IconChevronDown,
} from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';
import { Button } from '@/shared/components/buttons';
import MembersList from './MembersList';
import PendingInvitations from './PendingInvitations';
import InviteModal from './InviteModal';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';
import type { OrganizationUserRole } from '@/types';

type MembersSectionProps = {
  orgId?: string | undefined;
  currentUserRole: OrganizationUserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
};

type TabConfig = {
  value: string;
  label: string;
  icon: Icon;
};

const MembersSection = ({
  orgId,
  currentUserRole,
  activeTab,
  onTabChange,
}: MembersSectionProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>('all');
  const [inviteModalOpened, setInviteModalOpened] = useState(false);

  const canInvite = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const tabConfig: TabConfig[] = [
    { value: 'members', label: 'Active Members', icon: IconUsers },
    ...(canInvite ? [{ value: 'invitations', label: 'Pending Invitations', icon: IconMail }] : []),
  ];

  const currentTab = tabConfig.find((tab) => tab.value === activeTab);
  const CurrentIcon = currentTab?.icon;

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'OWNER', label: 'Owners' },
    { value: 'ADMIN', label: 'Admins' },
    { value: 'MEMBER', label: 'Members' },
  ];

  return (
    <section className={cn(styles.membersSection)}>
      <div className={cn(styles.sectionHeader)}>
        <h2 className={cn(styles.sectionTitle)}>Organization Members</h2>
        {canInvite && (
          <Button variant='primary' onClick={() => setInviteModalOpened(true)}>
            <IconUserPlus size={18} style={{ marginRight: '0.5rem' }} />
            Invite Members
          </Button>
        )}
      </div>

      {/* Mobile Dropdown */}
      <div className={cn(styles.mobileTabSelector)}>
        <Select
          value={activeTab}
          onChange={(value) => value && onTabChange(value)}
          data={tabConfig.map((tab) => ({
            value: tab.value,
            label: tab.label,
          }))}
          leftSection={CurrentIcon && <CurrentIcon size={16} />}
          rightSection={<IconChevronDown size={16} />}
          className={cn(styles.mobileSelect)}
          classNames={{
            input: cn(styles.mobileSelectInput),
            dropdown: cn(styles.mobileSelectDropdown),
          }}
          placeholder='Select Tab'
          searchable={false}
          allowDeselect={false}
        />
      </div>

      <Tabs
        value={activeTab}
        onChange={(value) => value && onTabChange(value)}
        className={cn(styles.tabsContainer)}
      >
        <Tabs.List className={cn(styles.tabsList)}>
          {tabConfig.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <Tabs.Tab
                key={tab.value}
                value={tab.value}
                leftSection={<TabIcon size={16} />}
                className={cn(styles.tab)}
              >
                {tab.label}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>

        <div className={cn(styles.filterBar)}>
          <TextInput
            placeholder='Search by name or email...'
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className={cn(styles.searchInput)}
          />

          {activeTab === 'members' && (
            <Select
              data={roleOptions}
              value={roleFilter}
              onChange={(value) => setRoleFilter(value || 'all')}
              className={cn(styles.roleFilter)}
              clearable={false}
              allowDeselect={false}
            />
          )}
        </div>

        <Tabs.Panel value='members' className={cn(styles.tabPanel)}>
          <MembersList
            orgId={orgId}
            searchQuery={searchQuery}
            roleFilter={roleFilter || 'all'}
            currentUserRole={currentUserRole}
          />
        </Tabs.Panel>

        {canInvite && (
          <Tabs.Panel value='invitations' className={cn(styles.tabPanel)}>
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
              window.location.reload();
            }
          }}
        />
      )}
    </section>
  );
};

export default MembersSection;
