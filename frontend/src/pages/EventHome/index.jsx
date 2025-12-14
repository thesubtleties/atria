import { useParams } from 'react-router-dom';
import { useGetEventQuery } from '../../app/features/events/api';
import { LoadingPage } from '../../shared/components/loading';
import Hero from './Hero';
import Welcome from './Welcome';
import Highlights from './Highlights';
import FAQ from './FAQ';
import EventInfo from './EventInfo';
import styles from './styles/index.module.css';

export const EventHome = () => {
  const { eventId } = useParams();
  const {
    data: event,
    isLoading,
    isError,
  } = useGetEventQuery(eventId, {
    skip: !eventId,
  });

  console.log(event);
  if (isLoading) return <LoadingPage message='Loading event home...' />;
  if (isError) return <div>Error loading event</div>;
  if (!event) return <div>Event not found</div>;

  const {
    title,
    hero_description,
    hero_images,
    sections,
    event_format,
    venue_name,
    venue_address,
    venue_city,
    venue_state,
    venue_country,
    start_date,
    end_date,
  } = event;

  return (
    <div className={styles.container}>
      {/* Background Shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />

      {/* Hero outside contentWrapper for full-width */}
      <Hero title={title} description={hero_description} images={hero_images} />

      <div className={styles.contentWrapper}>
        {sections?.welcome && (
          <Welcome title={sections.welcome.title} content={sections.welcome.content} />
        )}

        {sections?.highlights && <Highlights highlights={sections.highlights} />}

        <EventInfo
          format={event_format}
          venue={{
            name: venue_name,
            address: venue_address,
            city: venue_city,
            state: venue_state,
            country: venue_country,
          }}
          dates={{
            start: start_date,
            end: end_date,
          }}
        />

        {sections?.faqs && <FAQ faqs={sections.faqs} />}
      </div>
    </div>
  );
};

export default EventHome;
