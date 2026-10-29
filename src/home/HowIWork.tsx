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
            Much of it comes down to specific questions: what happens to a
            survey when the connection drops? Does a connected browser mean the
            customer answered? The project pages explain those decisions.
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
            </div>
            <div>
              <span>02</span>
              <b>Backend</b>
              <p>
                Node.js, PostgreSQL, Fastify
                <br />
                APIs, permissions and testing
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
