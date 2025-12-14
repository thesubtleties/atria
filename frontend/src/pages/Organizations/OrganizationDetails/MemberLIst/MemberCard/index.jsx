import { Card, Text } from '@mantine/core';
import styles from './styles/index.module.css';

export const MemberCard = ({ user }) => (
  <Card className={styles.card}>
    <Text size='lg' weight={500}>
      {user.full_name}
    </Text>
    <Text size='sm' color='dimmed' transform='uppercase'>
      {user.role}
    </Text>
  </Card>
);
