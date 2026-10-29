import { LucideSvg } from '../components/ThemeToggle';
import { profile } from '../content/profile';
import { Icon } from './icons';
import {
  CityDestinationControls,
  CityDestinationPanels,
} from './CityDestinations';
import ArcadeBoard from './ArcadeBoard';

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
          Web apps,
          <br />
          <span>front to back.</span>
        </p>
        <p className="hero-description">
          I’m Ankit, a full-stack developer in Delhi. I build operations
          software, CRM workflows and browser tools, including surveys that work
          offline and a tool for comparing spreadsheets.
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
            BASED IN {profile.location.toUpperCase()}
          </span>
          <a className="hero-lite-link" href="/lite">
            Lite version <Icon name="arrow-up-right" />
          </a>
        </div>
      </div>
      <div className="hero-city">
        <div className="city-stage" aria-hidden="true">
          <img
            className="city-poster"
            src="/assets/city-neighbourhood.png"
            alt=""
            width="1236"
            height="1030"
          />
          <canvas id="hero-city" />
        </div>
        <button
          id="city-open"
          className="city-open"
          type="button"
          aria-haspopup="dialog"
          aria-controls="city-dialog"
          hidden
        >
          <span>
            Explore the city <Icon name="maximize" />
          </span>
        </button>
        <dialog
          id="city-dialog"
          className="city-dialog"
          aria-labelledby="city-title"
        >
          <header className="city-dialog-header">
            <div>
              <h2 id="city-title">Explore the city</h2>
              <p>A miniature map of my portfolio.</p>
            </div>
            <button id="city-close" type="button">
              Close <Icon name="x" />
            </button>
          </header>
          <CityDestinationControls />
          <div className="city-dialog-body">
            <div id="city-dialog-stage" className="city-dialog-stage">
              <img
                className="city-poster"
                src="/assets/city-neighbourhood.png"
                alt="A miniature neighbourhood with a studio, office, arcade, café and two future construction plots."
                width="1236"
                height="1030"
              />
              <span
                id="city-label"
                className="city-label"
                aria-hidden="true"
                hidden
              />
              <ArcadeBoard />
              <div id="city-fade" className="city-fade" aria-hidden="true" />
            </div>
            <CityDestinationPanels />
          </div>
          <div className="city-dialog-footer">
            <p id="city-hint">Drag to rotate. Pinch or scroll to zoom.</p>
            <p id="city-keyboard-help" className="sr-only">
              Focus the city view. Arrow keys rotate, plus and minus zoom, Home
              returns to the overview. Escape closes the whole explorer. Use the
              destination buttons to read without operating the city.
            </p>
            <p id="city-status" role="status" className="sr-only" />
            <div
              className="city-controls"
              role="group"
              aria-label="City view controls"
            >
              <button
                type="button"
                data-city-action="left"
                aria-label="Rotate left"
              >
                <Icon name="rotate-ccw" />
              </button>
              <button
                type="button"
                data-city-action="right"
                aria-label="Rotate right"
              >
                <Icon name="rotate-cw" />
              </button>
              <button
                type="button"
                data-city-action="out"
                aria-label="Zoom out"
              >
                <Icon name="minus" />
              </button>
              <span id="city-zoom" aria-label="Zoom level">
                100%
              </span>
              <button type="button" data-city-action="in" aria-label="Zoom in">
                <Icon name="plus" />
              </button>
              <button type="button" data-city-action="reset">
                Reset view
              </button>
            </div>
            <p className="city-legend">Construction plots: Future space.</p>
          </div>
        </dialog>
      </div>
    </section>
  );
}
