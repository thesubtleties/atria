import { JaaSMeeting } from '@jitsi/react-sdk';
import styles from '../styles/index.module.css';

/**
 * JitsiPlayer - Jitsi as a Service (JaaS) video conferencing player
 *
 * Uses organization's JaaS account (BYOA) to embed Jitsi meetings.
 * JWT token is generated server-side with user-specific permissions.
 *
 * @param {string} appId - JaaS App ID (vpaas-magic-cookie-xxx)
 * @param {string} roomName - Normalized room name
 * @param {string} jwt - Per-user JWT token (generated server-side)
 * @param {object} currentUser - Current user data
 */
export const JitsiPlayer = ({ appId, roomName, jwt, currentUser }) => {
  // User information for Jitsi display
  const userInfo = {
    displayName: currentUser?.name || 'Anonymous',
    email: currentUser?.email || '',
  };

  // Add avatar if available
  if (currentUser?.avatar_url) {
    userInfo.avatar = currentUser.avatar_url;
  }

  // Configuration overrides for Jitsi interface
  const configOverwrite = {
    startWithAudioMuted: true, // Start muted by default
    requireDisplayName: true, // Require display name
  };

  // Interface configuration overrides
  const interfaceConfigOverwrite = {
    SHOW_JITSI_WATERMARK: false, // Hide Jitsi branding
  };

  // Handle iframe styling (make it fill the container)
  const getIFrameRef = (node) => {
    if (node) {
      node.style.height = '100%';
      node.style.width = '100%';
    }
  };

  return (
    <div className={styles.videoContainer}>
      <JaaSMeeting
        appId={appId}
        roomName={roomName}
        jwt={jwt}
        configOverwrite={configOverwrite}
        interfaceConfigOverwrite={interfaceConfigOverwrite}
        userInfo={userInfo}
        getIFrameRef={getIFrameRef}
      />
    </div>
  );
};
