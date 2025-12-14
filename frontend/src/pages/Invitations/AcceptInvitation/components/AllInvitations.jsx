import { Title, Text, Stack } from '@mantine/core';
import InvitationItem from './InvitationItem';
import RoleImplication from './RoleImplication';
import styles from '../styles/AllInvitations.module.css';

const AllInvitations = ({
  invitations,
  selectedInvitations,
  onSelectionChange,
  primaryInvitationId,
}) => {
  const { organization_invitations = [], event_invitations = [] } = invitations;

  // Group event invitations by organization
  const eventsByOrg = event_invitations.reduce((acc, inv) => {
    const orgId = inv.event.organization.id;
    if (!acc[orgId]) {
      acc[orgId] = {
        name: inv.event.organization.name,
        events: [],
      };
    }
    acc[orgId].events.push(inv);
    return acc;
  }, {});

  // Check if any event invitations require org membership
  const hasRoleImplications = event_invitations.some((inv) => {
    const requiresOrgMembership = ['ADMIN', 'ORGANIZER'].includes(inv.role);
    const hasOrgInvitation = organization_invitations.some(
      (orgInv) => orgInv.organization.id === inv.organization_id,
    );
    const orgSelected = selectedInvitations.organization_ids.includes(
      organization_invitations.find((oi) => oi.organization.id === inv.organization_id)?.id,
    );

    return requiresOrgMembership && hasOrgInvitation && !orgSelected;
  });

  if (organization_invitations.length === 0 && event_invitations.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Title order={3} mb='md' className={styles.title}>
        All Your Invitations
      </Title>
      <Text size='sm' c='dimmed' mb='xl' className={styles.subtitle}>
        {"Select which invitations you'd like to accept. We've pre-selected all of them for you."}
      </Text>

      {hasRoleImplications && <RoleImplication />}

      <Stack gap='xl'>
        {/* Organization Invitations */}
        {organization_invitations.length > 0 && (
          <div className={styles.section}>
            <Title order={4} mb='md' className={styles.sectionTitle}>
              Organization Invitations
            </Title>
            <Stack gap='md'>
              {organization_invitations.map((invitation) => (
                <InvitationItem
                  key={invitation.id}
                  invitation={invitation}
                  type='organization'
                  isSelected={selectedInvitations.organization_ids.includes(invitation.id)}
                  onSelectionChange={(isSelected) =>
                    onSelectionChange('organization', invitation.id, isSelected)
                  }
                  isPrimary={invitation.organization.id === primaryInvitationId}
                />
              ))}
            </Stack>
          </div>
        )}

        {/* Event Invitations */}
        {event_invitations.length > 0 && (
          <div className={styles.section}>
            <Title order={4} mb='md' className={styles.sectionTitle}>
              Event Invitations
            </Title>

            {/* Group by organization */}
            {Object.entries(eventsByOrg).map(([orgId, orgData]) => {
              const hasOrgInvite = organization_invitations.some(
                (inv) => inv.organization.id === parseInt(orgId),
              );

              return (
                <div key={orgId} className={styles.orgGroup}>
                  <Text size='sm' fw={500} c='dimmed' mb='sm' className={styles.orgGroupTitle}>
                    {orgData.name} Events
                  </Text>
                  <Stack gap='md' pl='md'>
                    {orgData.events.map((invitation) => {
                      const requiresOrgMembership = ['ADMIN', 'ORGANIZER'].includes(
                        invitation.role,
                      );
                      const orgInvitation = organization_invitations.find(
                        (oi) => oi.organization.id === parseInt(orgId),
                      );
                      const orgSelected =
                        orgInvitation &&
                        selectedInvitations.organization_ids.includes(orgInvitation.id);

                      return (
                        <InvitationItem
                          key={invitation.id}
                          invitation={invitation}
                          type='event'
                          isSelected={selectedInvitations.event_ids.includes(invitation.id)}
                          onSelectionChange={(isSelected) =>
                            onSelectionChange('event', invitation.id, isSelected)
                          }
                          isPrimary={invitation.event.id === primaryInvitationId}
                          showRoleWarning={requiresOrgMembership && hasOrgInvite && !orgSelected}
                        />
                      );
                    })}
                  </Stack>
                </div>
              );
            })}
          </div>
        )}
      </Stack>
    </div>
  );
};

export default AllInvitations;
