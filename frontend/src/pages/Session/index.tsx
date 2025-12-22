import { Alert, Title, Text } from '@mantine/core';
import { IconMessage } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import {
  useGetSessionQuery,
  useUpdateSessionStatusMutation,
  useUpdateSessionMutation,
} from '@/app/features/sessions/api';
import { LoadingPage } from '@/shared/components/loading';
import { useGetEventQuery } from '@/app/features/events/api';
import { SessionDisplay } from './SessionDisplay';
import { SessionSpeakers } from './SessionSpeakers';
import { SessionDetails } from './SessionDetails';
import { SessionChat } from './SessionChat';
import type { RootState } from '@/types';
import type { SessionDetail, EventDetail } from '@/types/events';
import type { SessionStatus } from '@/types/enums';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type UserEventRole = 'ADMIN' | 'ORGANIZER' | 'SPEAKER' | 'ATTENDEE' | null;

type SessionSpeakerWithUser = {
  user?: {
    id: number;
  };
};

export const SessionPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [isChatOpen, setIsChatOpen] = useState(true); // Start open by default

  const { data: session, isLoading } = useGetSessionQuery(
    { id: Number(sessionId) },
    { skip: !sessionId },
  );
  const { data: event } = useGetEventQuery(
    { id: (session as SessionDetail | undefined)?.event_id as number },
    { skip: !(session as SessionDetail | undefined)?.event_id },
  );
  const [updateStatus] = useUpdateSessionStatusMutation();
  const [updateSession] = useUpdateSessionMutation();

  // Cast to proper types
  const typedSession = session as SessionDetail | undefined;
  const typedEvent = event as EventDetail | undefined;

  // Get current user's role in the event
  const getCurrentUserEventRole = (): UserEventRole => {
    if (!typedEvent || !currentUser) return null;

    // Check if user is an event organizer/admin using user_role
    if (typedEvent.user_role === 'ADMIN' || typedEvent.user_role === 'ORGANIZER') {
      return typedEvent.user_role as UserEventRole;
    }

    // Check if user is a speaker for this session
    const sessionSpeakers = typedSession?.session_speakers as SessionSpeakerWithUser[] | undefined;
    const isSpeaker = sessionSpeakers?.some((speaker) => speaker?.user?.id === currentUser.id);
    if (isSpeaker) return 'SPEAKER';

    // Otherwise they're an attendee
    return 'ATTENDEE';
  };

  const userEventRole = getCurrentUserEventRole();

  if (isLoading) {
    return <LoadingPage message='Loading session details...' />;
  }

  if (!typedSession) {
    return (
      <Alert color='red' title='Error'>
        Session not found
      </Alert>
    );
  }

  // Check if current user is an organizer/admin
  const canEdit = typedEvent?.organizers?.some(
    (org) => org.id === currentUser?.id && ['ADMIN', 'ORGANIZER'].includes(org.role),
  );

  const handleStatusChange = async (newStatus: SessionStatus) => {
    try {
      await updateStatus({
        id: Number(sessionId),
        status: newStatus,
      }).unwrap();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleUpdate = async (updates: Record<string, unknown>) => {
    try {
      await updateSession({
        id: Number(sessionId),
        ...updates,
      }).unwrap();
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  // Determine if chat should be shown based on chat_mode and user role
  const shouldShowChat = (): boolean => {
    if (!typedSession?.chat_mode) return true; // Default to showing chat if no mode set

    const chatMode = typedSession.chat_mode;

    // If chat is disabled, don't show for anyone
    if (chatMode === 'DISABLED') return false;

    // If backstage only, only show for speakers, organizers, and admins
    if (chatMode === 'BACKSTAGE_ONLY') {
      return ['ADMIN', 'ORGANIZER', 'SPEAKER'].includes(userEventRole as string);
    }

    // If enabled, show for everyone
    return true;
  };

  const chatEnabled = shouldShowChat();

  return (
    <div className={cn(styles.container)}>
      {/* Background Shapes */}
      <div className={cn(styles.bgShape1)} />
      <div className={cn(styles.bgShape2)} />
      <div className={cn(styles.bgShape3)} />

      {/* Grid Layout Container */}
      <div
        className={cn(
          styles.layoutGrid,
          (!chatEnabled || (chatEnabled && !isChatOpen)) && styles.chatClosed,
        )}
      >
        {/* Content Wrapper */}
        <div className={cn(styles.contentWrapper)}>
          {/* Section 1 - Video Section (wrapped video player) */}
          <section className={cn(styles.videoSection)}>
            {/* Inner video container - dark glass layer */}
            <div className={cn(styles.videoContainer)}>
              {/* Title at the TOP of this container */}
              <div className={cn(styles.sectionHeader)}>
                <Title className={cn(styles.title)}>{typedSession.title}</Title>
                {typedSession.is_live && <div className={cn(styles.liveBadge)}>LIVE</div>}
              </div>

              {/* Video Display */}
              <div className={cn(styles.videoWrapper)}>
                <SessionDisplay
                  session={typedSession}
                  event={typedEvent}
                  currentUser={currentUser}
                />
              </div>

              {/* Session Details - Under video within same container */}
              <div className={cn(styles.videoFooter)}>
                <SessionDetails
                  session={typedSession}
                  event={typedEvent}
                  canEdit={canEdit}
                  onStatusChange={handleStatusChange}
                  onUpdate={handleUpdate}
                />
              </div>
            </div>
          </section>

          {/* Section 2 - About Section (separate glass container) */}
          <section className={cn(styles.aboutSection)}>
            <h2 className={cn(styles.sectionTitle)}>About This Session</h2>

            {/* Speakers */}
            <SessionSpeakers sessionId={sessionId} canEdit={canEdit} />

            {/* Description */}
            {typedSession.description && (
              <Text className={cn(styles.description)}>{typedSession.description}</Text>
            )}
          </section>
        </div>

        {/* Ghost spacer element - maintains grid space for chat */}
        {chatEnabled && <div className={cn(styles.chatGhost)} aria-hidden='true' />}
      </div>

      {/* Fixed position chat - outside of grid */}
      {chatEnabled && (
        <div className={cn(styles.fixedChatContainer)}>
          <SessionChat
            sessionId={sessionId as string}
            isEnabled={true}
            isOpen={isChatOpen}
            onToggle={setIsChatOpen}
          />
        </div>
      )}

      {/* Floating chat button - outside grid */}
      {chatEnabled && !isChatOpen && (
        <button onClick={() => setIsChatOpen(true)} className={cn(styles.floatingChatButton)}>
          <IconMessage size={24} />
        </button>
      )}
    </div>
  );
};

export default SessionPage;
