import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* ---------- Shared field schemas (mirror src/types/content.ts) ---------- */

const image = z.object({
  src: z.string(),
  alt: z.string().default(''),
  width: z.number().optional(),
  height: z.number().optional(),
  caption: z.string().optional(),
});

const cta = z.object({
  label: z.string(),
  href: z.string(),
  variant: z
    .enum(['primary', 'outline', 'outline-inverse', 'solid-inverse', 'ghost'])
    .optional(),
  external: z.boolean().optional(),
});

const bg = z.enum(['base', 'raised', 'inverse', 'accent']);
const pad = z.enum(['default', 'small', 'large', 'xl', 'none']);

/* ---------- Block schemas ---------- */
/* NOTE: rich-text fields are stored as MARKDOWN here (body / leftBody / rightBody)
   and converted to the `html` / `leftHtml` / `rightHtml` props the block
   components expect in src/lib/blocks.ts. Block components never change. */

const hero = z.object({
  type: z.literal('hero'),
  heading: z.string(),
  subheading: z.string().optional(),
  body: z.string().optional(),
  image: image.optional(),
  ctas: z.array(cta).optional(),
  variant: z.enum(['fullscreen', 'standard']).optional(),
});

// The `events` array is injected at render time (top-N upcoming from the
// events collection), so it is intentionally absent from the stored block.
const events = z.object({
  type: z.literal('events'),
  heading: z.string(),
  intro: z.string().optional(),
  viewAllCta: cta.optional(),
  /** Max events to show (soonest first). Omit to show all — e.g. the /events page. */
  limit: z.number().optional(),
});

const sectionHeading = z.object({
  type: z.literal('sectionHeading'),
  heading: z.string(),
  subheading: z.string().optional(),
  align: z.enum(['left', 'center']).optional(),
  background: bg.optional(),
  headingColor: z.enum(['accent', 'dark', 'inverse', 'muted']).optional(),
  variant: z.enum(['heading', 'lead']).optional(),
  width: z.enum(['narrow', 'medium', 'wide']).optional(),
});

const activityGrid = z.object({
  type: z.literal('activityGrid'),
  heading: z.string().optional(),
  subheading: z.string().optional(),
  image: image.optional(),
  items: z.array(
    z.object({
      label: z.string(),
      icon: image.optional(),
      href: z.string().optional(),
    }),
  ),
});

const testimonial = z.object({
  type: z.literal('testimonial'),
  quote: z.string(),
  attribution: z.string().optional(),
  image: image.optional(),
});

const gallery = z.object({
  type: z.literal('gallery'),
  images: z.array(image),
  layout: z.enum(['grid', 'mosaic']).optional(),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
  paddingTop: z.enum(['default', 'small', 'none']).optional(),
  paddingBottom: z.enum(['default', 'small', 'none']).optional(),
});

const followUs = z.object({
  type: z.literal('followUs'),
  heading: z.string().optional(),
  background: z.enum(['base', 'raised']).optional(),
  paddingTop: pad.optional(),
  paddingBottom: pad.optional(),
});

const textWithMedia = z.object({
  type: z.literal('textWithMedia'),
  eyebrow: z.string().optional(),
  heading: z.string(),
  body: z.string(), // markdown -> html
  image,
  ctas: z.array(cta).optional(),
  mediaPosition: z.enum(['left', 'right']).optional(),
});

const timeline = z.object({
  type: z.literal('timeline'),
  eyebrow: z.string().optional(),
  heading: z.string().optional(),
  entries: z.array(
    z.object({
      date: z.string(),
      title: z.string(),
      body: z.string(),
    }),
  ),
});

const ctaBlock = z.object({
  type: z.literal('cta'),
  heading: z.string(),
  body: z.string().optional(),
  ctas: z.array(cta),
  background: z.enum(['light', 'dark', 'accent', 'bar']).optional(),
});

const twoColumnText = z.object({
  type: z.literal('twoColumnText'),
  leftHeading: z.string().optional(),
  leftBody: z.string(), // markdown -> leftHtml
  leftCtas: z.array(cta).optional(),
  rightHeading: z.string().optional(),
  rightBody: z.string(), // markdown -> rightHtml
  rightCtas: z.array(cta).optional(),
  ctas: z.array(cta).optional(),
  background: z.enum(['base', 'raised']).optional(),
  alignAcross: z.boolean().optional(),
  paddingTop: z.enum(['default', 'small', 'none']).optional(),
  paddingBottom: z.enum(['default', 'small', 'none']).optional(),
});

const volunteerForm = z.object({
  type: z.literal('volunteerForm'),
  heading: z.string(),
  body: z.string().optional(), // markdown -> html
  image,
  mediaPosition: z.enum(['left', 'right']).optional(),
  action: z.string().optional(),
  method: z.enum(['POST', 'GET']).optional(),
  submitLabel: z.string().optional(),
  background: z.enum(['base', 'raised']).optional(),
});

const richText = z.object({
  type: z.literal('richText'),
  body: z.string(), // markdown -> html
  align: z.enum(['left', 'center']).optional(),
  width: z.enum(['narrow', 'medium', 'wide', 'full']).optional(),
  background: bg.optional(),
  paddingTop: pad.optional(),
  paddingBottom: pad.optional(),
});

const projects = z.object({
  type: z.literal('projects'),
  heading: z.string(),
  intro: z.string().optional(),
  projects: z.array(
    z.object({
      title: z.string(),
      body: z.string(),
      image: image.optional(),
      caption: z.string().optional(),
    }),
  ),
});

const board = z.object({
  type: z.literal('board'),
  heading: z.string(),
  intro: z.string().optional(),
  members: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      photo: image.optional(),
      bio: z.string().optional(),
    }),
  ),
});

const partners = z.object({
  type: z.literal('partners'),
  heading: z.string(),
  intro: z.string().optional(),
  partners: z.array(
    z.object({
      name: z.string(),
      logo: image,
      url: z.string(),
    }),
  ),
});

const videoEmbed = z.object({
  type: z.literal('videoEmbed'),
  youtubeId: z.string(),
  title: z.string(),
  poster: image.optional(),
  caption: z.string().optional(),
  background: z.enum(['base', 'raised']).optional(),
});

const newsletter = z.object({
  type: z.literal('newsletter'),
  heading: z.string(),
  subheading: z.string().optional(),
  background: bg.optional(),
});

const mapEmbed = z.object({
  type: z.literal('mapEmbed'),
  embedUrl: z.string(),
  title: z.string(),
  maxHeight: z.number().optional(),
  background: z.enum(['base', 'raised']).optional(),
});

const contactForm = z.object({
  type: z.literal('contactForm'),
  heading: z.string().optional(),
  body: z.string().optional(), // markdown -> html (intro copy)
  interests: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .optional(),
  action: z.string().optional(),
  method: z.enum(['POST', 'GET']).optional(),
  submitLabel: z.string().optional(),
  background: z.enum(['base', 'raised']).optional(),
});

const donorbox = z.object({
  type: z.literal('donorbox'),
  campaignUrl: z.string(),
  paypalExpress: z.boolean().optional(),
  height: z.number().optional(),
  background: z.enum(['base', 'raised']).optional(),
});

const ecwidStore = z.object({
  type: z.literal('ecwidStore'),
  storeId: z.string(),
});

const block = z.discriminatedUnion('type', [
  hero,
  events,
  sectionHeading,
  activityGrid,
  testimonial,
  gallery,
  followUs,
  textWithMedia,
  timeline,
  ctaBlock,
  twoColumnText,
  volunteerForm,
  richText,
  projects,
  board,
  partners,
  videoEmbed,
  newsletter,
  mapEmbed,
  contactForm,
  donorbox,
  ecwidStore,
]);

/* ---------- Collections ---------- */

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    metaDescription: z.string().optional(),
    blocks: z.array(block),
  }),
});

// CMS YAML serializers (Pages CMS, Decap) drop quotes on save, so an ISO date
// can come back parsed as a JS Date. Normalize both forms to a YYYY-MM-DD string.
const ymd = z
  .union([z.string(), z.date()])
  .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v));

const events_collection = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    date: ymd,
    endDate: ymd.optional(),
    time: z.string().optional(),
    location: z.string().optional(),
    description: z.string(),
    image: image.optional(),
    cta: cta.optional(),
  }),
});

export const collections = { pages, events: events_collection };
