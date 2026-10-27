import type {
  ProjectChallenge,
  ProjectDemonstration,
  ProjectImage,
  Scope,
} from '../src/content/types.ts';

export function checkContentContracts(
  acceptImage: (image: ProjectImage) => void,
  acceptChallenge: (challenge: ProjectChallenge) => void,
  acceptDemonstration: (demo: ProjectDemonstration) => void,
  acceptScope: (scope: Scope) => void,
) {
  acceptImage(['screen', 'View', 'Caption']);
  // @ts-expect-error A screenshot needs its accessible caption.
  acceptImage(['screen', 'View']);
  acceptChallenge(['Title', 'Problem', 'Decision', 'Trade-off']);
  // @ts-expect-error A challenge must include its trade-off.
  acceptChallenge(['Title', 'Problem', 'Decision']);
  acceptDemonstration({
    title: 'Review',
    intro: 'Try a decision',
    boundary: 'Synthetic sample',
    labels: { confirm: 'Confirm' },
  });
  // @ts-expect-error An explanation must state its simulation boundary.
  acceptDemonstration({ title: 'Review', intro: 'Try a decision', labels: {} });
  acceptScope(['01', 'Scope', 'Detail']);
  // @ts-expect-error Scope numbers do not replace their explanatory detail.
  acceptScope(['01', 'Scope']);
}
