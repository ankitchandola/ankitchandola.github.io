import projects from '../content/projects';
import { LinkArrow } from './icons';

export default function SelectedWork() {
  return (
    <section className="work-section wrap" id="work">
      <div className="section-intro">
        <p className="eyebrow">01 / SELECTED WORK</p>
        <h2>
          Projects I’ve
          <br />
          <span>worked on.</span>
        </h2>
        <p className="section-description">
          A personal browser tool and four projects from my current role. Each
          page shows what I built, how it works and where my contribution stops.
        </p>
      </div>
      <div className="project-collection">
        {projects.map((project) => {
          return (
            <article
              className={
                'project-card' + (project.home ? ' project-featured' : '')
              }
              id={project.home?.anchor ?? project.slug}
              key={project.slug}
            >
              <a
                className="project-index-image"
                href={'/work/' + project.slug}
                aria-label={'Explore ' + project.name}
              >
                <img
                  src={project.cover.src}
                  alt={project.cover.alt}
                  width="960"
                  height="600"
                  loading="lazy"
                />
              </a>
              <div className="project-card-copy">
                <p className="project-kind-label">{project.kind}</p>
                <h3>{project.name}</h3>
                <p className="project-summary">
                  {project.indexSummary ?? project.summary}
                </p>
                <div className="tags">
                  {project.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <a
                  className="text-link"
                  href={
                    '/work/' +
                    project.slug +
                    (project.home ? '#comparison-demo' : '')
                  }
                >
                  {project.home ? 'Try the comparison demo' : 'Project details'}{' '}
                  <LinkArrow />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
