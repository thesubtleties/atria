import { Container, LoadingOverlay, Alert, Stack, Title, Text, Group, Badge } from '@mantine/core';
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
  const [isChatOpen, setIsChatOpen] = useState(false); // Start closed, open after render
  const [shouldShiftContent, setShouldShiftContent] = useState(false); // Start unshifted
  const mainContentRef = useRef(null);

  const { data: session, isLoading } = useGetSessionQuery(sessionId);
  const { data: event } = useGetEventQuery(session?.event_id, {
    skip: !session?.event_id,
  });
  const [updateStatus] = useUpdateSessionStatusMutation();
  const [updateSession] = useUpdateSessionMutation();

  // Check if we need to shift content when chat opens
  useEffect(() => {
    const checkSpace = () => {
      if (!mainContentRef.current) return;
      
      if (!isChatOpen) {
        setShouldShiftContent(false);
        return;
      }
      
      // Get the container element
      const container = mainContentRef.current.closest('.mantine-Container-root');
      if (!container) return;
      
      const containerStyles = window.getComputedStyle(container);
      const containerMarginLeft = parseFloat(containerStyles.marginLeft) || 0;
      const containerMarginRight = parseFloat(containerStyles.marginRight) || 0;
      
      // Calculate total margin space available
      const totalMargin = containerMarginLeft + containerMarginRight;
      
      // Chat needs 394px (370px width + 24px gap)
      const chatSpace = 394;
      
      // Check if we have enough margin space
      if (totalMargin >= chatSpace) {
        // Enough margin space - no need to shift
        setShouldShiftContent(false);
      } else {
        // Not enough margin - need to shift content
        setShouldShiftContent(true);
      }
    };
    
    let loadHandled = false;
    
    // Function to run initial check
    const runInitialCheck = () => {
      if (!loadHandled) {
        loadHandled = true;
        checkSpace();
      }
    };
    
    // Wait for all styles to load before initial check
    if (document.readyState === 'complete') {
      // Page already loaded, but styles might still be applying
      // Use a small delay to ensure CSS is processed
      setTimeout(runInitialCheck, 50);
    } else {
      // Wait for load event to ensure CSS is applied
      window.addEventListener('load', runInitialCheck);
    }
    
    // Add resize listener for dynamic changes
    window.addEventListener('resize', checkSpace);
    
    // Run check when chat toggle changes (after initial load)
    if (loadHandled) {
      checkSpace();
    }
    
    return () => {
      window.removeEventListener('resize', checkSpace);
      window.removeEventListener('load', runInitialCheck);
    };
  }, [isChatOpen]);

  // Auto-open chat after initial render
  useEffect(() => {
    const openChat = () => {
      setIsChatOpen(true);
    };

    if (document.readyState === 'complete') {
      // Page loaded, open after a brief delay for smooth animation
      setTimeout(openChat, 300);
    } else {
      // Wait for page load
      window.addEventListener('load', () => {
        setTimeout(openChat, 300);
      });
    }
  }, []); // Run once on mount

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
            <div 
              ref={mainContentRef}
              className={`${styles.mainContent} ${shouldShiftContent ? '' : styles.chatClosed}`}>
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
