import Board from '../play/Board';
import { describe } from '../play/board-path';
import { arcadeLevel } from './city-scenes/arcade-state';

export default function ArcadeBoard() {
  return (
    <div id="arcade-flat" className="arcade-flat ricochet" hidden>
      <p className="sr-only">{describe(arcadeLevel)}</p>
      <Board
        level={arcadeLevel}
        mirrors={arcadeLevel.mirrors}
        shot={null}
        shotCount={0}
      />
    </div>
  );
}
