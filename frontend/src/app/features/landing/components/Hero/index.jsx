import { HeroTitle } from './HeroTitle';
import { HeroTagline } from './HeroTagline';
import { HeroActions } from './HeroActions';

export const Hero = () => {
  return (
    <section>
      <HeroTitle />
      <HeroTagline />
      <HeroActions />
    </section>
  );
};
