// pages/Speakers/index.jsx
import { useParams } from 'react-router-dom';
import { useGetEventUsersQuery } from '../../app/features/events/api';
import SpeakersList from './SpeakersList';

export const SpeakersPage = () => {
  const { eventId } = useParams();
  const { data, isLoading } = useGetEventUsersQuery({
    eventId: eventId,
    role: 'SPEAKER',
  });

  if (isLoading) return <div>Loading...</div>;

  // Sort speakers alphabetically by name
  const sortedSpeakers = [...data.event_users].sort((a, b) =>
    a.user_name.localeCompare(b.user_name)
  );

  return <SpeakersList speakers={sortedSpeakers} />;
};

export default SpeakersPage;
