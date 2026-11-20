import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { validDate } from './lib/content-policy.mjs';

const metadata = z.object({
  title: z.string().min(1),
  description: z.string().trim().min(1),
  seoTitle: z.string().min(1),
  primaryIntent: z.string().min(1),
});
const date = z
  .string()
  .refine(validDate, 'Use a real calendar date, YYYY-MM-DD.');
const services = defineCollection({
  loader: glob({ base: './src/content/services', pattern: '*.md' }),
  schema: metadata.extend({ order: z.number(), shortTitle: z.string() }),
});
const writing = defineCollection({
  loader: glob({ base: './src/content/writing', pattern: '*.md' }),
  schema: metadata.extend({
    author: z.literal('Matthew Oldach').default('Matthew Oldach'),
    publishedAt: date,
    modifiedAt: date.optional(),
    draft: z.boolean().default(false),
    topics: z.array(z.string()).default([]),
    sourceUrl: z.url(),
    externalUrl: z.url().optional(),
    featuredOrder: z.number().optional(),
  }),
});
export const collections = { services, writing };
