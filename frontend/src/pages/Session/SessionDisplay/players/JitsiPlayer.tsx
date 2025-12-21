import { JaaSMeeting } from '@jitsi/react-sdk';
import type { SessionDetail } from '@/types/events';
import type { User } from '@/types/auth';
import { cn } from '@/lib/cn';
import styles from '../styles/index.module.css';

type JitsiPlayerProps = {
  appId: string;
  roomName: string;
  jwt: string;
  session: SessionDetail;
  currentUser: User | null;
};

/**
 * JitsiPlayer - Jitsi as a Service (JaaS) video conferencing player
 *
 * Uses organization's JaaS account (BYOA) to embed Jitsi meetings.
 * JWT token is generated server-side with user-specific permissions.
 */
export const JitsiPlayer = ({ appId, roomName, jwt, currentUser }: JitsiPlayerProps) => {
  // User information for Jitsi display
  const userInfo: { displayName: string; email: string; avatar?: string } = {
    displayName: currentUser?.full_name || 'Anonymous',
    email: currentUser?.email || '',
  };

  // Add avatar if available
  if (currentUser?.image_url) {
    userInfo.avatar = currentUser.image_url;
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
  const getIFrameRef = (node: HTMLDivElement | null) => {
    if (node) {
      node.style.height = '100%';
      node.style.width = '100%';
    }
  };

  return (
    <div className={cn(styles.videoContainer)}>
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
