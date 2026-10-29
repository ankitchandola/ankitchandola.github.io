import { ArrowUpRight, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import SiteSearch from './SiteSearch';

export default function HeaderNavigation({ home = false }: { home?: boolean }) {
  const links = (
    <>
      <a href={home ? '#about' : '/#about'}>About me</a>
      <a href={home ? '#work' : '/#work'}>Work</a>
      <a href={home ? '#experience' : '/#experience'}>Experience</a>
      <a className={home ? 'nav-contact' : 'header-contact'} href="#contact">
        Say hello
        <ArrowUpRight size={25} />
      </a>
    </>
  );
  return (
    <>
      <nav className="desktop-navigation" aria-label="Main navigation">
        {links}
        <SiteSearch home={home} />
        <ThemeToggle />
      </nav>
      <div className="mobile-header-tools">
        <ThemeToggle />
        <details className="mobile-navigation">
          <summary aria-label="Navigation menu">
            <Menu className="menu-open" size={22} />
            <X className="menu-close" size={22} />
          </summary>
          <nav aria-label="Mobile navigation">
            <SiteSearch home={home} labelled />
            {links}
          </nav>
        </details>
      </div>
    </>
  );
}
