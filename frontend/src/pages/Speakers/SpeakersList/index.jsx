// pages/Speakers/SpeakersList/index.jsx
import { SimpleGrid, Text } from '@mantine/core';
import SpeakerCard from '@/shared/components/SpeakerCard';
import styles from './styles/index.module.css';

export default function SpeakersList({ speakers }) {
  // Group speakers by type if needed (keynote, featured, etc.)
  // For now, we'll show all speakers in one grid

  if (!speakers || speakers.length === 0) {
    return (
      <div className={styles.noSpeakers}>
        <Text size='lg' c='dimmed'>
          No speakers have been announced yet.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='xl' className={styles.speakersGrid}>
        {speakers.map((speaker) => (
          <SpeakerCard key={speaker.user_id} speaker={speaker} />
        ))}
      </SimpleGrid>
    </div>
  );
}
