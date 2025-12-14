import { useState } from 'react';
import { Badge, ActionIcon, Text, Collapse } from '@mantine/core';
import { IconBuilding, IconUsers, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import OrganizationNameSection from './OrganizationNameSection';
import MuxCredentialsSection from './MuxCredentialsSection';
import JaasCredentialsSection from './JaasCredentialsSection';
import styles from './styles/index.module.css';

const OrganizationHeader = ({ organization, currentUserRole }) => {
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  return (
    <section className={styles.headerSection}>
      <div className={styles.headerContent}>
        <div className={styles.organizationInfo}>
          <div className={styles.iconWrapper}>
            <IconBuilding size={48} stroke={1.5} />
          </div>

          <div className={styles.titleArea}>
            <h1 className={styles.organizationName}>{organization.name}</h1>

            <div className={styles.metadata}>
              <Badge
                leftSection={<IconUsers size={14} />}
                variant='light'
                color='violet'
                size='lg'
                className={styles.memberBadge}
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
                className={styles.roleBadge}
              >
                {currentUserRole}
              </Badge>
            </div>
          </div>
        </div>

        {/* Settings toggle */}
        <div className={styles.headerActions}>
          <ActionIcon
            size='lg'
            variant='subtle'
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            className={styles.settingsButton}
            title={settingsExpanded ? 'Hide Settings' : 'Show Settings'}
          >
            {settingsExpanded ?
              <IconChevronUp size={22} />
            : <IconChevronDown size={22} />}
          </ActionIcon>
        </div>
      </div>

      {organization.description && (
        <Text className={styles.description} size='sm' c='dimmed'>
          {organization.description}
        </Text>
      )}

      {/* Expandable Settings Section */}
      <Collapse in={settingsExpanded}>
        <div className={styles.settingsContainer}>
          <OrganizationNameSection organization={organization} currentUserRole={currentUserRole} />
          <MuxCredentialsSection organization={organization} currentUserRole={currentUserRole} />
          <JaasCredentialsSection organization={organization} currentUserRole={currentUserRole} />
        </div>
      </Collapse>
    </section>
  );
};

export default OrganizationHeader;
