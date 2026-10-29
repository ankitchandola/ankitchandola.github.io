import raw from '../../content/levels.json' with { type: 'json' };
import {
  parseLevel,
  rotate,
  trace,
  type Mirrors,
  type Shot,
} from '../../play/model.ts';
import { place } from '../../play/board-path.ts';

const first = raw[0];
if (!first)
  throw new Error('The city Arcade requires the first Ricochet lesson.');
export const arcadeLevel = parseLevel(first);
export interface ArcadeState {
  mirrors: Mirrors;
  shot: Shot | null;
}
export type ArcadeAction =
  { type: 'rotate'; key: string } | { type: 'fire' } | { type: 'reset' };
export const initialArcadeState = (): ArcadeState => ({
  mirrors: arcadeLevel.mirrors,
  shot: null,
});
export function updateArcade(
  state: ArcadeState,
  action: ArcadeAction,
): ArcadeState {
  switch (action.type) {
    case 'rotate':
      return { mirrors: rotate(state.mirrors, action.key), shot: null };
    case 'fire':
      return { ...state, shot: trace(arcadeLevel, state.mirrors) };
    case 'reset':
      return initialArcadeState();
  }
}
export function arcadeResult(shot: Shot | null): string {
  if (!shot) return 'Turn the mirror, then fire.';
  switch (shot.outcome) {
    case 'hit':
      return 'Hit the target. Try the full Ricochet puzzle next.';
    case 'blocked':
      return `Blocked by a wall at ${place(shot.end.x, shot.end.y)}. Turn the mirror and try again.`;
    case 'escaped':
      return 'The beam left the grid. Turn the mirror and try again.';
    case 'loop':
      return 'Loop: the beam would bounce forever. Turn the mirror and try again.';
  }
}
