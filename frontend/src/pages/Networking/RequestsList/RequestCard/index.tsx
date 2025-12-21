import { useState, type MouseEvent } from 'react';
import { Card, Stack, Group, Avatar, Text, ActionIcon } from '@mantine/core';
import { LoadingSpinner } from '@/shared/components/loading';
import {
  IconCheck,
  IconX,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconWorld,
  IconMail,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useUpdateConnectionStatusMutation } from '@/app/features/networking/api';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';
import type { ConnectionRequest } from '../index';
import type { ApiError } from '@/types';

type RequestCardProps = {
  request: ConnectionRequest;
};

type UpdateConnectionResult = {
  thread_id?: number;
};

export function RequestCard({ request }: RequestCardProps) {
  const navigate = useNavigate();
  const [updateStatus, { isLoading }] = useUpdateConnectionStatusMutation();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const result = (await updateStatus({
        connectionId: request.id,
        status: 'accepted',
      }).unwrap()) as UpdateConnectionResult;

      notifications.show({
        title: 'Connection accepted',
        message: `You are now connected with ${request.requester.full_name}`,
        color: 'green',
      });

      // Optional: Navigate to DM if thread_id is returned
      if (result.thread_id) {
        // Navigate after a short delay to let the notification show
        setTimeout(() => {
          navigate(`/app/messages/${result.thread_id}`);
        }, 1000);
      }
    } catch (err) {
      const error = err as ApiError;
      console.error('Failed to accept connection:', error);
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to accept connection request',
        color: 'red',
      });
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await updateStatus({
        connectionId: request.id,
        status: 'rejected',
      }).unwrap();

      notifications.show({
        title: 'Request declined',
        message: 'Connection request has been declined',
        color: 'gray',
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to decline connection request',
        color: 'red',
      });
      setIsRejecting(false);
    }
  };

  const requester = request.requester || {};
  const initial = requester.full_name?.[0]?.toUpperCase() || '?';

  const stopPropagation = (e: MouseEvent) => e.stopPropagation();

  return (
    <Card className={cn(styles.card)} padding='lg' radius='md' withBorder>
      <Stack gap='md'>
        <Group align='flex-start' gap='md'>
          <Avatar
            src={requester.image_url ?? null}
            size={60}
            radius='xl'
            className={cn(styles.avatar)}
          >
            {!requester.image_url && initial}
          </Avatar>

          <div
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
            }}
          >
            <div style={{ flex: 1 }}>
              <Text size='lg' fw={600} className={cn(styles.name)}>
                {requester.full_name}
              </Text>
              {requester.title && (
                <Text size='sm' c='dimmed' className={cn(styles.title)}>
                  {requester.title}
                </Text>
              )}
              {requester.company_name && (
                <Text size='sm' c='dimmed' className={cn(styles.company)}>
                  {requester.company_name}
                </Text>
              )}
            </div>

            {/* Social links aligned to the right */}
            {(requester.social_links?.linkedin ||
              requester.social_links?.twitter ||
              requester.social_links?.website ||
              requester.email) && (
              <Group gap={0} className={cn(styles.socialsRight)}>
                {requester.social_links?.linkedin && (
                  <div className={cn(styles.linkedinIcon)}>
                    <ActionIcon
                      size='sm'
                      variant='subtle'
                      component='a'
                      href={requester.social_links.linkedin}
                      target='_blank'
                      aria-label='LinkedIn'
                      onClick={stopPropagation}
                    >
                      <IconBrandLinkedin size={20} />
                    </ActionIcon>
                  </div>
                )}
                {requester.social_links?.twitter && (
                  <div className={cn(styles.twitterIcon)}>
                    <ActionIcon
                      size='sm'
                      variant='subtle'
                      component='a'
                      href={requester.social_links.twitter}
                      target='_blank'
                      aria-label='Twitter'
                      onClick={stopPropagation}
                    >
                      <IconBrandTwitter size={20} />
                    </ActionIcon>
                  </div>
                )}
                {requester.social_links?.website && (
                  <div className={cn(styles.websiteIcon)}>
                    <ActionIcon
                      size='sm'
                      variant='subtle'
                      component='a'
                      href={requester.social_links.website}
                      target='_blank'
                      aria-label='Website'
                      onClick={stopPropagation}
                    >
                      <IconWorld size={20} />
                    </ActionIcon>
                  </div>
                )}
                {requester.email && (
                  <div className={cn(styles.emailIcon)}>
                    <ActionIcon
                      size='sm'
                      variant='subtle'
                      component='a'
                      href={`mailto:${requester.email}`}
                      target='_blank'
                      aria-label='Email'
                      onClick={stopPropagation}
                    >
                      <IconMail size={20} />
                    </ActionIcon>
                  </div>
                )}
              </Group>
            )}
          </div>
        </Group>

        <Card.Section className={cn(styles.messageSection)} px='lg'>
          <Text className={cn(styles.messageText)}>{`"${request.icebreaker_message}"`}</Text>
        </Card.Section>

        <Group justify='flex-end' align='center'>
          <Group gap='xs'>
            <button
              onClick={handleAccept}
              disabled={isLoading || isRejecting}
              className={cn(styles.acceptButton)}
            >
              {isAccepting ?
                <LoadingSpinner size='xs' color='#16A34A' />
              : <>
                  <IconCheck size={16} />
                  Accept
                </>
              }
            </button>
            <button
              onClick={handleReject}
              disabled={isLoading || isAccepting}
              className={cn(styles.declineButton)}
            >
              {isRejecting ?
                <LoadingSpinner size='xs' color='#64748B' />
              : <>
                  <IconX size={16} />
                  Decline
                </>
              }
            </button>
          </Group>
        </Group>

        <Text size='xs' ta='right' className={cn(styles.timestamp)}>
          Received {new Date(request.created_at).toLocaleDateString()}
        </Text>
      </Stack>
    </Card>
  );
}
