import { useRef, useEffect, useState, type MouseEvent } from 'react';
import { IconBrandLinkedin, IconWorld } from '@tabler/icons-react';
import styles from './styles/index.module.css';

type SpeakerSocialLinks = {
  linkedin?: string;
  website?: string;
};

type Speaker = {
  id: number;
  name: string;
  title: string | null;
  company_name: string | null;
  avatar: string | null;
  social_links: SpeakerSocialLinks | null;
};

type SpeakerItemProps = {
  speaker: Speaker;
  index: number;
  roleSpeakers: Speaker[];
};

export const SpeakerItem = ({ speaker, index, roleSpeakers }: SpeakerItemProps) => {
  const speakerRef = useRef<HTMLDivElement>(null);
  const [showDivider, setShowDivider] = useState(true);

  useEffect(() => {
    if (speakerRef.current && index < roleSpeakers.length - 1) {
      const rect = speakerRef.current.getBoundingClientRect();
      const nextSibling = speakerRef.current.nextElementSibling as HTMLElement | null;
      if (nextSibling) {
        const nextRect = nextSibling.getBoundingClientRect();
        setShowDivider(nextRect.top === rect.top);
      }
    }
  }, [index, roleSpeakers.length]);

  const handleSocialClick = (e: MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, '_blank');
  };

  return (
    <div
      ref={speakerRef}
      className={`${styles.speaker} ${
        showDivider && index !== roleSpeakers.length - 1 ? styles.withDivider : ''
      }`}
    >
      <div className={styles.avatarWrapper}>
        {speaker.avatar ?
          <img src={speaker.avatar} alt={speaker.name} className={styles.avatar} />
        : <div className={styles.avatarPlaceholder}>{speaker.name?.[0]}</div>}
      </div>
      <div className={styles.speakerInfo}>
        <span className={styles.speakerName}>{speaker.name}</span>
        <span className={styles.speakerTitle}>
          {speaker.title}
          {speaker.company_name && ` @ ${speaker.company_name}`}
        </span>
        {speaker.social_links &&
          (speaker.social_links.linkedin || speaker.social_links.website) && (
            <div className={styles.socialLinks} onClick={(e) => e.stopPropagation()}>
              {speaker.social_links?.linkedin && (
                <span
                  className={styles.socialLink}
                  onClick={(e) => handleSocialClick(e, speaker.social_links!.linkedin!)}
                  role='button'
                  tabIndex={0}
                >
                  <IconBrandLinkedin size={20} stroke={1.5} />
                </span>
              )}
              {speaker.social_links?.website && (
                <span
                  className={styles.socialLink}
                  onClick={(e) => handleSocialClick(e, speaker.social_links!.website!)}
                  role='button'
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
};
