import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/buttons';
import type { DashboardOrganization } from '../index';
import styles from './styles/index.module.css';

type OrganizationsSectionProps = {
  organizations: DashboardOrganization[] | null;
};

export const OrganizationsSection = ({ organizations }: OrganizationsSectionProps) => {
  const navigate = useNavigate();

  const getOrgAvatar = (name: string): string => {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length >= 2 && words[0] && words[1]) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarGradient = (index: number): string => {
    const gradients = [
      'linear-gradient(45deg, #06B6D4, #0891B2)',
      'linear-gradient(45deg, #F59E0B, #EAB308)',
      'linear-gradient(45deg, #EC4899, #F472B6)',
      'linear-gradient(45deg, #8B5CF6, #A855F7)',
      'linear-gradient(45deg, #10B981, #059669)',
    ];
    return gradients[index % gradients.length] ?? 'linear-gradient(45deg, #06B6D4, #0891B2)';
  };

  const formatRole = (role: string | null): string => {
    if (!role) return '';
    // Convert OWNER -> Owner, ADMIN -> Admin, MEMBER -> Member
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  return (
    <section className={styles.dashboardSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Your Organizations</h2>
        <Button variant='primary' onClick={() => navigate('/app/organizations/new')}>
          + Create Organization
        </Button>
      </div>

      {organizations && organizations.length > 0 ?
        <div className={styles.cardList}>
          {organizations.map((org, index) => (
            <div
              key={org.id}
              className={styles.card}
              onClick={() => navigate(`/app/organizations/${org.id}`)}
            >
              <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    className={styles.orgAvatar}
                    style={{ background: getAvatarGradient(index) }}
                  >
                    {getOrgAvatar(org.name)}
                  </div>
                  <div>
                    <div className={styles.cardTitle}>{org.name}</div>
                  </div>
                </div>
              </div>
              <div className={styles.cardMeta}>
                {formatRole(org.role)} • {org.event_count}{' '}
                {org.event_count === 1 ? 'event' : 'events'} • {org.member_count}{' '}
                {org.member_count === 1 ? 'member' : 'members'}
              </div>
            </div>
          ))}
        </div>
      : <div className={styles.emptyState}>
          <p>{`You're not part of any organizations yet.`}</p>
          <Button variant='primary' onClick={() => navigate('/app/organizations/new')}>
            Create Your First Organization
          </Button>
        </div>
      }
    </section>
  );
};
