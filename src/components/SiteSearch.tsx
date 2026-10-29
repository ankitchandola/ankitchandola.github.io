import { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import projects from '../content/projects';
import { mountSiteSearch } from './site-search';

const sections = [
  ['work', 'Selected work'],
  ['about', 'How I work'],
  ['decisions', 'Engineering decisions'],
  ['experience', 'Experience'],
  ['contact', 'Say hello'],
] as const;

export default function SiteSearch({ home = false }: { home?: boolean }) {
  const root = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (root.current) return mountSiteSearch(root.current);
  }, []);
  return (
    <details className="site-search" data-site-search="" ref={root}>
      <summary
        aria-label="Search portfolio"
        aria-keyshortcuts="Control+K Meta+K"
      >
        <Search size={22} />
      </summary>
      <div className="search-panel">
        <label className="search-field" hidden>
          Search projects and technologies
          <input
            type="search"
            placeholder="Try React, offline or CRM"
            autoComplete="off"
            maxLength={100}
          />
        </label>
        <p className="search-status" role="status">
          Explore projects
        </p>
        <ul className="search-results">
          {projects.map((project) => (
            <li
              key={project.slug}
              data-search-text={[
                project.name,
                project.kind,
                project.summary,
                project.ownership,
                ...project.tags,
              ].join(' ')}
            >
              <a href={'/work/' + project.slug}>
                <strong>{project.name}</strong>
                <span>{project.tags.join(' · ')}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="search-group">Jump to</p>
        <ul className="search-results search-sections">
          {sections.map(([id, label]) => (
            <li key={id} data-search-text={label}>
              <a href={(home || id === 'contact' ? '#' : '/#') + id}>
                <strong>{label}</strong>
              </a>
            </li>
          ))}
        </ul>
        <p className="search-empty" hidden>
          No matches. Try a technology or project name.
        </p>
        <a className="search-all" href="/#work">
          View all selected work
        </a>
        <p className="search-hint" hidden>
          Press Ctrl K or ⌘ K to open search from anywhere. Arrow keys move
          through the results.
        </p>
      </div>
    </details>
  );
}
