import type { Profile, Scope } from './types.ts';

export const profile: Profile = {
  name: 'Ankit Chandola',
  location: 'Delhi, India',
  email: 'chandolaankit027@gmail.com',
  github: 'https://github.com/ankitchandola',
  linkedin: 'https://www.linkedin.com/in/ankit-chandola-b53a54187/',
  resume: '/assets/docs/ankit-chandola-resume.pdf',
};
export const scope: readonly Scope[] = [
  ['01', 'CRM & operations', 'Frontend + backend'],
  ['02', 'Shared React package', 'Two applications'],
  ['03', 'Website & CMS', 'Staging infrastructure'],
];
// Evaluated at build time for prerendered pages, so the footer year updates on the next deploy.
export const year = new Date().getFullYear();
