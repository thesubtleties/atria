import styles from './SectionHeader.module.css'

export const SectionHeader = () => {
  return (
    <div className="audience-header">
      <h2 className={styles.sectionTitle}>One Platform, Unlimited Possibilities</h2>
      <p className={styles.sectionSubtitle}>
        Flexible solutions that adapt to your unique needs
      </p>
    </div>
  )
}