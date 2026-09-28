import { Masthead } from './components/Masthead';
import { CurrentWork } from './sections/CurrentWork';
import { Hero } from './sections/Hero';
import { Lab } from './sections/Lab';
import { Philosophy } from './sections/Philosophy';
import { SiteFooter } from './sections/SiteFooter';

export default function App() {
  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <Masthead />
      <main id="content" tabIndex={-1}>
        <Hero />
        <CurrentWork />
        <Philosophy />
        <Lab />
      </main>
      <SiteFooter />
    </>
  );
}
