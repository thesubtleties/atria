import { Link } from 'react-router-dom';
import styles from './styles/index.module.css';
import PropTypes from 'prop-types';
import { SPEAKER_ROLE_ORDER } from '@/shared/constants/speakerRoles';
import { SpeakerItem } from './SpeakerItem';
import { formatSessionTime } from '@/shared/utils/timezone';

export const SessionCard = ({
  title,
  session_type = 'PRESENTATION',
  start_time,
  end_time,
  day_number,
  short_description,
  session_speakers = [],
  eventStartDate,
  eventTimezone,
  isOrgView = false,
  orgId,
  eventId,
  id
}) => {
  const sessionTypeClass = session_type
    ? styles[session_type.toLowerCase()]
    : '';

  const speakers = session_speakers.map((speaker) => ({
    id: speaker.user_id,
    name: speaker.speaker_name,
    title: speaker.title,
    company_name: speaker.company_name,
    role: speaker.role,
    avatar: speaker.image_url,
    social_links: speaker.social_links,
  }));

  const speakersByRole = SPEAKER_ROLE_ORDER.reduce((acc, role) => {
    const roleSpeakers = speakers.filter((s) => s.role === role);
    if (roleSpeakers.length > 0) {
      acc[role] = roleSpeakers;
    }
    return acc;
  }, {});

  // Format times with timezone support
  const startTimes = formatSessionTime(start_time, eventStartDate, day_number, eventTimezone);
  const endTimes = formatSessionTime(end_time, eventStartDate, day_number, eventTimezone);

  const sessionUrl = isOrgView
    ? `/app/organizations/${orgId}/events/${eventId}/sessions/${id}`
    : `/app/events/${eventId}/sessions/${id}`;

  return (
    <Link to={sessionUrl} className={styles.sessionCard}>
      <div className={styles.typeTag}>
        <span className={`${styles.sessionType} ${sessionTypeClass}`}>
          {session_type}
        </span>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.time}>
          {/* Show user's local time by default (or event time if same timezone) */}
          <div>
            {startTimes.userTime || startTimes.eventTime} - {endTimes.userTime || endTimes.eventTime} {startTimes.timezone}
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

SessionCard.propTypes = {
  title: PropTypes.string.isRequired,
  session_type: PropTypes.oneOf([
    'KEYNOTE',
    'PANEL',
    'WORKSHOP',
    'PRESENTATION',
    'QA',
    'NETWORKING',
  ]),
  start_time: PropTypes.string.isRequired,
  end_time: PropTypes.string.isRequired,
  day_number: PropTypes.number.isRequired,
  eventStartDate: PropTypes.string.isRequired,
  eventTimezone: PropTypes.string.isRequired,
  short_description: PropTypes.string,
  description: PropTypes.string,
  session_speakers: PropTypes.arrayOf(
    PropTypes.shape({
      user_id: PropTypes.number.isRequired,
      speaker_name: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      company_name: PropTypes.string,
      role: PropTypes.oneOf(SPEAKER_ROLE_ORDER),
      image_url: PropTypes.string,
      social_links: PropTypes.shape({
        linkedin: PropTypes.string,
        website: PropTypes.string,
      }),
    })
  ),
  isOrgView: PropTypes.bool,
  orgId: PropTypes.string,
  eventId: PropTypes.string,
  id: PropTypes.number,
};

export default SessionCard;
