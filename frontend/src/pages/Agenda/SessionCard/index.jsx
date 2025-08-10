import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './styles/index.module.css';
import PropTypes from 'prop-types';
import { IconBrandLinkedin, IconWorld } from '@tabler/icons-react';
import { format } from 'date-fns';
import { SPEAKER_ROLE_ORDER } from '@/shared/constants/speakerRoles';

export const SessionCard = ({
  title,
  session_type = 'PRESENTATION',
  start_time,
  end_time,
  short_description,
  description,
  session_speakers = [],
  isOrgView = false,
  orgId,
  eventId,
  id,
  ...props
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

  const formatTime = (timeStr) => {
    // Create a dummy date to parse the time
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a'); // This will give format like "9:00 AM"
  };

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
          {formatTime(start_time)} - {formatTime(end_time)}
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
                  {roleSpeakers.map((speaker, index) => {
                    const speakerRef = useRef(null);
                    const [showDivider, setShowDivider] = useState(true);

                    useEffect(() => {
                      if (
                        speakerRef.current &&
                        index < roleSpeakers.length - 1
                      ) {
                        const rect = speakerRef.current.getBoundingClientRect();
                        const nextSibling =
                          speakerRef.current.nextElementSibling;
                        if (nextSibling) {
                          const nextRect = nextSibling.getBoundingClientRect();
                          setShowDivider(nextRect.top === rect.top);
                        }
                      }
                    }, [index]);

                    return (
                      <div
                        ref={speakerRef}
                        key={speaker.id}
                        className={`${styles.speaker} ${
                          showDivider && index !== roleSpeakers.length - 1
                            ? styles.withDivider
                            : ''
                        }`}
                      >
                        <div className={styles.avatarWrapper}>
                          {speaker.avatar ? (
                            <img
                              src={speaker.avatar}
                              alt={speaker.name}
                              className={styles.avatar}
                            />
                          ) : (
                            <div className={styles.avatarPlaceholder}>
                              {speaker.name?.[0]}
                            </div>
                          )}
                        </div>
                        <div className={styles.speakerInfo}>
                          <span className={styles.speakerName}>
                            {speaker.name}
                          </span>
                          <span className={styles.speakerTitle}>
                            {speaker.title}
                            {speaker.company_name &&
                              ` @ ${speaker.company_name}`}
                          </span>
                          {speaker.social_links && (speaker.social_links.linkedin || speaker.social_links.website) && (
                            <div
                              className={styles.socialLinks}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {speaker.social_links?.linkedin && (
                                <span
                                  className={styles.socialLink}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    window.open(
                                      speaker.social_links.linkedin,
                                      '_blank'
                                    );
                                  }}
                                  role="button"
                                  tabIndex={0}
                                >
                                  <IconBrandLinkedin size={20} stroke={1.5} />
                                </span>
                              )}
                              {speaker.social_links?.website && (
                                <span
                                  className={styles.socialLink}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    window.open(
                                      speaker.social_links.website,
                                      '_blank'
                                    );
                                  }}
                                  role="button"
                                  tabIndex={0}
                                >
                                  <IconWorld size={20} stroke={1.5} />
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
