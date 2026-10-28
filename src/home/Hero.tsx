import { LucideSvg } from '../components/ThemeToggle';
import { profile } from '../content/profile';
import { Icon } from './icons';
import projects from '../content/projects';

export default function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="hero wrap">
      <div className="hero-copy">
        <p className="eyebrow">FULL-STACK DEVELOPER</p>
        <h1 id="hero-heading">
          <span className="sr-only">Ankit Chandola. Full-stack developer.</span>
          <span aria-hidden="true" className="code-name">
            <span id="morph">{'<ankit chandola>'}</span>
            <span className="caret">_</span>
          </span>
        </h1>
        <p className="hero-title">
          Beyond the
          <br />
          <span>happy path.</span>
        </p>
        <p className="hero-description">
          A duplicated row. A survey saved without a connection. A file full of
          ambiguous matches. I build web apps and tools that handle them, from
          the first click to the systems behind it.
        </p>
        <div className="hero-actions">
          <a className="button dark" href="#work">
            Explore my work <Icon name="arrow-down-right" />
          </a>
          <a
            className="text-link"
            href={profile.resume}
            rel="noopener"
            target="_blank"
          >
            View résumé <Icon name="arrow-up-right" />
          </a>
        </div>
        <div className="hero-foot">
          <span className="location">
            <LucideSvg name="map-pin">
              <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
              <circle cx="12" cy="10" r="3" />
            </LucideSvg>
            BASED IN DELHI, INDIA
          </span>
          <a className="hero-lite-link" href="/lite">
            Lite version <Icon name="arrow-up-right" />
          </a>
        </div>
      </div>
      <div className="hero-world">
        <div className="world-stage" aria-hidden="true">
          <img
            className="world-poster"
            src="/assets/project-world.png"
            alt=""
            width="1236"
            height="824"
          />
          <canvas id="hero-world" />
        </div>
        <div className="world-heading">
          <span id="world-hint">Select a building</span>
          <button type="button" data-world-back="" hidden>
            Back to overview
          </button>
        </div>
        <div
          className="world-landmarks"
          role="group"
          aria-label="Explore project landmarks"
          hidden
        >
          {projects.map((project) => (
            <button
              key={project.slug}
              type="button"
              data-landmark={project.slug}
              aria-pressed="false"
              aria-controls={'landmark-' + project.slug}
            >
              {project.landmarkLabel ?? project.name}
            </button>
          ))}
        </div>
        <div className="world-projects">
          <div data-world-overview="">
            <p>
              Five projects, from browser tools to connected business systems.
            </p>
            <a href="#work">
              View selected work <Icon name="arrow-down-right" />
            </a>
          </div>
          {projects.map((project) => (
            <div
              key={project.slug}
              id={'landmark-' + project.slug}
              data-landmark-panel={project.slug}
              hidden
            >
              <p>{project.indexSummary ?? project.summary}</p>
              <a href={'/work/' + project.slug}>
                Explore {project.landmarkLabel ?? project.name}{' '}
                <Icon name="arrow-up-right" />
              </a>
            </div>
          ))}
        </div>
        <p className="sr-only" role="status" id="world-status" />
      </div>
    </section>
  );
}
