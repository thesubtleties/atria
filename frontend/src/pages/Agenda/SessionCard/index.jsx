// src/pages/Agenda/SessionCard/index.jsx
import { useRef, useEffect, useState } from 'react';
import styles from './styles/index.module.css';
import PropTypes from 'prop-types';
import { IconBrandLinkedin, IconWorld } from '@tabler/icons-react';

const ROLE_ORDER = ['HOST', 'KEYNOTE', 'SPEAKER', 'MODERATOR', 'PANELIST'];

export const SessionCard = ({
  title,
  session_type = 'PRESENTATION',
  start_time,
  end_time,
  description,
  speakers = [],
}) => {
  const sessionTypeClass = session_type
    ? styles[session_type.toLowerCase()]
    : '';

  // Group speakers by role
  const speakersByRole = ROLE_ORDER.reduce((acc, role) => {
    const roleSpeakers = speakers.filter((s) => s.role === role);
    if (roleSpeakers.length > 0) {
      acc[role] = roleSpeakers;
    }
    return acc;
  }, {});

  return (
    <div className={styles.sessionCard}>
      <div className={styles.typeTag}>
        <span className={`${styles.sessionType} ${sessionTypeClass}`}>
          {session_type}
        </span>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.time}>
          {start_time} - {end_time}
        </div>
      </div>

      <div className={styles.expandedContent}>
        {description && <p className={styles.description}>{description}</p>}

        {speakers?.length > 0 && (
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
                          {speaker.social_links && (
                            <div className={styles.socialLinks}>
                              {speaker.social_links.linkedin && (
                                <a
                                  href={speaker.social_links.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.socialLink}
                                >
                                  <IconBrandLinkedin size={20} stroke={1.5} />
                                </a>
                              )}
                              {speaker.social_links.website && (
                                <a
                                  href={speaker.social_links.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.socialLink}
                                >
                                  <IconWorld size={20} stroke={1.5} />
                                </a>
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
        )}
      </div>
    </div>
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
  description: PropTypes.string,
  speakers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      company_name: PropTypes.string,
      role: PropTypes.oneOf(ROLE_ORDER),
      avatar: PropTypes.string,
      social_links: PropTypes.shape({
        linkedin: PropTypes.string,
        website: PropTypes.string,
      }),
    })
  ),
};
