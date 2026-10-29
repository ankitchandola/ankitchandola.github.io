import { useState, type ReactNode } from 'react';
import { Routes, Route } from 'react-router';
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  FileText,
  Github,
  Linkedin,
  Accessibility,
} from 'lucide-react';
import { profile, scope, year } from './content/profile';
import { experience } from './content/experience';
import HeaderNavigation from './components/HeaderNavigation';
import projects from './content/projects';
import type { Project as ProjectContent } from './content/types.ts';
import ProjectDemonstration from './projects/ProjectDemonstration';
import ReconDemo from './home/ReconDemo';
import Ricochet from './play/Ricochet';
function Header() {
  return (
    <header className="header shell">
      <a className="wordmark" href="/">
        <span className="monogram" aria-hidden="true">
          a<span>c</span>
        </span>
        <span>
          Ankit Chandola<span className="brand-sub">FULL-STACK DEVELOPER</span>
        </span>
      </a>
      <HeaderNavigation />
    </header>
  );
}
function Footer() {
  return (
    <>
      <section className="contact shell" id="contact">
        <div className="contact-label">
          <span>Delhi, India · Full-stack development</span>
        </div>
        <div className="contact-title">
          <h2>
            Want to
            <br />
            <span>talk?</span>
          </h2>
          <a
            className="contact-arrow"
            href={'mailto:' + profile.email}
            aria-label="Email Ankit"
          >
            <ArrowUpRight size={70} strokeWidth={1.3} />
          </a>
        </div>
        <a className="contact-email" href={'mailto:' + profile.email}>
          {profile.email}
          <ArrowUpRight size={28} />
        </a>
      </section>
      <footer className="footer shell">
        <span>
          © {year} {profile.name}
        </span>
        <div>
          <a href={profile.github} target="_blank" rel="noopener noreferrer">
            <Github size={24} />
            GitHub
          </a>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
            <Linkedin size={24} />
            LinkedIn
          </a>
          <a href={profile.resume} target="_blank" rel="noopener">
            <FileText size={24} />
            Résumé
          </a>
        </div>
        <a href="/lite">
          <Accessibility size={21} />
          Lite version
        </a>
      </footer>
    </>
  );
}
function Experience() {
  return (
    <section className="experience shell" id="experience">
      <div className="section-label">
        <span className="section-number">03</span>
        <span>Experience</span>
      </div>
      <div className="experience-intro">
        <h2>
          Where I’ve
          <br />
          <span>worked.</span>
        </h2>
        <p>
          My roles at Green Fortune Technologies, Hippo Homes and Nethues, from
          2021 to the present.
        </p>
      </div>
      <div className="history-list">
        {experience.map(
          ({ dates, company, companyNote, liteCompany, role, lite: r }, i) => (
            <article key={dates}>
              <span className="history-date">{dates}</span>
              <div>
                <h3>
                  {liteCompany ?? company}
                  {companyNote && (
                    <>
                      {' '}
                      <span>{companyNote}</span>
                    </>
                  )}
                </h3>
                <p className="history-role">{role}</p>
                <p>{r.summary}</p>
                {r.outcome && (
                  <p className="outcome-line">
                    <ArrowUpRight size={20} />
                    <b>{r.outcome[0]}</b>
                    <span>{r.outcome[1]}</span>
                  </p>
                )}
                <div className="tags">
                  {r.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </div>
              <span className="history-number">
                {String(i + 1).padStart(2, '0')}
              </span>
            </article>
          ),
        )}
      </div>
    </section>
  );
}

function Today() {
  return (
    <section className="today" id="today">
      <div className="section-label">
        <span className="section-number">01</span>
        <span>Today</span>
      </div>
      <div className="today-grid">
        <div>
          <span className="kicker">
            GREEN FORTUNE TECHNOLOGIES · 2025 — PRESENT
          </span>
          <h2>
            CRM, field work
            <br />
            and the web.
          </h2>
          <p>
            I work on the sales CRM, operations platform, a shared React
            visualization package and the public website, including its CMS and
            staging environment.
          </p>
        </div>
        <div className="scope-stats" aria-label="Current project scope">
          {scope.map(([n, label, detail]) => (
            <div key={n}>
              <strong>{n}</strong>
              <span>
                <span className="scope-name">{label}</span>
                <br />
                <span className="scope-detail">{detail}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
function Gallery({ project }: { project: ProjectContent }) {
  const [active, setActive] = useState(0);
  if (!project.images.length) return null;
  return (
    <div className="evidence-gallery">
      <p className="gallery-invite">Choose a screenshot to view.</p>
      <div className="gallery-options">
        {project.images.map(([file, label], i) => (
          <button
            key={file}
            onClick={() => setActive(i)}
            aria-pressed={active === i}
          >
            {label}
          </button>
        ))}
      </div>
      {project.images.map(([file, label, caption], i) => (
        <figure key={file} hidden={active !== i}>
          <a
            href={'/assets/projects/' + file + '.png'}
            target="_blank"
            rel="noopener"
            tabIndex={-1}
            aria-hidden="true"
          >
            <img
              loading="lazy"
              src={'/assets/projects/' + file + '.png'}
              alt={caption}
            />
          </a>
          <figcaption>
            {caption}{' '}
            <span>
              <a
                href={'/assets/projects/' + file + '.png'}
                target="_blank"
                rel="noopener"
                aria-label={'Open full screenshot: ' + label}
              >
                Open full screenshot <ArrowUpRight size={14} />
              </a>
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
function ProjectNav({ index }: { index: number }) {
  const prev = projects[(index + projects.length - 1) % projects.length],
    next = projects[(index + 1) % projects.length];
  if (!prev || !next) throw new RangeError(`Unknown project index ${index}`);
  return (
    <nav className="project-nav" aria-label="More projects">
      <a href={'/work/' + prev.slug}>
        <span>
          <ArrowLeft size={18} />
          Previous
        </span>
        <b>{prev.name}</b>
      </a>
      <a href={'/work/' + next.slug}>
        <span>
          Next
          <ArrowRight size={18} />
        </span>
        <b>{next.name}</b>
      </a>
    </nav>
  );
}
function CaseSection({
  id,
  number,
  title,
  children,
  className = '',
}: {
  id: string;
  number: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={'verified-notes ' + className}
      id={id}
      aria-labelledby={id + '-title'}
    >
      <header className="case-section-heading">
        <span className="case-section-number" aria-hidden="true">
          {number}
        </span>
        <h2 id={id + '-title'}>{title}</h2>
      </header>
      <div className="case-section-body">{children}</div>
    </section>
  );
}
function Project({ slug }: { slug: string }) {
  const index = projects.findIndex((p) => p.slug === slug),
    p = projects[index];
  if (!p) throw new Error(`Unknown project slug ${slug}`);
  const chapters = [
    { id: 'screens', label: 'Screens', show: p.images.length > 0 },
    { id: 'workflow', label: 'Problem & workflow', show: !!p.problem },
    { id: 'contribution', label: 'My contribution', show: true },
    { id: 'engineering', label: 'Engineering', show: !!p.challenges },
    { id: 'result', label: 'Result', show: !!(p.result || p.facts) },
    { id: 'scope', label: 'Scope limits', show: !!p.limits },
  ].filter((chapter) => chapter.show);
  const number = (id: string) =>
    String(chapters.findIndex((chapter) => chapter.id === id) + 1).padStart(
      2,
      '0',
    );
  return (
    <section className="case-page shell">
      <a className="back-link" href="/#work">
        <ArrowLeft size={22} />
        Back to selected work
      </a>
      <div className="case-page-heading">
        <div className="case-title-block">
          <span className="kicker">{p.kind} / PROJECT DETAILS</span>
          <h1>{p.name}</h1>
        </div>
        <div className="case-introduction">
          <p>{p.summary}</p>
          {p.context && (
            <ul className="case-context">
              {p.context.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          <div className="tags">
            {p.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </div>
      <nav className="case-index" aria-label="On this project">
        {chapters.map(({ id, label }, i) => (
          <a key={id} href={'#' + id}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            {label}
          </a>
        ))}
      </nav>
      {p.images.length > 0 && (
        <div id="screens" className="case-screens">
          <Gallery project={p} />
        </div>
      )}
      {p.problem && (
        <CaseSection
          id="workflow"
          number={number('workflow')}
          title={p.detailHeadings?.problem ?? 'The problem'}
          className="case-workflow"
        >
          <p className="problem-note">{p.problem}</p>
          {p.slug === 'recon-desk' && p.home ? (
            <ReconDemo home={p.home} />
          ) : p.demonstration ? (
            <ProjectDemonstration project={p} />
          ) : null}
        </CaseSection>
      )}
      <CaseSection
        id="contribution"
        number={number('contribution')}
        title={p.detailHeadings?.contribution ?? 'My contribution'}
      >
        <p className="ownership-note">{p.ownership}</p>
        <div className="contribution-grid">
          {p.sections.map(([title, body]) => (
            <section key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </section>
          ))}
        </div>
      </CaseSection>
      {p.challenges && (
        <CaseSection
          id="engineering"
          number={number('engineering')}
          title={p.detailHeadings?.engineering ?? 'Engineering challenges'}
        >
          {p.challenges.map(([title, problem, decision, tradeoff], i) => (
            <section className="challenge" key={title}>
              <h3>
                <span className="challenge-number">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {title}
              </h3>
              <dl>
                <div>
                  <dt>Problem</dt>
                  <dd>{problem}</dd>
                </div>
                <div className="challenge-decision">
                  <dt>Decision</dt>
                  <dd>{decision}</dd>
                </div>
                <div>
                  <dt>Trade-off</dt>
                  <dd>{tradeoff}</dd>
                </div>
              </dl>
            </section>
          ))}
        </CaseSection>
      )}
      {(p.result || p.facts) && (
        <CaseSection
          id="result"
          number={number('result')}
          title={p.detailHeadings?.result ?? 'Result'}
          className="case-result"
        >
          {p.result && <p>{p.result}</p>}
          {p.facts && (
            <ul className="fact-list">
              {p.facts.map(([value, label, caveat]) => (
                <li key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                  <small>{caveat}</small>
                </li>
              ))}
            </ul>
          )}
        </CaseSection>
      )}
      {p.limits && (
        <CaseSection
          id="scope"
          number={number('scope')}
          title={p.detailHeadings?.scope ?? 'Scope limits'}
        >
          <p>{p.limits}</p>
          {p.url && (
            <a
              className="solid-button"
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open {p.name}
              <ArrowUpRight size={24} />
            </a>
          )}
        </CaseSection>
      )}
      <ProjectNav index={index} />
    </section>
  );
}
function Lite() {
  return (
    <section className="lite-page shell">
      <span className="kicker">LITE VERSION</span>
      <h1>
        Ankit Chandola.
        <br />
        <span>Full-stack developer.</span>
      </h1>
      <p className="lite-intro">
        I build operations software, CRM workflows and browser tools. Based in
        Delhi, India. This version has no scripts or animation.
      </p>
      <Today />
      <div className="lite-projects" id="work">
        <div className="section-label">
          <span className="section-number">02</span>
          <span>Selected work</span>
        </div>
        <h2>Selected work</h2>
        {projects.map((p) => (
          <a key={p.slug} href={'/work/' + p.slug}>
            <div>
              <h3>{p.name}</h3>
              <div className="lite-description">
                <p>{p.summary}</p>
              </div>
            </div>
            <ArrowUpRight size={30} />
          </a>
        ))}
      </div>
      <Experience />
      <a className="solid-button" href="/">
        Back to the main site
        <ArrowRight size={23} />
      </a>
    </section>
  );
}
function Missing() {
  return (
    <section className="shell not-found">
      <h1>Page not found.</h1>
      <a href="/">Back to homepage</a>
    </section>
  );
}
export default function App() {
  return (
    <div className="site">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Routes>
          {projects.map((p) => (
            <Route
              key={p.slug}
              path={'/work/' + p.slug}
              element={<Project slug={p.slug} />}
            />
          ))}
          <Route path="/play" element={<Ricochet />} />
          <Route path="/lite" element={<Lite />} />
          <Route path="*" element={<Missing />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
