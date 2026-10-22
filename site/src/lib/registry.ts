import { getCollection } from 'astro:content';
import { latestFirst } from './content-policy.mjs';

export const chapters = [
  { label: 'Start', href: '/' },
  { label: 'Services', href: '/services/' },
  { label: 'Work', href: '/work/' },
  { label: 'Writing', href: '/writing/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
] as const;

export const pages = {
  '/': {
    title: 'Practical AI. Less busywork.',
    seoTitle: 'AI Consulting for Small Businesses | Matthew Oldach',
    description:
      'Practical AI consulting, workflow automation and agent implementation for small businesses, delivered remotely by Matthew Oldach.',
    primaryIntent:
      'Introduce Matthew and orient small-business consulting clients',
  },
  '/services/': {
    title: 'A useful place to start.',
    seoTitle: 'AI Assessment, Implementation & Training | Matthew Oldach',
    description:
      'Compare three ways to work together: find worthwhile AI opportunities, build a focused workflow, and help your team adopt it.',
    primaryIntent: 'Compare consulting engagements',
  },
  '/writing/': {
    title: 'Notes from the work.',
    seoTitle: 'Writing on Software, Data & AI | Matthew Oldach',
    description:
      'Original technical writing on visualization, reproducible work, Fitbit gamification, UMAP and software experiments.',
    primaryIntent: 'Browse Matthew’s technical writing',
  },
  '/work/': {
    title: 'Work you can inspect.',
    seoTitle: 'Selected Software & Visualization Work | Matthew Oldach',
    description:
      'Explore public project evidence from PuttPulse, Shiny-filteRs and Hinuhinu, with their actual scope and source links.',
    primaryIntent: 'Inspect delivery and engineering evidence',
  },
  '/about/': {
    title: 'Matthew, in person.',
    seoTitle: 'About Matthew Oldach | AI & Software Consultant',
    description:
      'Meet Matthew Oldach: a consultant working across software, data and practical automation, available for remote collaboration.',
    primaryIntent: 'Understand Matthew’s background and approach',
  },
  '/experience/': {
    title: 'Engineering judgment, made visible.',
    seoTitle: 'Engineering Experience & Public Work | Matthew Oldach',
    description:
      'Explore Matthew Oldach’s public software, data visualization, reproducibility and communication work.',
    primaryIntent: 'Find evidence for engineering and full-time opportunities',
  },
  '/contact/': {
    title: 'What could work better?',
    seoTitle: 'Contact Matthew Oldach | Remote AI Consulting',
    description:
      'Discuss a repetitive workflow, a focused implementation or team adoption with Matthew Oldach. International remote enquiries welcome.',
    primaryIntent: 'Make a consulting or hiring enquiry',
  },
  '/privacy/': {
    title: 'Your information.',
    seoTitle: 'Privacy | Matthew Oldach',
    description:
      'How this static website handles contact enquiries, links to external services, and visitor information.',
    primaryIntent: 'Understand contact-data and website handling',
  },
};

export async function serviceEntries() {
  return (await getCollection('services')).sort(
    (a, b) => a.data.order - b.data.order,
  );
}
export async function writingEntries() {
  return latestFirst(await getCollection('writing'));
}
export function writingHref(
  entry: Awaited<ReturnType<typeof writingEntries>>[number],
) {
  return entry.data.externalUrl || `/writing/${entry.id}/`;
}
export async function publishedRoutes() {
  return [
    ...Object.keys(pages),
    ...(await serviceEntries()).map((entry) => `/services/${entry.id}/`),
    ...(await writingEntries())
      .filter((entry) => !entry.data.externalUrl)
      .map((entry) => `/writing/${entry.id}/`),
  ];
}
