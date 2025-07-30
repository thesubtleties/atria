import { useState } from 'react';
import { Tabs, TextInput, Select, Group, Badge } from '@mantine/core';
import { IconSearch, IconUsers, IconMail, IconUserPlus } from '@tabler/icons-react';
import { Button } from '../../../../shared/components/buttons';
import MembersList from './MembersList';
import PendingInvitations from './PendingInvitations';
import InviteModal from './InviteModal';
import styles from './styles/index.module.css';

const MembersSection = ({ orgId, organization, currentUserRole, activeTab, onTabChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [inviteModalOpened, setInviteModalOpened] = useState(false);

  const canInvite = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

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
          <Button
            variant="primary"
            leftIcon={<IconUserPlus size={18} />}
            onClick={() => setInviteModalOpened(true)}
          >
            Invite Members
          </Button>
        )}
      </div>

      <Tabs 
        value={activeTab} 
        onChange={onTabChange}
        className={styles.tabsContainer}
      >
        <Tabs.List className={styles.tabsList}>
          <Tabs.Tab 
            value="members" 
            leftSection={<IconUsers size={16} />}
            className={styles.tab}
          >
            Active Members
          </Tabs.Tab>
          {canInvite && (
            <Tabs.Tab 
              value="invitations" 
              leftSection={<IconMail size={16} />}
              className={styles.tab}
            >
              Pending Invitations
            </Tabs.Tab>
          )}
        </Tabs.List>

        <div className={styles.filterBar}>
          <TextInput
            placeholder="Search by name or email..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          
          {activeTab === 'members' && (
            <Select
              data={roleOptions}
              value={roleFilter}
              onChange={setRoleFilter}
              className={styles.roleFilter}
              clearable={false}
            />
          )}
        </div>

        <Tabs.Panel value="members" className={styles.tabPanel}>
          <MembersList
            orgId={orgId}
            searchQuery={searchQuery}
            roleFilter={roleFilter}
            currentUserRole={currentUserRole}
          />
        </Tabs.Panel>

        {canInvite && (
          <Tabs.Panel value="invitations" className={styles.tabPanel}>
            <PendingInvitations
              orgId={orgId}
              searchQuery={searchQuery}
            />
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