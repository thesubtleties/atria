import { Badge } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { Button } from '../../../../shared/components/buttons';
import styles from './styles.module.css';

const HeaderSection = ({ 
  roleCounts, 
  onInviteClick,
  title = "Attendees Management"
}) => {
  return (
    <section className={styles.headerSection}>
      <div className={styles.headerContent}>
        <div className={styles.headerLeft}>
          <h2 className={styles.pageTitle}>{title}</h2>
          <div className={styles.badgeGroup}>
            <div className={styles.badgeRow}>
              <Badge className={styles.totalBadge} size="md" radius="sm">
                {roleCounts.total || 0} Total
              </Badge>
            </div>
            <div className={styles.badgeRow}>
              <Badge className={styles.adminBadge} size="md" radius="sm">
                {roleCounts.admins || roleCounts.ADMIN || 0} Admins
              </Badge>
              <Badge className={styles.organizerBadge} size="md" radius="sm">
                {roleCounts.organizers || roleCounts.ORGANIZER || 0} Organizers
              </Badge>
              <Badge className={styles.speakerBadge} size="md" radius="sm">
                {roleCounts.speakers || roleCounts.SPEAKER || 0} Speakers
              </Badge>
              <Badge className={styles.attendeeBadge} size="md" radius="sm">
                {roleCounts.attendees || roleCounts.ATTENDEE || 0} Attendees
              </Badge>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Button
            variant="primary"
            onClick={onInviteClick}
            className={styles.addButton}
          >
            <IconPlus size={18} />
            Invite Attendees
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeaderSection;