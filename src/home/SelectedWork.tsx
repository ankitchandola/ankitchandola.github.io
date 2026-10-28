import projects from '../content/projects';
import { LinkArrow } from './icons';

export default function SelectedWork() {
  return (
    <section className="work-section wrap" id="work">
      <div className="section-intro">
        <p className="eyebrow">01 / SELECTED WORK</p>
        <h2>
          Selected work.
          <br />
          <span>In practice.</span>
        </h2>
        <p className="section-description">
          Tools and systems I’ve worked on, with the implementation, ownership
          and decisions behind each one.
        </p>
      </div>
      <div className="project-collection">
        {projects.map((project) => {
          const image = project.images[0];
          return (
            <article
              className={
                'project-card' + (project.home ? ' project-featured' : '')
              }
              id={project.home?.anchor ?? project.slug}
              key={project.slug}
            >
              {image && (
                <a
                  className="project-index-image"
                  href={'/work/' + project.slug}
                  aria-label={'Explore ' + project.name}
                >
                  <img
                    src={'/assets/projects/' + image[0] + '.png'}
                    alt={image[2]}
                    loading="lazy"
                  />
                </a>
              )}
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
