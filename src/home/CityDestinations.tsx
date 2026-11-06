import { cityDestinations, cityExperienceOrder } from '../content/city';
import { experience } from '../content/experience';
import { profile } from '../content/profile';
import projects from '../content/projects';
import { ricochet } from '../content/ricochet';
import { Icon } from './icons';

export function CityDestinationControls() {
  return (
    <div
      className="city-destinations"
      role="group"
      aria-label="City destinations"
    >
      {cityDestinations.map(({ id, name, purpose }) => (
        <button
          key={id}
          id={`city-destination-${id}`}
          type="button"
          data-city-destination={id}
          aria-pressed="false"
          aria-controls={`city-panel-${id}`}
        >
          <span>{name}</span>
          <span>{purpose}</span>
        </button>
      ))}
    </div>
  );
}

export function CityDestinationPanels() {
  return (
    <aside
      id="city-panels"
      className="city-panels"
      aria-label="Selected destination"
      hidden
    >
      <button
        id="city-sheet-handle"
        className="city-sheet-handle"
        type="button"
        aria-expanded="false"
        aria-label="Expand panel"
      />
      <section
        id="city-panel-studio"
        data-city-panel="studio"
        aria-labelledby="city-heading-studio"
        hidden
      >
        <h3 id="city-heading-studio" tabIndex={-1}>
          Studio
        </h3>
        <p>
          Projects from my current role and independent work, including the
          rental app built for a friend’s business.
        </p>
        <ul className="city-projects">
          {projects.map(({ slug, name, indexSummary, summary }) => (
            <li key={slug}>
              <a href={`/work/${slug}`}>
                {name}
                <Icon name="arrow-up-right" />
              </a>
              <p>{indexSummary ?? summary}</p>
            </li>
          ))}
        </ul>
      </section>
      <section
        id="city-panel-journey"
        data-city-panel="journey"
        aria-labelledby="city-heading-journey"
        hidden
      >
        <h3 id="city-heading-journey" tabIndex={-1}>
          Journey
        </h3>
        <p>
          My roles from 2021 to the present, starting with Nethues. These
          buildings are fictional, not the companies’ offices.
        </p>
        <ol className="city-timeline">
          {cityExperienceOrder.map((index) => {
            const stop = experience[index];
            if (!stop)
              throw new Error(`Missing city experience entry: ${index}`);
            return (
              <li key={stop.company}>
                <p className="city-dates">
                  {stop.dates}
                  {index === 0 && <strong> · Current</strong>}
                </p>
                <h4>
                  {stop.company}
                  {stop.companyNote && ` ${stop.companyNote}`}
                </h4>
                <p className="city-role">{stop.role}</p>
                <p>{stop.home.points[0]}</p>
              </li>
            );
          })}
        </ol>
        <a href="#experience" data-city-section>
          Read experience <Icon name="arrow-down-right" />
        </a>
      </section>
      <section
        id="city-panel-arcade"
        data-city-panel="arcade"
        aria-labelledby="city-heading-arcade"
        hidden
      >
        <p className="sr-only">{ricochet.summary}</p>
        <div id="arcade-panel" className="ricochet" />
      </section>
      <section
        id="city-panel-contact"
        data-city-panel="contact"
        aria-labelledby="city-heading-contact"
        hidden
      >
        <h3 id="city-heading-contact" tabIndex={-1}>
          Say hello
        </h3>
        <p>Based in {profile.location}.</p>
        <a className="city-primary-link" href={`mailto:${profile.email}`}>
          Email Ankit <Icon name="arrow-up-right" />
        </a>
        <div className="city-contact-links">
          <a href={profile.github} target="_blank" rel="noopener noreferrer">
            <Icon name="github" /> GitHub
          </a>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
            <Icon name="linkedin" /> LinkedIn
          </a>
          <a href={profile.resume} target="_blank" rel="noopener">
            View résumé <Icon name="arrow-up-right" />
          </a>
        </div>
      </section>
      <div className="city-panel-navigation">
        <a id="arcade-full" href={ricochet.href} hidden>
          Play full {ricochet.name}
        </a>
        <button type="button" id="city-back">
          Back to city <Icon name="arrow-right" />
        </button>
      </div>
    </aside>
  );
}
