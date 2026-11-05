import { useEffect, useState } from 'react';
import Board from './Board';
import { describe } from './board-path';
import { createGame } from './game.ts';
import {
  Controls,
  Heading,
  Modes,
  Pickers,
  Status,
  useGame,
  useHeadingFocus,
} from './GameParts';
import './play.css';

export default function Ricochet() {
  const [game] = useState(() => createGame({ urls: true }));
  const { state, shotCount } = useGame(game);
  const heading = useHeadingFocus(game);
  useEffect(() => game.start(), [game]);
  const { level } = state;

  return (
    <section className="case-page shell ricochet">
      <div className="case-page-heading">
        <span className="kicker">SIDE PROJECT / PUZZLE</span>
        <h1>Ricochet</h1>
        <p>Turn the mirrors so the beam bounces into the target.</p>
      </div>
      <noscript>
        <p className="ricochet-noscript">
          The puzzle needs JavaScript. Lesson 1 is shown below as a preview.
        </p>
      </noscript>
      <div className="ricochet-layout">
        <div className="ricochet-stage">
          <Modes game={game} />
          <Heading game={game} headingRef={heading} />
          <p className="sr-only">{describe(level)}</p>
          <Board
            level={level}
            mirrors={state.mirrors}
            shot={state.shot}
            shotCount={shotCount}
            onRotate={(key) => game.rotate(key)}
            onFire={() => game.fire()}
          />
        </div>
        <div className="ricochet-panel">
          <Controls game={game} />
          <Status game={game} />
          <Pickers game={game} />
          <div className="ricochet-guide">
            <h2>How to play</h2>
            <ol>
              <li>Tap a mirror to turn it a quarter turn.</li>
              <li>
                Press Fire, or tap the beam’s starting arrow, to send the beam.
              </li>
              <li>
                Reach the target. Walls stop the beam, edges let it escape, and
                some layouts send it round in circles.
              </li>
              <li>
                Undo takes back your last turn. Reset starts the puzzle again.
              </li>
              <li>
                Random builds a fresh puzzle at the difficulty you choose. Today
                is the same puzzle for everyone, changing at midnight UTC.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
