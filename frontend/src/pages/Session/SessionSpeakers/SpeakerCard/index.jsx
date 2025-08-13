// pages/Session/SessionSpeakers/SpeakerCard/index.jsx
import { IconTrash, IconBrandLinkedin, IconWorld } from '@tabler/icons-react';
import styles from './styles/index.module.css';

export const SpeakerCard = ({ speaker, canEdit, onRemove }) => {
  const getAvatarInitial = (name) => {
    return name ? name[0].toUpperCase() : '?';
  };

  return (
    <div className={styles.card}>
      <div className={styles.speakerLayout}>
        {speaker.image_url ? (
          <img 
            src={speaker.image_url} 
            alt={speaker.speaker_name || speaker.full_name}
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {getAvatarInitial(speaker.speaker_name || speaker.full_name)}
          </div>
        )}
        
        <div className={styles.speakerInfo}>
          <div className={styles.speakerName}>
            {speaker.speaker_name || speaker.full_name}
          </div>
          
          {(speaker.title || speaker.company_name) && (
            <div className={styles.speakerDetails}>
              {speaker.title}
              {speaker.title && speaker.company_name && ' @ '}
              {speaker.company_name}
            </div>
          )}
          
          {speaker.speaker_bio && (
            <div className={styles.speakerBio}>
              {speaker.speaker_bio}
            </div>
          )}
          
          <div className={styles.socialLinks}>
            {speaker.social_links?.linkedin && (
              <a
                href={speaker.social_links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                onClick={(e) => e.stopPropagation()}
              >
                <IconBrandLinkedin size={16} stroke={1.5} />
              </a>
            )}
            {speaker.social_links?.website && (
              <a
                href={speaker.social_links.website}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                onClick={(e) => e.stopPropagation()}
              >
                <IconWorld size={16} stroke={1.5} />
              </a>
            )}
          </div>
        </div>
        
        {canEdit && (
          <div className={styles.actions}>
            <button 
              className={styles.actionButton}
              onClick={() => onRemove && onRemove(speaker.user_id)}
              aria-label="Remove speaker"
            >
              <IconTrash size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
