import projects from '../content/projects';
import { LinkArrow } from './icons';
const decisions = projects.flatMap((p) =>
  p.decision ? [{ ...p, decision: p.decision }] : [],
);
export default function Decisions() {
  return (
    <section className="decisions-section wrap" id="decisions">
      <div className="section-intro">
        <p className="eyebrow">03 / ENGINEERING DECISIONS</p>
        <h2>
          A few engineering
          <br />
          <span>decisions.</span>
        </h2>
        <p className="section-description">
          How I handle duplicate records, offline saves and the split between a
          shared component and its host application.
        </p>
      </div>
      <div className="decision-list">
        {decisions.map(({ slug, home, decision: d }, i) => (
          <details className="decision" key={slug}>
            <summary>
              <span className="decision-number">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>
                <span className="eyebrow">{d.label.toUpperCase()}</span>
                <span className="decision-title">{d.title}</span>
              </span>
              <span className="decision-plus" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="decision-content">
              <div>
                <h3>Implementation</h3>
                <p>{d.implementation}</p>
              </div>
              <div>
                <h3>Limits</h3>
                <p>{d.boundary}</p>
              </div>
              <a className="text-link" href={'/#' + (home?.anchor ?? slug)}>
                Explore the project <LinkArrow />
              </a>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
