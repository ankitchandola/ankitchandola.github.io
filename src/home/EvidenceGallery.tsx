import type { ProjectImage } from '../content/types.ts';
import { Icon } from './icons';
// Static markup: src/home/client.js switches panels without hydrating React.
export default function EvidenceGallery({
  images,
  label = 'Screenshot views',
}: {
  images: readonly ProjectImage[];
  label?: string;
}) {
  return (
    <div className="evidence-gallery">
      <div className="gallery-options" role="group" aria-label={label}>
        {images.map(([file, title], i) => (
          <button
            key={file}
            type="button"
            data-screen={i}
            aria-pressed={i === 0}
          >
            {title}
          </button>
        ))}
      </div>
      {images.map(([file, title, caption, width, height], i) => (
        <figure key={file} data-panel={i} hidden={i > 0}>
          <a
            href={'/assets/projects/' + file + '.png'}
            target="_blank"
            rel="noopener"
            tabIndex={-1}
            aria-hidden="true"
          >
            <img
              width={width}
              height={height}
              src={'/assets/projects/' + file + '.png'}
              loading="lazy"
              alt={caption}
            />
          </a>
          <figcaption>
            {caption}{' '}
            <span>
              <a
                href={'/assets/projects/' + file + '.png'}
                target="_blank"
                rel="noopener"
                aria-label={'Open full screenshot: ' + title}
              >
                Open full screenshot <Icon name="arrow-up-right" />
              </a>
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
