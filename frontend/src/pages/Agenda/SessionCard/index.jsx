import { IconBrandLinkedin, IconWorld } from '@tabler/icons-react';
import styles from './styles/index.module.css';
import PropTypes from 'prop-types';

const ROLE_ORDER = ['HOST', 'KEYNOTE', 'SPEAKER', 'MODERATOR', 'PANELIST'];

const SpeakerLink = ({ url, type }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className={styles.socialLink}
  >
    {type === 'linkedin' ? (
      <IconBrandLinkedin size={20} stroke={1.5} />
    ) : (
      <IconWorld size={20} stroke={1.5} />
    )}
  </a>
);
export const SessionCard = ({
  title,
  session_type,
  start_time,
  end_time,
  description,
  speakers = [],
}) => {
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
        <span
          className={`${styles.sessionType} ${styles[session_type.toLowerCase()]}`}
        >
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
        <p className={styles.description}>{description}</p>

        {Object.entries(speakersByRole).map(([role, roleSpeakers]) => (
          <div key={role} className={styles.roleGroup}>
            <h4 className={styles.roleTitle}>{role.toLowerCase()}</h4>
            {roleSpeakers.map((speaker) => (
              <div key={speaker.id} className={styles.speaker}>
                <div className={styles.avatarWrapper}>
                  {speaker.avatar ? (
                    <img
                      src={speaker.avatar}
                      alt={speaker.name}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {speaker.name[0]}
                    </div>
                  )}
                </div>
                <div className={styles.speakerInfo}>
                  <span className={styles.speakerName}>{speaker.name}</span>
                  <span className={styles.speakerTitle}>
                    {speaker.title}{' '}
                    {speaker.company_name && `@ ${speaker.company_name}`}
                  </span>
                  {speaker.social_links && (
                    <div className={styles.socialLinks}>
                      {speaker.social_links.linkedin && (
                        <SpeakerLink
                          url={speaker.social_links.linkedin}
                          type="linkedin"
                        />
                      )}
                      {speaker.social_links.website && (
                        <SpeakerLink
                          url={speaker.social_links.website}
                          type="website"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
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
  ]).isRequired,
  start_time: PropTypes.string.isRequired,
  end_time: PropTypes.string.isRequired,
  description: PropTypes.string,
  speakers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      company_name: PropTypes.string,
      role: PropTypes.oneOf(ROLE_ORDER).isRequired,
      avatar: PropTypes.string,
      social_links: PropTypes.shape({
        linkedin: PropTypes.string,
        website: PropTypes.string,
      }),
    })
  ),
};
