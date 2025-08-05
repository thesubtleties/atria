import { motion } from 'motion/react'
import styles from './TestimonialCard.module.css'

const TestimonialCard = ({
  quote = '',
  author = {
    name: '',
    title: '',
    avatar: ''
  },
  quoteIcon = '"',
  className = '',
  hoverScale = 1.02
}) => {
  return (
    <motion.div 
      className={`${styles.testimonialCard} ${className}`}
      whileHover={{ scale: hoverScale }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className={styles.quoteIcon}>{quoteIcon}</div>
      <p className={styles.testimonialText}>{quote}</p>
      
      <div className={styles.testimonialAuthor}>
        <div className={styles.authorAvatar}>
          {author.avatar}
        </div>
        <div className={styles.authorInfo}>
          <div className={styles.authorName}>{author.name}</div>
          <div className={styles.authorTitle}>{author.title}</div>
        </div>
      </div>
    </motion.div>
  )
}

export default TestimonialCard