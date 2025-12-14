import { Button, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useGetOrganizationQuery } from '@/app/features/organizations/api';
import { InviteUserModal } from '@/shared/components/modals/organization/InviteUserModal';
import { MemberCard } from './MemberCard';
import styles from './styles/index.module.css';

export const MembersList = ({ organizationId }) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { data: organization } = useGetOrganizationQuery(organizationId);

  const canInvite = organization?.user_is_admin_or_owner;

  if (!organization) return null;

  return (
    <div className={styles.membersSection}>
      <div className={styles.membersContainer}>
        <div className={styles.header}>
          <Text size='md' weight={500}>
            Members ({organization.member_count})
          </Text>
          {canInvite && (
            <Button
              onClick={() => setShowInviteModal(true)}
              variant='subtle'
              size='sm'
              p={0}
              className={styles.addButton}
            >
              <IconPlus size={16} />
            </Button>
          )}
        </div>

        <div className={styles.membersGrid}>
          {organization.users.map((user) => (
            <MemberCard key={user.id} user={user} />
          ))}
        </div>
      </div>

      <InviteUserModal
        organizationId={organizationId}
        opened={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
};
