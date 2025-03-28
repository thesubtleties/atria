// src/pages/Roadmap/index.jsx
import { useParams } from 'react-router-dom';
import styles from './styles/index.module.css';

const RoadmapPage = () => {
  const { eventId } = useParams();

  // Define the roadmap phases
  const roadmapPhases = [
    {
      id: 'phase1',
      title: 'Phase 1: Networking Integration',
      status: 'in-progress',
      description: 'Building core networking and communication features',
      items: [
        {
          title: 'Chat',
          status: 'partial',
          description: 'Public chat functionality for events',
          details: [
            { text: 'Backend', status: 'complete' },
            { text: 'Networking area chat rooms', status: 'planned' },
            { text: 'Individual session chat room', status: 'planned' },
            { text: 'Moderation/muting capabilities', status: 'planned' },
            { text: 'Public chat notifications', status: 'planned' },
          ],
        },
        {
          title: 'Direct Messaging',
          status: 'partial',
          description: 'Private messaging between users',
          details: [
            { text: 'Direct message functionality', status: 'complete' },
            { text: 'List of conversations', status: 'complete' },
            { text: 'Base frontend UI', status: 'complete' },
            { text: 'Proper filtering', status: 'planned' },
            { text: 'End-to-end encryption', status: 'planned' },
            { text: 'Ice breaker connection starter', status: 'planned' },
            { text: 'Block/remove connection options', status: 'planned' },
            { text: 'Emoji support', status: 'planned' },
            { text: 'Admin connection options', status: 'planned' },
          ],
        },
        {
          title: 'Connection Management',
          status: 'planned',
          description: 'Manage connections with other attendees',
          details: [
            { text: 'Attendee directory', status: 'planned' },
            { text: 'Attendee cards/base profiles', status: 'planned' },
          ],
        },
      ],
    },
    {
      id: 'phase2',
      title: 'Phase 2: Personal Pages',
      status: 'planned',
      description: 'User profiles and personal networking features',
      items: [
        {
          title: 'Profile Management',
          status: 'planned',
          description: 'User profile creation and management',
          details: [
            { text: 'Create/update profile page', status: 'planned' },
            { text: 'Profile image upload/emoji generator', status: 'planned' },
            { text: 'Cards for connections', status: 'planned' },
          ],
        },
        {
          title: 'Connection Features',
          status: 'planned',
          description: 'Connection management capabilities',
          details: [
            { text: 'Ability to start connections', status: 'planned' },
            { text: 'Create DM from connection page', status: 'planned' },
            { text: 'Favorite specific connections', status: 'planned' },
            { text: 'Accept/decline connection requests', status: 'planned' },
            { text: 'Speaker connection preferences', status: 'planned' },
          ],
        },
      ],
    },
    {
      id: 'phase3',
      title: 'Phase 3: Attendee Management',
      status: 'planned',
      description: 'Tools for managing event attendees',
      items: [
        {
          title: 'Invitation System',
          status: 'planned',
          description: 'Attendee invitation functionality',
          details: [
            { text: 'Invite attendee via email', status: 'planned' },
            { text: 'Invitation status tracking', status: 'planned' },
            { text: 'Existing account handling', status: 'planned' },
            { text: 'CSV/mass invite options', status: 'planned' },
          ],
        },
        {
          title: 'Attendee Controls',
          status: 'planned',
          description: 'Attendee management features',
          details: [
            { text: 'Ability for attendees to leave event', status: 'planned' },
            { text: 'Event archiving', status: 'planned' },
            { text: 'Role assignment upon invitation', status: 'planned' },
          ],
        },
      ],
    },
    {
      id: 'phase4',
      title: 'Phase 4: Sessions/Session Management',
      status: 'planned',
      description: 'Enhanced session organization and features',
      items: [
        {
          title: 'Session Content',
          status: 'planned',
          description: 'Session content and details',
          details: [
            { text: 'Cleaner session page with details', status: 'planned' },
            { text: 'Speakers area with social links', status: 'planned' },
            { text: 'Speaker ordering capability', status: 'planned' },
          ],
        },
        {
          title: 'Session Features',
          status: 'planned',
          description: 'Interactive session capabilities',
          details: [
            { text: 'Per-session chat option', status: 'planned' },
            { text: 'Session tracking', status: 'planned' },
            { text: 'Event timer for video preparation', status: 'planned' },
          ],
        },
        {
          title: 'Updated Streaming Integration',
          status: 'planned',
          description: 'Video streaming capabilities',
          details: [
            { text: 'Basic streaming integration', status: 'partial' },
            { text: 'Vimeo, DaCast and other embeds', status: 'planned' },
          ],
        },
      ],
    },
    {
      id: 'phase5',
      title: 'Phase 5: Admin Features',
      status: 'planned',
      description: 'Administrative tools for event management',
      items: [
        {
          title: 'Chat Administration',
          status: 'planned',
          description: 'Chat room management tools',
          details: [
            { text: 'Add/change chat rooms', status: 'planned' },
            { text: 'Set time on chat room open/close', status: 'planned' },
          ],
        },
        {
          title: 'Event Settings',
          status: 'planned',
          description: 'Event configuration options',
          details: [
            { text: 'Theme options', status: 'planned' },
            {
              text: 'Highlight and front page customization',
              status: 'planned',
            },
            { text: 'Comprehensive event settings page', status: 'planned' },
          ],
        },
      ],
    },
    {
      id: 'phase6',
      title: 'Phase 6: Sponsors',
      status: 'planned',
      description: 'Sponsor management and integration',
      items: [
        {
          title: 'Sponsor Management',
          status: 'planned',
          description: 'Core sponsor functionality',
          details: [
            { text: 'Sponsors page', status: 'planned' },
            { text: 'Per-session sponsorship area', status: 'planned' },
            { text: 'Sponsor levels with custom names', status: 'planned' },
            { text: 'Sponsor level descriptions', status: 'planned' },
          ],
        },
        {
          title: 'Sponsor Integration',
          status: 'planned',
          description: 'Sponsor visibility features',
          details: [
            { text: 'Sponsor imagery management', status: 'planned' },
            {
              text: 'Sponsored chat rooms with timed opening',
              status: 'planned',
            },
            { text: 'Chat page sponsorship options', status: 'planned' },
            { text: 'Topical sponsorship for chat rooms', status: 'planned' },
          ],
        },
      ],
    },
    {
      id: 'phase7',
      title: 'Phase 7: Long-term Features',
      status: 'planned',
      description: 'Advanced features for future development',
      items: [
        {
          title: 'Direct Messaging Enhancements',
          status: 'planned',
          description: 'Advanced messaging capabilities',
          details: [
            { text: 'Event-specific chatbot with RAG', status: 'planned' },
            { text: 'WebRTC video calls with connections', status: 'planned' },
          ],
        },
        {
          title: 'Ticketing',
          status: 'planned',
          description: 'Comprehensive ticketing system',
          details: [
            { text: 'Paid ticketing options', status: 'planned' },
            { text: 'Public and private event settings', status: 'planned' },
            { text: 'Upcoming events page', status: 'planned' },
            { text: 'Placement promotion for events', status: 'planned' },
            { text: 'Privacy-preserving analytics', status: 'planned' },
          ],
        },
        {
          title: 'Session Enhancements',
          status: 'planned',
          description: 'Advanced session features',
          details: [
            { text: 'Q&A functionality', status: 'planned' },
            { text: 'Live polling integration', status: 'planned' },
            { text: 'Hybrid event support', status: 'planned' },
            { text: 'Zoom embed support', status: 'planned' },
          ],
        },
        {
          title: 'Sponsor Enhancements',
          status: 'planned',
          description: 'Advanced sponsor capabilities',
          details: [
            {
              text: 'Direct ticket purchasing for attendees',
              status: 'planned',
            },
            { text: 'Cross-event invitation capabilities', status: 'planned' },
          ],
        },
        {
          title: 'Promotional Features',
          status: 'planned',
          description: 'Marketing and promotional tools',
          details: [
            { text: 'White-label streaming platform', status: 'planned' },
            { text: 'Food delivery partnerships', status: 'planned' },
            { text: 'Event hosting fee model', status: 'planned' },
            { text: 'Broadcasting partnerships', status: 'planned' },
          ],
        },
        {
          title: 'Platform Expansion',
          status: 'planned',
          description: 'Expanding platform availability',
          details: [
            { text: 'Progressive web app', status: 'planned' },
            { text: 'Electron app', status: 'planned' },
            { text: 'Mobile application', status: 'planned' },
            { text: 'LLM integration for content', status: 'planned' },
          ],
        },
      ],
    },
  ];

  // Helper function to get label for status
  const getStatusLabel = (status) => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'partial':
        return 'In Progress';
      case 'in-progress':
        return 'In Progress';
      case 'planned':
        return 'Planned';
      default:
        return 'Planned';
    }
  };

  return (
    <div className={styles.roadmapContainer}>
      <header className={styles.roadmapHeader}>
        <h1 className={styles.roadmapTitle}>Atria Development Roadmap</h1>
        <p className={styles.roadmapDescription}>
          Our development plan and progress for the Atria platform. This roadmap
          shows our current focus areas and planned features to create a
          comprehensive event management and networking experience.
        </p>
      </header>

      <div className={styles.phaseProgressContainer}>
        <div className={styles.progressBar}>
          {roadmapPhases.map((phase, index) => (
            <div
              key={phase.id}
              className={`${styles.progressPhase} ${styles[phase.status]}`}
            >
              <span className={styles.progressLabel}>{index + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.phasesContainer}>
        {roadmapPhases.map((phase) => (
          <div
            key={phase.id}
            className={`${styles.phaseCard} ${styles[phase.status]}`}
          >
            <div className={styles.phaseHeader}>
              <h2 className={styles.phaseTitle}>{phase.title}</h2>
              <span className={`${styles.phaseStatus} ${styles[phase.status]}`}>
                {getStatusLabel(phase.status)}
              </span>
            </div>
            <p className={styles.phaseDescription}>{phase.description}</p>

            <div className={styles.phaseItems}>
              {phase.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className={`${styles.itemCard} ${styles[item.status]}`}
                >
                  <div className={styles.itemHeader}>
                    <h3 className={styles.itemTitle}>{item.title}</h3>
                    <span
                      className={`${styles.itemStatus} ${styles[item.status]}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                  <p className={styles.itemDescription}>{item.description}</p>

                  {item.details && (
                    <ul className={styles.itemDetails}>
                      {item.details.map((detail, detailIndex) => (
                        <li
                          key={detailIndex}
                          className={`${styles.detailItem} ${styles[detail.status]}`}
                        >
                          <span className={styles.detailStatus}>
                            {detail.status === 'complete'
                              ? '✓'
                              : detail.status === 'in-progress'
                                ? '⟳'
                                : '○'}
                          </span>
                          {detail.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoadmapPage;
