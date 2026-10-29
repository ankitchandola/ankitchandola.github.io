import type { CSSProperties } from 'react';
import { profile } from '../content/profile';
import { experience } from '../content/experience';
import { Icon } from './icons';
export default function Career() {
  return (
    <section className="experience-section wrap" id="experience">
      <div className="section-intro">
        <p className="eyebrow">04 / TODAY &amp; YESTERDAY</p>
        <h2>
          Where I’ve
          <br />
          <span>worked.</span>
        </h2>
        <p className="section-description">
          My roles at Green Fortune Technologies, Hippo Homes and Nethues, from
          2021 to the present.
        </p>
      </div>
      <div className="career-stack">
        {experience.map(({ dates, company, companyNote, role, home: r }, i) => {
          const style: CSSProperties & { '--index': number } = { '--index': i };
          return (
            <article
              className={'career-panel ' + r.tone + '-career'}
              style={style}
              key={dates}
            >
              <div className="career-heading">
                <span className="career-date">{dates}</span>
                <h3>
                  {company}
                  {companyNote && (
                    <>
                      {' '}
                      <small>{companyNote}</small>
                    </>
                  )}
                </h3>
                <span className="career-role">{role} </span>
              </div>
              <div className="career-body">
                <div aria-hidden="true" className="career-number">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <h4>
                    {r.headline.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </h4>
                  <ul>
                    {r.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                  {r.outcome && <p className="career-outcome">{r.outcome}</p>}
                  <div className="tags">
                    {r.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <a
        className="text-link resume-bottom"
        href={profile.resume}
        rel="noopener"
        target="_blank"
      >
        View résumé <Icon name="arrow-up-right" />
      </a>
    </section>
  );
}
