export type ProjectImage = readonly [
  file: string,
  label: string,
  caption: string,
];
export type ProjectSection = readonly [title: string, body: string];
export type ProjectChallenge = readonly [
  title: string,
  problem: string,
  decision: string,
  tradeoff: string,
];
export type ProjectFact = readonly [
  value: string,
  label: string,
  caveat: string,
];
export type ProjectHighlight = readonly [
  title: string,
  body: string,
  icon: string,
];
export interface ProjectHome {
  anchor: string;
  label: string;
  tagline: string;
  highlights: readonly ProjectHighlight[];
  notes: readonly ProjectSection[];
}
export interface ProjectDecision {
  label: string;
  title: string;
  implementation: string;
  boundary: string;
}
export interface ProjectDemonstration {
  title: string;
  intro: string;
  boundary: string;
  labels: Readonly<Partial<Record<string, string>>>;
}
export interface Project {
  demonstration?: ProjectDemonstration;
  detailHeadings?: {
    problem: string;
    contribution: string;
    engineering: string;
    result: string;
    scope: string;
  };
  slug: string;
  name: string;
  kind: string;
  cover: {
    src: string;
    alt: string;
  };
  summary: string;
  indexSummary?: string;
  contribution?: string;
  demoLink?: string;
  tags: readonly string[];
  ownership: string;
  sections: readonly ProjectSection[];
  images: readonly ProjectImage[];
  url?: string;
  home?: ProjectHome;
  decision?: ProjectDecision;
  galleryLabel?: string;
  problem?: string;
  challenges?: readonly ProjectChallenge[];
  facts?: readonly ProjectFact[];
  limits?: string;
  context?: readonly string[];
  result?: string;
}
export interface Profile {
  name: string;
  location: string;
  email: string;
  github: string;
  linkedin: string;
  resume: string;
}
export type Scope = readonly [number: string, label: string, detail: string];
export interface Experience {
  dates: string;
  company: string;
  companyNote?: string;
  liteCompany?: string;
  role: string;
  home: {
    tone: 'green' | 'peach' | 'cream';
    headline: readonly [string, string];
    points: readonly string[];
    outcome?: string;
    tags: readonly string[];
  };
  lite: {
    summary: string;
    outcome?: readonly [value: string, context: string];
    tags: readonly string[];
  };
}
