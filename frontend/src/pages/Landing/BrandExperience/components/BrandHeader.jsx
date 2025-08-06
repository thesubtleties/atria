import styles from './BrandHeader.module.css'

export const BrandHeader = () => {
  return (
    <div className="brand-header">
      <h2 className={styles.sectionTitle}>All Eyes on You</h2>
      <p className={styles.sectionSubtitle}>
        When the show starts, Atria disappears. Your event takes center stage.
      </p>
    </div>
  )
}