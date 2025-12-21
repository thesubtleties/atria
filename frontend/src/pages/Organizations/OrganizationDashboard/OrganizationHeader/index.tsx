import { useState } from 'react';
import { Badge, ActionIcon, Text, Collapse } from '@mantine/core';
import { IconBuilding, IconUsers, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import OrganizationNameSection from './OrganizationNameSection';
import MuxCredentialsSection from './MuxCredentialsSection';
import JaasCredentialsSection from './JaasCredentialsSection';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';
import type { OrganizationUserRole } from '@/types';

type Organization = {
  id: number;
  name: string;
  description?: string;
  member_count?: number;
  has_mux_signing_credentials?: boolean;
  has_jaas_credentials?: boolean;
};

type OrganizationHeaderProps = {
  organization: Organization;
  currentUserRole: OrganizationUserRole;
};

const OrganizationHeader = ({ organization, currentUserRole }: OrganizationHeaderProps) => {
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  return (
    <section className={cn(styles.headerSection)}>
      <div className={cn(styles.headerContent)}>
        <div className={cn(styles.organizationInfo)}>
          <div className={cn(styles.iconWrapper)}>
            <IconBuilding size={48} stroke={1.5} />
          </div>

          <div className={cn(styles.titleArea)}>
            <h1 className={cn(styles.organizationName)}>{organization.name}</h1>

            <div className={cn(styles.metadata)}>
              <Badge
                leftSection={<IconUsers size={14} />}
                variant='light'
                color='violet'
                size='lg'
                className={cn(styles.memberBadge)}
              >
                {organization.member_count || 0} member
                {organization.member_count !== 1 ? 's' : ''}
              </Badge>

              <Badge
                variant='outline'
                color={
                  currentUserRole === 'OWNER' ? 'violet'
                  : currentUserRole === 'ADMIN' ?
                    'pink'
                  : 'blue'
                }
                size='lg'
                className={cn(styles.roleBadge)}
              >
                {currentUserRole}
              </Badge>
            </div>
          </div>
        </div>

        {/* Settings toggle */}
        <div className={cn(styles.headerActions)}>
          <ActionIcon
            size='lg'
            variant='subtle'
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            className={cn(styles.settingsButton)}
            title={settingsExpanded ? 'Hide Settings' : 'Show Settings'}
          >
            {settingsExpanded ?
              <IconChevronUp size={22} />
            : <IconChevronDown size={22} />}
          </ActionIcon>
        </div>
      </div>

      {organization.description && (
        <Text className={cn(styles.description)} size='sm' c='dimmed'>
          {organization.description}
        </Text>
      )}

      {/* Expandable Settings Section */}
      <Collapse in={settingsExpanded}>
        <div className={cn(styles.settingsContainer)}>
          <OrganizationNameSection organization={organization} currentUserRole={currentUserRole} />
          <MuxCredentialsSection organization={organization} currentUserRole={currentUserRole} />
          <JaasCredentialsSection organization={organization} currentUserRole={currentUserRole} />
        </div>
      </Collapse>
    </section>
  );
};

export default OrganizationHeader;
