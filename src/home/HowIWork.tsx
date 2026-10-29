export default function HowIWork() {
  return (
    <section className="about-section" id="about">
      <div className="wrap about-grid">
        <div>
          <p className="eyebrow">02 / HOW I WORK</p>
          <h2>
            What I
            <br />
            <span>work on.</span>
          </h2>
        </div>
        <div className="about-copy">
          <p>
            My work covers forms, shared UI components, APIs and the data behind
            them.
          </p>
          <p>
            Much of it comes down to specific questions about state, ownership
            and failure. The engineering decisions below show three of them.
          </p>
          <div className="capabilities">
            <div>
              <span>01</span>
              <b>Frontend</b>
              <p>
                React, Next.js, TypeScript
                <br />
                Forms, state and reusable UI
              </p>
              <p className="capability-evidence">Seen in</p>
              <ul className="capability-links">
                <li>
                  <a href="/work/visualization">The shared React package</a>
                </li>
                <li>
                  <a href="/work/recon-desk">Recon Desk</a>
                </li>
              </ul>
            </div>
            <div>
              <span>02</span>
              <b>Backend</b>
              <p>
                Node.js, PostgreSQL, Fastify
                <br />
                APIs, permissions and testing
              </p>
              <p className="capability-evidence">Seen in</p>
              <ul className="capability-links">
                <li>
                  <a href="/work/operations">Offline survey saves</a>
                </li>
                <li>
                  <a href="/work/sales-crm">The CRM’s Python backend</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
