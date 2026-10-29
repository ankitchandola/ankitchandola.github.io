import { scope } from '../content/profile';
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
            At Green Fortune Technologies, I work on the sales CRM, operations
            platform, a shared React package and the public website. That
            includes frontend development, backend services and staging
            deployment.
          </p>
          <span className="current-role">
            Full-stack developer · 2025 — present
          </span>
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
