import { Container, LoadingOverlay, Alert, Stack, Title, Text, Group, Badge } from '@mantine/core';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState } from 'react';
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
  const [isChatOpen, setIsChatOpen] = useState(true);

  const { data: session, isLoading } = useGetSessionQuery(sessionId);
  const { data: event } = useGetEventQuery(session?.event_id, {
    skip: !session?.event_id,
  });
  const [updateStatus] = useUpdateSessionStatusMutation();
  const [updateSession] = useUpdateSessionMutation();

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
    <>
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

          {/* Main Content with Collapsible Chat */}
          <div className={styles.contentWithChat}>
            {/* Main Content Area */}
            <div className={`${styles.mainContent} ${isChatOpen ? '' : styles.chatClosed}`}>
              {/* Video Display */}
              <SessionDisplay
                streamUrl={session.stream_url}
              />
              
              {/* Session Details - Horizontal under video */}
              <SessionDetails
                session={session}
                canEdit={canEdit}
                onStatusChange={handleStatusChange}
                onUpdate={handleUpdate}
              />
              
              {/* About This Session Section */}
              <div className={styles.aboutSection}>
                <Title order={3} mb="md">About This Session</Title>
                
                {/* Speakers */}
                <SessionSpeakers
                  sessionId={sessionId}
                  canEdit={canEdit}
                />
                
                {/* Description */}
                {session.description && (
                  <Text mt="lg" className={styles.description}>
                    {session.description}
                  </Text>
                )}
              </div>
            </div>
          </div>
        </Stack>
      </Container>
      
      {/* Collapsible Chat Sidebar - Fixed position outside Container */}
      <SessionChat 
        sessionId={sessionId}
        isEnabled={true} // TODO: Check if chat is enabled for this session
        onToggle={setIsChatOpen}
      />
    </>
  );
};

export default SessionPage;
