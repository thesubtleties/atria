import {
  Container,
  LoadingOverlay,
  Alert,
  Stack,
  Title,
  Text,
  Group,
  Badge,
  ActionIcon,
} from '@mantine/core';
import { IconMessage } from '@tabler/icons-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState, useEffect, useRef } from 'react';
import {
  useGetSessionQuery,
  useUpdateSessionStatusMutation,
  useUpdateSessionMutation,
} from '@/app/features/sessions/api';
import { useGetEventQuery } from '@/app/features/events/api';
import { SessionDisplay } from './SessionDisplay';
import { SessionSpeakers } from './SessionSpeakers';
import { SessionDetails } from './SessionDetails';
import { SessionChat } from './SessionChat';
import styles from './styles/index.module.css';

export const SessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const [isChatOpen, setIsChatOpen] = useState(true); // Start open for CSS approach
  const mainContentRef = useRef(null);

  const { data: session, isLoading } = useGetSessionQuery(sessionId);
  const { data: event } = useGetEventQuery(session?.event_id, {
    skip: !session?.event_id,
  });
  const [updateStatus] = useUpdateSessionStatusMutation();
  const [updateSession] = useUpdateSessionMutation();
  
  // Get current user's role in the event
  const getCurrentUserEventRole = () => {
    if (!event || !currentUser) return null;
    
    // Check if user is an event organizer/admin
    const organizer = event.organizers?.find(org => org.id === currentUser.id);
    if (organizer) return organizer.role;
    
    // Check if user is a speaker for this session
    const isSpeaker = session?.session_speakers?.some(
      speaker => speaker.user.id === currentUser.id
    );
    if (isSpeaker) return 'SPEAKER';
    
    // Otherwise they're an attendee
    return 'ATTENDEE';
  };
  
  const userEventRole = getCurrentUserEventRole();

  // No timing logic needed for CSS approach

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (!session) {
    return (
      <Alert color="red" title="Error">
        Session not found
      </Alert>
    );
  }

  // Check if current user is an organizer/admin
  const canEdit = event?.organizers?.some(
    (org) =>
      org.id === currentUser?.id && ['ADMIN', 'ORGANIZER'].includes(org.role)
  );

  const handleStatusChange = async (newStatus) => {
    try {
      await updateStatus({
        id: sessionId,
        status: newStatus,
      }).unwrap();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleUpdate = async (updates) => {
    try {
      await updateSession({
        id: sessionId,
        ...updates,
      }).unwrap();
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };
  
  // Determine if chat should be shown based on chat_mode and user role
  const shouldShowChat = () => {
    if (!session?.chat_mode) return true; // Default to showing chat if no mode set
    
    const chatMode = session.chat_mode;
    
    // If chat is disabled, don't show for anyone
    if (chatMode === 'DISABLED') return false;
    
    // If backstage only, only show for speakers, organizers, and admins
    if (chatMode === 'BACKSTAGE_ONLY') {
      return ['ADMIN', 'ORGANIZER', 'SPEAKER'].includes(userEventRole);
    }
    
    // If enabled, show for everyone
    return true;
  };
  
  const chatEnabled = shouldShowChat();

  return (
    <div
      className={`${chatEnabled ? styles.sessionLayout : styles.sessionLayoutNoChat} ${!isChatOpen ? styles.chatClosed : ''}`}
    >
      {/* Main content area */}
      <div className={styles.mainContentWrapper}>
        <Container size="xl" className={styles.pageContainer}>
          <Stack spacing="xl">
            {/* Session Header */}
            <div className={styles.header}>
              <div>
                <Title order={1} className={styles.title}>
                  {session.title}
                </Title>
                {session.is_live && (
                  <Badge
                    size="sm"
                    color="red"
                    variant="dot"
                    className={styles.liveBadge}
                    mt="xs"
                  >
                    LIVE
                  </Badge>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div ref={mainContentRef} className={styles.mainContent}>
              {/* Video Display */}
              <SessionDisplay streamUrl={session.stream_url} />

              {/* Session Details - Horizontal under video */}
              <SessionDetails
                session={session}
                canEdit={canEdit}
                onStatusChange={handleStatusChange}
                onUpdate={handleUpdate}
              />

              {/* About This Session Section */}
              <div className={styles.aboutSection}>
                <Title order={3} mb="md">
                  About This Session
                </Title>

                {/* Speakers */}
                <SessionSpeakers sessionId={sessionId} canEdit={canEdit} />

                {/* Description */}
                {session.description && (
                  <Text mt="lg" className={styles.description}>
                    {session.description}
                  </Text>
                )}
              </div>
            </div>
          </Stack>
        </Container>
      </div>

      {/* Chat Sidebar - Part of grid layout */}
      {chatEnabled && (
        <div className={styles.chatWrapper}>
          {isChatOpen ? (
            <SessionChat
              sessionId={sessionId}
              isEnabled={true}
              onToggle={setIsChatOpen}
            />
          ) : (
            <ActionIcon
              onClick={() => setIsChatOpen(true)}
              size="xl"
              radius="xl"
              className={styles.floatingChatButton}
            >
              <IconMessage size={24} />
            </ActionIcon>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionPage;
