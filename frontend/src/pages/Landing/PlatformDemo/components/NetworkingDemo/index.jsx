import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { motion } from 'motion/react';
import styles from './NetworkingDemo.module.css';

const connections = [
  {
    id: 1,
    name: 'Sarah Martinez',
    title: 'Community Outreach Director',
    company: 'Global Impact Foundation',
    avatar: 'sea',
    status: 'connect',
    icebreaker: 'What inspired you to work in community development?',
    action: 'Connect',
  },
  {
    id: 2,
    name: 'Michael Chen',
    title: 'Program Manager',
    company: 'Youth Empowerment Network',
    avatar: 'michaelfdafda',
    status: 'pending',
    icebreaker: 'Your session on education initiatives was fascinating!',
    action: 'Pending',
  },
  {
    id: 3,
    name: 'Dr. Amelia Foster',
    title: 'Executive Director',
    company: 'Sustainable Communities Alliance',
    avatar: 'ameliafoster2234',
    status: 'connected',
    lastMessage: 'Looking forward to collaborating on the grant proposal!',
    action: 'Message',
  },
];

export const NetworkingDemo = ({ isFirefox }) => {
  const containerRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // Listen for card-active event from parent
    const handleCardActive = () => {
      if (!hasAnimatedRef.current && containerRef.current) {
        hasAnimatedRef.current = true;

        const elements = containerRef.current.querySelectorAll('[data-animate]');

        const tl = gsap.timeline({ delay: 0.2 });

        elements.forEach((element, index) => {
          tl.fromTo(
            element,
            {
              opacity: 0,
              x: 30,
            },
            {
              opacity: 1,
              x: 0,
              duration: 0.4,
              ease: 'power2.out',
              force3D: !isFirefox,
            },
            index * 0.1,
          );
        });
      }
    };

    // Listen for the card-active event
    const cardElement = containerRef.current?.closest('.demo-card');
    if (cardElement) {
      cardElement.addEventListener('card-active', handleCardActive);
      return () => {
        cardElement.removeEventListener('card-active', handleCardActive);
      };
    }
  }, [isFirefox]);

  return (
    <motion.div className={styles.networkingContent} ref={containerRef}>
      <div className={styles.connectionsContainer}>
        {connections.map((connection) => (
          <div key={connection.id} className={styles.connectionCard} data-animate>
            <div className={styles.connectionMain}>
              <img
                className={styles.avatar}
                src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${connection.avatar}`}
                alt={connection.name}
                loading='lazy'
              />
              <div className={styles.personInfo}>
                <h4 className={styles.personName}>{connection.name}</h4>
                <p className={styles.personTitle}>{connection.title}</p>
                <p className={styles.personCompany}>{connection.company}</p>
              </div>
              <button
                className={`${styles.actionButton} ${styles[connection.status]}`}
                disabled={connection.status === 'pending'}
              >
                {connection.action}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.privacyNote} data-animate>
        <p className={styles.privacyText}>
          Privacy-first networking: Connect only through curated icebreakers at events you attend
        </p>
      </div>
    </motion.div>
  );
};

export default NetworkingDemo;
