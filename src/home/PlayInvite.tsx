import { Icon } from './icons';
import { ricochet } from '../content/ricochet';
export default function PlayInvite() {
  return (
    <aside aria-labelledby="play-invite-title" className="play-invite wrap">
      <svg
        aria-hidden="true"
        className="play-invite-art"
        focusable="false"
        viewBox="0 0 80 80"
      >
        <path className="play-invite-beam" d="M20 22H56V60" />
        <circle className="play-invite-source" cx="20" cy="22" r="7" />
        <path className="play-invite-mirror" d="M46 12 66 32" />
        <circle className="play-invite-target" cx="56" cy="60" r="8" />
      </svg>
      <div>
        <p className="play-invite-label">SIDE PROJECT · PUZZLE</p>
        <h2 id="play-invite-title">Taking a break?</h2>
        <p>{ricochet.invitation}</p>
      </div>
      <a className="play-invite-link" href={ricochet.href}>
        Play Ricochet <Icon name="arrow-right" />
      </a>
    </aside>
  );
}
