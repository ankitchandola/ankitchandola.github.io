export const cityDestinations = [
  {
    id: 'studio',
    name: 'Studio',
    purpose: 'Work',
    status: 'active',
    source: 'projects',
  },
  {
    id: 'journey',
    name: 'Journey',
    purpose: 'Experience',
    status: 'active',
    source: 'experience',
  },
  {
    id: 'arcade',
    name: 'Arcade',
    purpose: 'Puzzle',
    status: 'active',
    source: 'ricochet',
  },
  {
    id: 'contact',
    name: 'Say hello',
    purpose: 'Contact',
    status: 'active',
    source: 'profile',
  },
] as const;

export type CityDestinationId = (typeof cityDestinations)[number]['id'];

export function isCityDestination(
  value: string | undefined,
): value is CityDestinationId {
  return cityDestinations.some(({ id }) => id === value);
}

export const cityFutureSpaces = [
  { id: 'future-a', name: 'Future space', status: 'reserved' },
  { id: 'future-b', name: 'Future space', status: 'reserved' },
] as const;

// Homepage employment is newest first; the city deliberately reads oldest first.
export const cityExperienceOrder = [2, 1, 0] as const;
