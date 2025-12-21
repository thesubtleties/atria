import { IconTrash, IconBrandLinkedin, IconWorld } from '@tabler/icons-react';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type SessionSpeaker = {
  user_id: number;
  role: string;
  speaker_name?: string;
  full_name?: string;
  title?: string;
  company_name?: string;
  speaker_bio?: string;
  image_url?: string;
  social_links?: {
    linkedin?: string;
    website?: string;
  };
};

type SpeakerCardProps = {
  speaker: SessionSpeaker;
  canEdit: boolean | undefined;
  onRemove?: (userId: number) => Promise<void>;
  variant?: 'flow' | 'grid';
};

export const SpeakerCard = ({ speaker, canEdit, onRemove, variant = 'flow' }: SpeakerCardProps) => {
  const getAvatarInitial = (name: string | undefined): string => {
    const firstChar = name?.[0];
    return firstChar ? firstChar.toUpperCase() : '?';
  };

  return (
    <div className={cn(styles.card, styles[variant])}>
      <div className={cn(styles.speakerLayout)}>
        {speaker.image_url ?
          <img
            src={speaker.image_url}
            alt={speaker.speaker_name || speaker.full_name}
            className={cn(styles.avatar)}
          />
        : <div className={cn(styles.avatarPlaceholder)}>
            {getAvatarInitial(speaker.speaker_name || speaker.full_name)}
          </div>
        }

        <div className={cn(styles.speakerInfo)}>
          <div className={cn(styles.speakerName)}>{speaker.speaker_name || speaker.full_name}</div>

          {(speaker.title || speaker.company_name) && (
            <div className={cn(styles.speakerDetails)}>
              {speaker.title}
              {speaker.title && speaker.company_name && ' @ '}
              {speaker.company_name}
            </div>
          )}

          {speaker.speaker_bio && (
            <div className={cn(styles.speakerBio)}>{speaker.speaker_bio}</div>
          )}

          <div className={cn(styles.socialLinks)}>
            {speaker.social_links?.linkedin && (
              <a
                href={speaker.social_links.linkedin}
                target='_blank'
                rel='noopener noreferrer'
                className={cn(styles.socialLink)}
                onClick={(e) => e.stopPropagation()}
              >
                <IconBrandLinkedin size={16} stroke={1.5} />
              </a>
            )}
            {speaker.social_links?.website && (
              <a
                href={speaker.social_links.website}
                target='_blank'
                rel='noopener noreferrer'
                className={cn(styles.socialLink)}
                onClick={(e) => e.stopPropagation()}
              >
                <IconWorld size={16} stroke={1.5} />
              </a>
            )}
          </div>
        </div>

        {canEdit && (
          <div className={cn(styles.actions)}>
            <button
              className={cn(styles.actionButton)}
              onClick={() => onRemove && onRemove(speaker.user_id)}
              aria-label='Remove speaker'
            >
              <IconTrash size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
