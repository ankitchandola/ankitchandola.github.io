import { scope } from '../content/profile';
import { LinkArrow } from './icons';
export default function CurrentWork() {
  return (
    <section className="current-work wrap" id="today">
      <p className="eyebrow">TODAY / FULL-STACK DEVELOPMENT</p>
      <div className="current-grid">
        <div>
          <h2>
            CRM, field work
            <br />
            <span>and the web.</span>
          </h2>
          <p>
            At Green Fortune Technologies, I work across frontend development,
            backend services and staging deployment.
          </p>
          <span className="current-role">
            Full-stack developer · 2025 — present
          </span>
          <nav className="start-here" aria-label="Start here">
            <span>Start here</span>
            <a href="/work/recon-desk">
              <span>
                <strong>Recon Desk</strong>
                <small>Built alone, end to end</small>
              </span>
              <LinkArrow />
            </a>
            <a href="/work/operations">
              <span>
                <strong>Offline surveys</strong>
                <small>Frontend and backend</small>
              </span>
              <LinkArrow />
            </a>
          </nav>
        </div>
        <div className="scope-numbers" aria-label="Current project scope">
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
