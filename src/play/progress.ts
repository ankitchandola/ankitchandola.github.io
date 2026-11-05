import type { PresetName, SavedMode } from './model.ts';
import { isPresetName } from './model.ts';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
type OptionalStorage = StorageLike | null | undefined;
export interface Preferences {
  mode?: SavedMode;
  preset?: PresetName;
  dailySolved?: string;
  presentation?: '3d' | 'flat';
}

export const STORAGE_KEY = 'ricochet-solved';
function read(storage: OptionalStorage): string[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((id: unknown): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}
export function loadSolved(
  storage: OptionalStorage,
  knownIds: readonly string[],
): string[] {
  const known = new Set(knownIds);
  return [...new Set(read(storage))].filter((id) => known.has(id));
}
// Merges with what is already stored, so a save from an unloaded state never erases progress.
export function saveSolved(
  storage: OptionalStorage,
  ids: readonly string[],
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify([...new Set([...read(storage), ...ids])]),
    );
    return true;
  } catch {
    return false;
  }
}

export const PREFS_KEY = 'ricochet-prefs';
const DATE = /^\d{4}-\d{2}-\d{2}$/;
function readPrefs(storage: OptionalStorage): Preferences {
  if (!storage) return {};
  try {
    const raw = storage.getItem(PREFS_KEY);
    if (raw === null) return {};
    const value: unknown = JSON.parse(raw);
    if (
      typeof value !== 'object' ||
      value === null ||
      !('v' in value) ||
      value.v !== 1
    )
      return {};
    const prefs: Preferences = {};
    if (
      'mode' in value &&
      (value.mode === 'campaign' ||
        value.mode === 'random' ||
        value.mode === 'daily')
    )
      prefs.mode = value.mode;
    if ('preset' in value && isPresetName(value.preset))
      prefs.preset = value.preset;
    if (
      'dailySolved' in value &&
      typeof value.dailySolved === 'string' &&
      DATE.test(value.dailySolved)
    )
      prefs.dailySolved = value.dailySolved;
    if (
      'presentation' in value &&
      (value.presentation === '3d' || value.presentation === 'flat')
    )
      prefs.presentation = value.presentation;
    return prefs;
  } catch {
    return {};
  }
}
// Saved data is untrusted: each field is kept only if valid, and nothing here is needed to play.
export const loadPrefs = (storage: OptionalStorage): Preferences =>
  readPrefs(storage);
export function savePrefs(
  storage: OptionalStorage,
  patch: Preferences,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(
      PREFS_KEY,
      JSON.stringify({ ...readPrefs(storage), ...patch, v: 1 }),
    );
    return true;
  } catch {
    return false;
  }
}
