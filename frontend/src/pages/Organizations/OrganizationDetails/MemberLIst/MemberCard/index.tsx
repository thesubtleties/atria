import { Card, Text } from '@mantine/core';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type User = {
  id: number;
  full_name: string;
  role: string;
};

type MemberCardProps = {
  user: User;
};

export const MemberCard = ({ user }: MemberCardProps) => (
  <Card className={cn(styles.card)}>
    <Text size='lg' fw={500}>
      {user.full_name}
    </Text>
    <Text size='sm' c='dimmed' tt='uppercase'>
      {user.role}
    </Text>
  </Card>
);
