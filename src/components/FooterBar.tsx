import {
  ArrowUp,
  ArrowUpRight,
  FileText,
  Github,
  Linkedin,
} from 'lucide-react';
import { profile, year } from '../content/profile';

export default function FooterBar({ lite = false }: { lite?: boolean }) {
  return (
    <footer className="portfolio-footer">
      <div className="footer-main">
        <a className="footer-identity" href="/">
          <span className="footer-monogram" aria-hidden="true">
            ac
          </span>
          <span>
            <strong>{profile.name}</strong>
            <span>Full-stack developer · {profile.location}</span>
          </span>
        </a>
        <nav className="footer-links" aria-label="Footer links">
          <a href={profile.github} target="_blank" rel="noopener noreferrer">
            <Github aria-hidden="true" /> GitHub
          </a>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
            <Linkedin aria-hidden="true" /> LinkedIn
          </a>
          <a href={profile.resume} target="_blank" rel="noopener">
            <FileText aria-hidden="true" /> Résumé
          </a>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>
          © {year} {profile.name}
        </span>
        <a className="footer-edition" href={lite ? '/' : '/lite'}>
          {lite ? 'Main portfolio' : 'Lite reading version'}{' '}
          <ArrowUpRight aria-hidden="true" />
        </a>
        <a href="#main">
          Back to top <ArrowUp aria-hidden="true" />
        </a>
      </div>
    </footer>
  );
}
