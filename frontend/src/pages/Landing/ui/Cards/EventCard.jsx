import { motion } from 'motion/react'
import styles from './EventCard.module.css'

const EventCard = ({
  title = '',
  time = '',
  duration = '',
  speakers = [],
  tags = [],
  description = '',
  isExpanded = false,
  onHover,
  onClick,
  delay = 0,
  className = ''
}) => {
  return (
    <motion.div
      className={`${styles.eventCard} ${isExpanded ? styles.expanded : ''} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={onHover}
      onClick={onClick}
    >
      <div className={styles.cardHeader}>
        <h4 className={styles.title}>{title}</h4>
        <div className={styles.metadata}>
          <span className={styles.time}>{time}</span>
          {duration && <span className={styles.duration}>{duration}</span>}
        </div>
      </div>

      {tags.length > 0 && (
        <div className={styles.tags}>
          {tags.map((tag, index) => (
            <span key={index} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}

      {description && (
        <p className={styles.description}>{description}</p>
      )}

      {speakers.length > 0 && (
        <div className={styles.speakers}>
          <span className={styles.speakersLabel}>Speakers:</span>
          <div className={styles.speakersList}>
            {speakers.map((speaker, index) => (
              <span key={index} className={styles.speaker}>
                {speaker.avatar && <span className={styles.speakerAvatar}>{speaker.avatar}</span>}
                {speaker.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default EventCard