import { Button, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useGetOrganizationQuery } from '@/app/features/organizations/api';
import { InviteUserModal } from '@/shared/components/modals/organization/InviteUserModal';
import { MemberCard } from './MemberCard';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type MembersListProps = {
  organizationId: string | number;
};

type OrganizationUser = {
  id: number;
  full_name: string;
  role: string;
};

type OrganizationData = {
  user_is_admin_or_owner?: boolean;
  member_count?: number;
  users: OrganizationUser[];
};

export const MembersList = ({ organizationId }: MembersListProps) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const orgId = typeof organizationId === 'string' ? parseInt(organizationId) : organizationId;
  const { data: organization } = useGetOrganizationQuery(orgId);

  const typedOrganization = organization as OrganizationData | undefined;

  const canInvite = typedOrganization?.user_is_admin_or_owner;

  if (!typedOrganization) return null;

  return (
    <div className={cn(styles.membersSection)}>
      <div className={cn(styles.membersContainer)}>
        <div className={cn(styles.header)}>
          <Text size='md' fw={500}>
            Members ({typedOrganization.member_count})
          </Text>
          {canInvite && (
            <Button
              onClick={() => setShowInviteModal(true)}
              variant='subtle'
              size='sm'
              p={0}
              className={cn(styles.addButton)}
            >
              <IconPlus size={16} />
            </Button>
          )}
        </div>

        <div className={cn(styles.membersGrid)}>
          {typedOrganization.users.map((user) => (
            <MemberCard key={user.id} user={user} />
          ))}
        </div>
      </div>

      <InviteUserModal
        organizationId={orgId}
        opened={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
};
