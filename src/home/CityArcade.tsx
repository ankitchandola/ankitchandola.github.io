import { useEffect, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import BoardView from '../play/BoardView';
import { describe } from '../play/board-path';
import { createGame } from '../play/game';
import {
  Controls,
  Heading,
  Modes,
  Pickers,
  Status,
  useGame,
  useHeadingFocus,
} from '../play/GameParts';
import { cityArcade } from './city-arcade';
import '../play/play.css';

function CityArcadeGame({
  active,
  stage,
  panel,
}: {
  active: boolean;
  stage: HTMLElement;
  panel: HTMLElement;
}) {
  const [game] = useState(() => createGame({ urls: false }));
  const { state } = useGame(game);
  const heading = useHeadingFocus(game);
  useEffect(() => game.start(), [game]);
  return (
    <>
      {createPortal(
        <>
          <p className="sr-only">{describe(state.level)}</p>
          <BoardView game={game} active={active} fill />
        </>,
        stage,
      )}
      {createPortal(
        <>
          <Modes game={game} />
          <Heading game={game} headingRef={heading} level="h4" />
          <Controls game={game} share={false} />
          <Status
            game={game}
            id="arcade-result"
            exit={<a href="/play">Open full page</a>}
          />
          <Pickers game={game} />
        </>,
        panel,
      )}
    </>
  );
}

function CityArcade({
  stage,
  panel,
}: {
  stage: HTMLElement;
  panel: HTMLElement;
}) {
  const { session, active, opened } = useSyncExternalStore(
    cityArcade.subscribe,
    cityArcade.getSnapshot,
    cityArcade.getServerSnapshot,
  );
  return opened ? (
    <CityArcadeGame key={session} active={active} stage={stage} panel={panel} />
  ) : null;
}

export function mountCityArcade(root: HTMLElement) {
  const stage = document.querySelector<HTMLElement>('#arcade-stage');
  const panel = document.querySelector<HTMLElement>('#arcade-panel');
  if (!stage || !panel) throw new Error('City Arcade markup is incomplete.');
  createRoot(root).render(<CityArcade stage={stage} panel={panel} />);
}
