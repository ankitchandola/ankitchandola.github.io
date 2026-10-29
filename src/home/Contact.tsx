import { contactPrompt, profile } from '../content/profile';
import { Icon } from './icons';
export default function Contact() {
  return (
    <section className="contact-section" id="contact">
      <div className="wrap">
        <p className="eyebrow">05 / START WITH A HELLO</p>
        <div className="contact-main">
          <h2>
            Want to
            <br />
            <span>talk?</span>
          </h2>
          <a
            aria-label="Email Ankit"
            className="contact-orb"
            href={'mailto:' + profile.email}
          >
            <Icon name="arrow-up-right" />
          </a>
        </div>
        <p className="contact-prompt">{contactPrompt}</p>
        <div className="contact-bottom">
          <div className="contact-email-row">
            <a className="email" href={'mailto:' + profile.email}>
              {profile.email} <Icon name="arrow-up-right" />
            </a>
            <button
              id="copy-email"
              className="copy-email"
              type="button"
              data-email={profile.email}
              hidden
            >
              <Icon name="copy" /> Copy email
            </button>
            <span
              id="copy-email-status"
              className="copy-status"
              role="status"
            />
          </div>
          <div>
            <a href={profile.github} rel="noopener noreferrer" target="_blank">
              <Icon name="github" />
              GitHub{' '}
            </a>
            <a
              href={profile.linkedin}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icon name="linkedin" />
              LinkedIn{' '}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
