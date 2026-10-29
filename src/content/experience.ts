import type { Experience } from './types.ts';

// Each role carries the homepage card (`home`) and the shorter lite entry (`lite`); the two editions word them differently.
export const experience: readonly Experience[] = [
  {
    dates: '2025 — PRESENT',
    company: 'Green Fortune Technologies',
    role: 'Full-stack developer',
    home: {
      tone: 'green',
      headline: ['Operations software', 'and sales tools.'],
      points: [
        'Operations workflows and offline survey functionality across frontend and backend',
        'Custom Vue and Python CRM workflows, browser telephony and quotations',
        'Shared React visualization package used by two applications',
        'Public brand website, Strapi CMS and AWS staging deployment',
      ],
      tags: ['React / Next.js', 'Node.js', 'PostgreSQL'],
    },
    lite: {
      summary:
        'Owned most frontend development for an internal operations platform and implemented its offline functionality across frontend and backend. Owned most company-specific Vue and Python development for an existing Frappe CRM, including browser calling and quotation workflows. Created a shared React visualization package used by operations and customer applications. Implemented the public brand website and Strapi CMS, including their shared AWS staging environment.',
      tags: ['React / TypeScript', 'Fastify', 'PostgreSQL', 'Strapi / AWS'],
    },
  },
  {
    dates: '2024 — 2025',
    company: 'Hippo Homes',
    companyNote: 'by Dalmia',
    role: 'Full-stack developer',
    home: {
      tone: 'peach',
      headline: ['Retail apps,', 'in store and online.'],
      points: [
        'POS, kiosk, manual-order and e-commerce applications',
        'Negotiation-based order workflows and customer creation',
        'REST APIs, Redis caching and database optimisation',
      ],
      tags: ['Next.js', 'Node.js', 'PostgreSQL / Redis'],
    },
    lite: {
      summary:
        'Built across POS, kiosk, manual-order and e-commerce applications. Worked on negotiation workflows, customer creation, APIs and backend performance with Redis and database optimisation.',
      tags: ['Next.js', 'Node.js', 'PostgreSQL', 'Redis'],
    },
  },
  {
    dates: '2021 — 2024',
    company: 'Nethues',
    liteCompany: 'Nethues Technologies',
    role: 'Web application development',
    home: {
      tone: 'cream',
      headline: ['PHP to Next.js,', 'ticketing and payments.'],
      points: [
        'Legacy PHP application migration to Next.js',
        'Data-driven interfaces and shared UI components',
        'Event ticketing, Stripe payments and push notifications',
      ],
      outcome:
        '~40% performance improvement from the PHP-to-Next.js migration.',
      tags: ['Next.js / React Query', 'Stripe', 'TurboRepo'],
    },
    lite: {
      summary:
        'Migrated a legacy PHP application to Next.js. Built data-driven interfaces and an events and ticketing platform with Stripe, shared UI and push notifications.',
      outcome: [
        '~40% performance improvement',
        'from the PHP-to-Next.js migration.',
      ],
      tags: ['Next.js', 'React Query', 'Stripe', 'TurboRepo'],
    },
  },
];
