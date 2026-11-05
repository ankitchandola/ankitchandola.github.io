import SiteHeader from './SiteHeader';
import Hero from './Hero';
import StackRibbon from './StackRibbon';
import CurrentWork from './CurrentWork';
import SelectedWork from './SelectedWork';
import HowIWork from './HowIWork';
import Decisions from './Decisions';
import Career from './Career';
import Contact from './Contact';
import PlayInvite from './PlayInvite';
import FooterBar from '../components/FooterBar';
export default function Home() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <StackRibbon />
        <CurrentWork />
        <SelectedWork />
        <PlayInvite />
        <HowIWork />
        <Decisions />
        <Career />
        <Contact />
      </main>
      <FooterBar />
    </>
  );
}
