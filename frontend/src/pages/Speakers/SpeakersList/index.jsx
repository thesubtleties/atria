// pages/Speakers/SpeakersList/index.jsx
import { Container, Title, SimpleGrid } from '@mantine/core';
import SpeakerCard from './SpeakerCard';
import styles from './styles/index.module.css';

export default function SpeakersList({ speakers }) {
  return (
    <Container size="xl" py="xl">
      <Title order={2} ta="center" mb="xl">
        Event Speakers
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {speakers.map((speaker) => (
          <SpeakerCard key={speaker.user_id} speaker={speaker} />
        ))}
      </SimpleGrid>
    </Container>
  );
}
