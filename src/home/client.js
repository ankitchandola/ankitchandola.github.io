import './interactions.js';
import { mountSiteSearch } from '../components/site-search';

document.querySelectorAll('[data-site-search]').forEach(mountSiteSearch);
const world = document.getElementById('hero-world');
if (world) {
  const controls = document.querySelector('.world-landmarks');
  const back = document.querySelector('[data-world-back]');
  const selectLandmark = (slug) => {
    controls.querySelectorAll('[data-landmark]').forEach((button) => {
      const selected = button.dataset.landmark === slug;
      button.setAttribute('aria-pressed', String(selected));
      if (selected)
        document.getElementById('world-status').textContent =
          button.textContent + ' selected';
    });
    document.querySelectorAll('[data-landmark-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.landmarkPanel !== slug;
    });
    document.querySelector('[data-world-overview]').hidden =
      slug !== 'overview';
    back.hidden = slug === 'overview';
    document.getElementById('world-hint').textContent =
      slug === 'overview' ? 'Select a building' : 'Explore another project';
    if (slug === 'overview')
      document.getElementById('world-status').textContent = 'City overview';
    world.dataset.selected = slug;
  };
  back.addEventListener('click', () => {
    selectLandmark('overview');
    controls.querySelector('button').focus();
  });
  controls.hidden = false;
  controls
    .querySelectorAll('[data-landmark]')
    .forEach((button) =>
      button.addEventListener('click', () =>
        selectLandmark(button.dataset.landmark),
      ),
    );
  const loadWorld = new IntersectionObserver(
    ([entry], observer) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      import('./project-world')
        .then(({ mountProjectWorld }) =>
          mountProjectWorld(world, selectLandmark),
        )
        .catch((error) =>
          console.warn(
            '3D world could not load. Project links and static artwork remain available.',
            error,
          ),
        );
    },
    { rootMargin: '100px' },
  );
  loadWorld.observe(world);
}
document.querySelectorAll('.evidence-gallery').forEach((gallery) => {
  gallery.querySelectorAll('[data-screen]').forEach((button) =>
    button.addEventListener('click', () => {
      gallery
        .querySelectorAll('[data-screen]')
        .forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      gallery
        .querySelectorAll('[data-panel]')
        .forEach(
          (panel) =>
            (panel.hidden = panel.dataset.panel !== button.dataset.screen),
        );
    }),
  );
});
const motionOff =
  matchMedia('(prefers-reduced-motion: reduce)').matches ||
  (() => {
    try {
      return localStorage.getItem('ankit-motion-paused') === 'true';
    } catch {
      return false;
    }
  })();
if (!motionOff && 'IntersectionObserver' in window) {
  // Classes are removed after the entrance so hover and sticky styles on the children apply normally again.
  const reveal = new IntersectionObserver(
    (entries) =>
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        reveal.unobserve(target);
        target.classList.add('revealed');
        setTimeout(
          () => target.classList.remove('reveal', 'revealed'),
          520 + target.children.length * 70,
        );
      }),
    { rootMargin: '0px 0px -10% 0px' },
  );
  document
    .querySelectorAll('.section-intro,.project-card,.about-grid,.decision-list')
    .forEach((group) => {
      if (group.getBoundingClientRect().top < innerHeight) return;
      [...group.children].forEach((child, i) =>
        child.style.setProperty('--reveal-delay', i * 70 + 'ms'),
      );
      group.classList.add('reveal');
      reveal.observe(group);
    });
}

// Hover previews are temporary; click and keyboard retain native details behavior.
// Opening waits for hover intent and closes any other preview, so the list shifting under a moving pointer can't cascade.
const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
let previewing = null,
  intent = 0;
const closePreview = () => {
  if (previewing) {
    previewing.open = false;
    previewing = null;
  }
};
document.querySelectorAll('.decision').forEach((detail) => {
  detail.addEventListener('pointerenter', () => {
    if (!finePointer.matches || detail.open) return;
    clearTimeout(intent);
    intent = setTimeout(() => {
      if (detail.open || !detail.matches(':hover')) return;
      closePreview();
      previewing = detail;
      detail.open = true;
    }, 150);
  });
  detail.addEventListener('pointerleave', () => {
    clearTimeout(intent);
    if (previewing === detail && !detail.contains(document.activeElement))
      closePreview();
  });
  detail.querySelector('summary').addEventListener('click', (event) => {
    if (previewing === detail) {
      event.preventDefault();
      previewing = null;
    }
  });
  detail.addEventListener('focusout', (event) => {
    if (
      previewing === detail &&
      !detail.contains(event.relatedTarget) &&
      !detail.matches(':hover')
    )
      closePreview();
  });
});
