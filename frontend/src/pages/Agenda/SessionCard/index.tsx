import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import styles from './styles/index.module.css';
import { SPEAKER_ROLE_ORDER } from '@/shared/constants/speakerRoles';
import { SpeakerItem } from './SpeakerItem';
import { formatSessionTime } from '@/shared/utils/timezone';
import type { Session, SessionSpeaker } from '@/types/events';

type SessionCardProps = {
  session: Session & { session_speakers?: SessionSpeaker[] };
  eventStartDate: string;
  eventTimezone: string;
  isOrgView?: boolean;
  orgId?: string | undefined;
  eventId?: string | undefined;
  style?: CSSProperties;
};

type SpeakerSocialLinks = {
  linkedin?: string;
  website?: string;
};

type Speaker = {
  id: number;
  name: string;
  title: string | null;
  company_name: string | null;
  role: string;
  avatar: string | null;
  social_links: SpeakerSocialLinks | null;
};

type SpeakersByRole = Record<string, Speaker[]>;

export const SessionCard = ({
  session,
  eventStartDate,
  eventTimezone,
  isOrgView = false,
  orgId,
  eventId,
  style,
}: SessionCardProps) => {
  const {
    id,
    title,
    session_type = 'PRESENTATION',
    start_time,
    end_time,
    day_number,
    short_description,
  } = session;

  const session_speakers = session.session_speakers || [];
  const sessionTypeClass = session_type ? styles[session_type.toLowerCase()] || '' : '';

  const speakers: Speaker[] = session_speakers.map((speaker) => {
    const socialLinks: SpeakerSocialLinks | null =
      speaker.social_links ?
        {
          ...(speaker.social_links.linkedin ? { linkedin: speaker.social_links.linkedin } : {}),
          ...(speaker.social_links.website ? { website: speaker.social_links.website } : {}),
        }
      : null;
    return {
      id: speaker.user_id,
      name: speaker.speaker_name,
      title: speaker.title ?? null,
      company_name: speaker.company_name ?? null,
      role: speaker.role,
      avatar: speaker.image_url ?? null,
      social_links: socialLinks,
    };
  });

  const speakersByRole = SPEAKER_ROLE_ORDER.reduce<SpeakersByRole>((acc, role) => {
    const roleSpeakers = speakers.filter((s) => s.role === role);
    if (roleSpeakers.length > 0) {
      acc[role] = roleSpeakers;
    }
    return acc;
  }, {});

  // Format times with timezone support
  const startTimes = formatSessionTime(start_time, eventStartDate, day_number, eventTimezone);
  const endTimes = formatSessionTime(end_time, eventStartDate, day_number, eventTimezone);

  const sessionUrl =
    isOrgView ?
      `/app/organizations/${orgId}/events/${eventId}/sessions/${id}`
    : `/app/events/${eventId}/sessions/${id}`;

  return (
    <Link to={sessionUrl} className={styles.sessionCard} style={style}>
      <div className={styles.typeTag}>
        <span className={`${styles.sessionType} ${sessionTypeClass || ''}`.trim()}>
          {session_type}
        </span>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.time}>
          {/* Show user's local time by default (or event time if same timezone) */}
          <div>
            {startTimes.userTime || startTimes.eventTime} -{' '}
            {endTimes.userTime || endTimes.eventTime} {startTimes.timezone}
          </div>
          {/* Show event time on hover if different from user's timezone */}
          {startTimes.showUserTime && (
            <div className={styles.eventTimeHover}>
              {startTimes.eventTime} - {endTimes.eventTime} {startTimes.eventTimezone}
            </div>
          )}
        </div>
        {short_description && <p className={styles.description}>{short_description}</p>}
      </div>

      {speakers?.length > 0 && (
        <div className={styles.expandedContent}>
          <div className={styles.speakers}>
            {Object.entries(speakersByRole).map(([role, roleSpeakers]) => (
              <div key={role} className={styles.roleGroup}>
                <h4 className={styles.roleTitle}>{role}</h4>
                <div className={styles.speakersRow}>
                  {roleSpeakers.map((speaker, index) => (
                    <SpeakerItem
                      key={speaker.id}
                      speaker={speaker}
                      index={index}
                      roleSpeakers={roleSpeakers}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Link>
  );
};

export default SessionCard;
