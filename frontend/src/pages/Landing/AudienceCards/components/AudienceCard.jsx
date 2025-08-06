import styles from './AudienceCard.module.css'

export const AudienceCard = ({ audience }) => {
  return (
    <div
      className={`${styles.audienceCard} ${styles[audience.accent]} audience-card`}
    >
      <div 
        className={styles.accentBar}
        style={{ backgroundColor: audience.color }}
      />
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{audience.title}</h3>
        <p className={styles.cardDescription}>{audience.description}</p>
        <p className={styles.cardFeatures}>{audience.features}</p>
      </div>
      <div className={styles.cardBackground}>
        <div className={styles.backgroundPattern} />
      </div>
    </div>
  )
}