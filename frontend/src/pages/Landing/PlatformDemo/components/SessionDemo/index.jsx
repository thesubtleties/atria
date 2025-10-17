import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { motion } from 'motion/react';
import styles from './SessionDemo.module.css';

const chatMessages = {
  chat: [
    {
      id: 1,
      user: 'Sarah M.',
      avatar: 'sarah123',
      message: 'Thank you for sharing your journey!',
      time: '2:15 PM',
    },
    {
      id: 2,
      user: 'David Chen',
      avatar: 'davidchen',
      message: 'How can small nonprofits get started?',
      time: '2:16 PM',
    },
    {
      id: 3,
      user: 'Maria G.',
      avatar: 'mariag',
      message: 'The community impact data is inspiring 💚',
      time: '2:17 PM',
    },
    {
      id: 4,
      user: 'James Wilson',
      avatar: 'jwilson',
      message: 'What funding sources do you recommend?',
      time: '2:18 PM',
    },
  ],
  backstage: [
    {
      id: 1,
      user: 'Tech Support',
      avatar: 'techsupport232fdafrereaaazzzffdf',
      message: 'Audio levels look good on our end',
      time: '2:14 PM',
      isOrganizer: true,
    },
    {
      id: 2,
      user: 'Dr. Emily Rodriguez',
      avatar: 'emilyrodriguez',
      message: 'Perfect, can you see the slides?',
      time: '2:14 PM',
      isSpeaker: true,
    },
    {
      id: 3,
      user: 'Event Coordinator',
      avatar: 'eventcoordinatorfkldjfdafdfa',
      message: 'Yes, everything looks great! We have 300+ attendees',
      time: '2:15 PM',
      isOrganizer: true,
    },
    {
      id: 4,
      user: 'Dr. Emily Rodriguez',
      avatar: 'emilyrodriguez',
      message: 'Wonderful! Ready to take Q&A after this section',
      time: '2:16 PM',
      isSpeaker: true,
    },
  ],
};

export const SessionDemo = ({ isFirefox }) => {
  const containerRef = useRef(null);
  const hasAnimatedRef = useRef(false);
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    // Listen for card-active event from parent
    const handleCardActive = () => {
      if (!hasAnimatedRef.current && containerRef.current) {
        hasAnimatedRef.current = true;

        const elements =
          containerRef.current.querySelectorAll('[data-animate]');

        const tl = gsap.timeline({ delay: 0.2 });

        elements.forEach((element, index) => {
          tl.fromTo(
            element,
            {
              opacity: 0,
              y: 20,
            },
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
              ease: 'power2.out',
              force3D: !isFirefox,
            },
            index * 0.1
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
    <motion.div className={styles.sessionContent} ref={containerRef}>
      <div className={styles.mainContent}>
        <div className={styles.videoSection} data-animate>
          <div className={styles.videoPlayer}>
            <div className={styles.videoFrame}>
              <img
                className={styles.videoPoster}
                src="https://storage.sbtl.dev/atria-public/samplevideoimage.avif"
                alt="Community Outreach Program"
                loading="lazy"
              />
              <div className={styles.liveIndicator}>
                <span className={styles.liveDot}></span>
                LIVE
              </div>
            </div>
          </div>

          {/* Mini Speaker Card */}
          <div className={styles.speakerCard}>
            <div className={styles.speakerHeader}>
              <img
                className={styles.speakerAvatar}
                src="https://api.dicebear.com/9.x/avataaars/svg?seed=emilyrodriguez"
                alt="Dr. Emily Rodriguez"
                loading="lazy"
              />
              <div className={styles.speakerDetails}>
                <h4 className={styles.speakerName}>Dr. Emily Rodriguez</h4>
                <p className={styles.speakerTitle}>
                  Executive Director @ Hope Foundation
                </p>
                <span className={styles.speakerRole}>KEYNOTE SPEAKER</span>
              </div>
            </div>
          </div>

          {/* Session Description */}
          <div className={styles.sessionDescription}>
            <h3 className={styles.sessionTitle}>
              Building Sustainable Communities
            </h3>
            <p className={styles.description}>
              Exploring innovative approaches to community development through
              grassroots education initiatives.
            </p>
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div className={styles.chatSection} data-animate>
        <div className={styles.chatTabs}>
          <button
            className={`${styles.tabButton} ${activeTab === 'chat' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'backstage' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('backstage')}
          >
            Backstage
          </button>
        </div>

        <div className={styles.chatMessages}>
          {chatMessages[activeTab].map((msg) => (
            <div key={msg.id} className={styles.message}>
              <img
                className={styles.messageAvatar}
                src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${msg.avatar}`}
                alt={msg.user}
                loading="lazy"
              />
              <div className={styles.messageContent}>
                <div className={styles.messageHeader}>
                  <span
                    className={`${styles.messageUser} ${
                      msg.isOrganizer
                        ? styles.organizer
                        : msg.isSpeaker
                          ? styles.speaker
                          : ''
                    }`}
                  >
                    {msg.user}
                  </span>
                  <span className={styles.messageTime}>{msg.time}</span>
                </div>
                <p className={styles.messageText}>{msg.message}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.chatInput}>
          <input
            type="text"
            placeholder="Type a message..."
            className={styles.inputField}
          />
          <button className={styles.sendButton}>Send</button>
        </div>
      </div>
    </motion.div>
  );
};

export default SessionDemo;
