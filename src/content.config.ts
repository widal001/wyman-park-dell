import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { pageSchema, eventSchema } from './content/schemas';

// Field schemas live in ./content/schemas.ts (free of astro:content) so the
// CMS-config validator can import them too. Here we just bind them to loaders.

const pages = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/pages' }),
  schema: pageSchema,
});

const events_collection = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/events' }),
  schema: eventSchema,
});

export const collections = { pages, events: events_collection };
