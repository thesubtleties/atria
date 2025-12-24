import { Badge } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { Button } from '@/shared/components/buttons';
import { cn } from '@/lib/cn';
import styles from './styles.module.css';

type RoleCounts = {
  total: number;
  admins?: number;
  organizers?: number;
  speakers?: number;
  attendees?: number;
  ADMIN?: number;
  ORGANIZER?: number;
  SPEAKER?: number;
  ATTENDEE?: number;
};

type HeaderSectionProps = {
  roleCounts: RoleCounts;
  onInviteClick: () => void;
  title?: string;
};

const HeaderSection = ({
  roleCounts,
  onInviteClick,
  title = 'Attendees Management',
}: HeaderSectionProps) => {
  return (
    <section className={cn(styles.headerSection)}>
      <div className={cn(styles.headerContent)}>
        <div className={cn(styles.headerLeft)}>
          <h2 className={cn(styles.pageTitle)}>{title}</h2>
          <div className={cn(styles.badgeGroup)}>
            <div className={cn(styles.badgeRow)}>
              <Badge className={cn(styles.totalBadge)} size='md' radius='sm'>
                {roleCounts.total || 0} Total
              </Badge>
            </div>
            <div className={cn(styles.badgeRow)}>
              <Badge className={cn(styles.adminBadge)} size='md' radius='sm'>
                {roleCounts.admins || roleCounts.ADMIN || 0} Admins
              </Badge>
              <Badge className={cn(styles.organizerBadge)} size='md' radius='sm'>
                {roleCounts.organizers || roleCounts.ORGANIZER || 0} Organizers
              </Badge>
              <Badge className={cn(styles.speakerBadge)} size='md' radius='sm'>
                {roleCounts.speakers || roleCounts.SPEAKER || 0} Speakers
              </Badge>
              <Badge className={cn(styles.attendeeBadge)} size='md' radius='sm'>
                {roleCounts.attendees || roleCounts.ATTENDEE || 0} Attendees
              </Badge>
            </div>
          </div>
        </div>
        <div className={cn(styles.headerRight)}>
          <Button variant='primary' onClick={onInviteClick} className={cn(styles.addButton)}>
            <IconPlus size={18} />
            Invite Attendees
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeaderSection;
