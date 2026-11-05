interface CityArcadeSnapshot {
  readonly session: number;
  readonly active: boolean;
  readonly opened: boolean;
}

const initial: CityArcadeSnapshot = {
  session: 0,
  active: false,
  opened: false,
};
let snapshot = initial;
const listeners = new Set<() => void>();
const set = (next: CityArcadeSnapshot) => {
  snapshot = next;
  listeners.forEach((listener) => listener());
};

export const cityArcade = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => snapshot,
  getServerSnapshot: () => initial,
  open() {
    set({ session: snapshot.session + 1, active: false, opened: true });
  },
  close() {
    set({ ...snapshot, active: false, opened: false });
  },
  setActive(active: boolean) {
    if (snapshot.active !== active) set({ ...snapshot, active });
  },
};
