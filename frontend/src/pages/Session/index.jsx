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

  return (
    <div
      className={`${styles.sessionLayout} ${!isChatOpen ? styles.chatClosed : ''}`}
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
      <div className={styles.chatWrapper}>
        {isChatOpen ? (
          <SessionChat
            sessionId={sessionId}
            isEnabled={true} // TODO: Check if chat is enabled for this session
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
    </div>
  );
};

export default SessionPage;
