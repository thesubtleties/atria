import { useNavigationTitle } from '../../../hooks/useNavigationTitle';
import { SimpleTitle } from './SimpleTitle';
import { TitleWithSubtitle } from './TitleWithSubtitle';
import styles from './CenterContent.module.css';

type CenterContentProps = {
  context?: unknown;
};

export const CenterContent = (_props: CenterContentProps) => {
  const { titleData, isLoading } = useNavigationTitle();

  if (isLoading) {
    return null;
  }

  if (!titleData) {
    return null;
  }

  return (
    <div className={styles.centerContent ?? ''}>
      {titleData.subtitle ?
        <TitleWithSubtitle title={titleData.text} subtitle={titleData.subtitle} />
      : <SimpleTitle>{titleData.text}</SimpleTitle>}
    </div>
  );
};

