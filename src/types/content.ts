/**
 * Content shape contracts.
 *
 * Today these types describe hard-coded TS objects in src/content/.
 * Tomorrow Payload (or another CMS) returns the same shapes from a query.
 * Block components depend only on these types — never on the data source.
 */

export type ImageRef = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
};

export type CtaRef = {
  label: string;
  href: string;
  variant?:
    'primary' | 'outline' | 'outline-inverse' | 'solid-inverse' | 'ghost';
  external?: boolean;
};

export type NavItem = {
  label: string;
  href: string;
  external?: boolean;
};

export type SocialLink = {
  network: 'facebook' | 'instagram' | 'youtube' | 'twitter' | 'email';
  url: string;
  label: string;
};

/* ---------- Content blocks ---------- */

export type HeroBlock = {
  type: 'hero';
  heading: string;
  subheading?: string;
  body?: string;
  image?: ImageRef;
  ctas?: CtaRef[];
  variant?: 'fullscreen' | 'standard';
};

export type RichTextBlock = {
  type: 'richText';
  /** Raw HTML for the POC. Will become Lexical-rendered HTML once Payload comes online. */
  html: string;
  align?: 'left' | 'center';
  width?: 'narrow' | 'medium' | 'wide' | 'full';
  background?: 'base' | 'raised' | 'inverse' | 'accent';
  paddingTop?: 'default' | 'small' | 'large' | 'xl' | 'none';
  paddingBottom?: 'default' | 'small' | 'large' | 'xl' | 'none';
};

export type GalleryBlock = {
  type: 'gallery';
  images: ImageRef[];
  layout?: 'grid' | 'mosaic';
  columns?: 2 | 3 | 4;
  paddingTop?: 'default' | 'small' | 'none';
  paddingBottom?: 'default' | 'small' | 'none';
};

export type TimelineEntry = {
  date: string;
  title: string;
  body: string;
};

export type TimelineBlock = {
  type: 'timeline';
  /** Small label rendered above the heading (e.g. "Wyman Park"). */
  eyebrow?: string;
  heading?: string;
  entries: TimelineEntry[];
};

export type BoardMember = {
  name: string;
  role: string;
  photo?: ImageRef;
  bio?: string;
};

export type BoardDirectoryBlock = {
  type: 'board';
  heading: string;
  intro?: string;
  members: BoardMember[];
};

export type Partner = {
  name: string;
  logo: ImageRef;
  url: string;
};

export type PartnersBlock = {
  type: 'partners';
  heading: string;
  intro?: string;
  partners: Partner[];
};

export type ActivityItem = {
  label: string;
  icon?: ImageRef;
  href?: string;
};

export type ActivityGridBlock = {
  type: 'activityGrid';
  heading?: string;
  subheading?: string;
  image?: ImageRef;
  items: ActivityItem[];
};

export type TestimonialBlock = {
  type: 'testimonial';
  quote: string;
  attribution?: string;
  image?: ImageRef;
};

export type CallToActionBlock = {
  type: 'cta';
  heading: string;
  body?: string;
  ctas: CtaRef[];
  background?: 'light' | 'dark' | 'accent' | 'bar';
};

export type ProjectsBlock = {
  type: 'projects';
  heading: string;
  intro?: string;
  projects: {
    title: string;
    body: string;
    image?: ImageRef;
    /** Short subtext shown beneath the image when this project is selected. */
    caption?: string;
  }[];
};

export type SectionHeadingBlock = {
  type: 'sectionHeading';
  heading: string;
  subheading?: string;
  align?: 'left' | 'center';
  /** Section background. Defaults to base (white). */
  background?: 'base' | 'raised' | 'inverse' | 'accent';
  /** Heading color. Defaults to brand green (the existing accent). */
  headingColor?: 'accent' | 'dark' | 'inverse' | 'muted';
  /**
   * Visual style of the heading.
   * `heading` (default) — large bold display heading.
   * `lead` — paragraph-weight tagline rendered as <p> instead of <h2>.
   */
  variant?: 'heading' | 'lead';
  /** Container width. Defaults to narrow (760px). Other tiers: medium (960px), wide (1200px). */
  width?: 'narrow' | 'medium' | 'wide';
};

export type TextWithMediaBlock = {
  type: 'textWithMedia';
  eyebrow?: string;
  heading: string;
  /** Body content as raw HTML/Markdown-rendered HTML. */
  html: string;
  image: ImageRef;
  /** Optional ghost-style CTA links shown beneath the body text. */
  ctas?: CtaRef[];
  mediaPosition?: 'left' | 'right';
};

export type TwoColumnTextBlock = {
  type: 'twoColumnText';
  /** Optional heading rendered above the left body. */
  leftHeading?: string;
  /** Raw HTML for left column body. */
  leftHtml: string;
  /** Optional CTAs shown beneath the left column. */
  leftCtas?: CtaRef[];
  /** Optional heading rendered above the right body. */
  rightHeading?: string;
  /** Raw HTML for right column body. */
  rightHtml: string;
  /** Optional CTAs shown beneath the right column. (Alias: legacy `ctas`.) */
  rightCtas?: CtaRef[];
  /** Legacy field — same as rightCtas. */
  ctas?: CtaRef[];
  background?: 'base' | 'raised';
  /**
   * Whether headings, bodies, and CTAs align across columns.
   * Defaults to true (events-style: shared grid rows).
   * Set false when bodies have very different lengths or only one column has a
   * CTA — each column flows independently and items follow the previous one.
   */
  alignAcross?: boolean;
  paddingTop?: 'default' | 'small' | 'none';
  paddingBottom?: 'default' | 'small' | 'none';
};

export type FollowUsBlock = {
  type: 'followUs';
  /** Defaults to "Follow Friends of Wyman Park Dell". */
  heading?: string;
  background?: 'base' | 'raised';
  paddingTop?: 'default' | 'small' | 'large' | 'xl' | 'none';
  paddingBottom?: 'default' | 'small' | 'large' | 'xl' | 'none';
};

export type MapEmbedBlock = {
  type: 'mapEmbed';
  /** Full embed URL — e.g. a Google Maps `?pb=` URL. */
  embedUrl: string;
  /** Accessible title for the iframe. */
  title: string;
  /** Maximum height in pixels. Defaults to 320. */
  maxHeight?: number;
  background?: 'base' | 'raised';
};

export type ContactFormInterest = {
  label: string;
  value: string;
};

export type ContactFormBlock = {
  type: 'contactForm';
  heading?: string;
  /** Optional intro copy rendered above the form. Raw HTML. */
  html?: string;
  /** Options for the "I am interested in" select. */
  interests?: ContactFormInterest[];
  action?: string;
  method?: 'POST' | 'GET';
  submitLabel?: string;
  background?: 'base' | 'raised';
};

export type VolunteerFormBlock = {
  type: 'volunteerForm';
  heading: string;
  /** Body copy rendered above the form. Raw HTML. */
  html?: string;
  image: ImageRef;
  mediaPosition?: 'left' | 'right';
  /** Form POST target. Until a backend exists, leave empty. */
  action?: string;
  method?: 'POST' | 'GET';
  submitLabel?: string;
  background?: 'base' | 'raised';
};

export type NewsletterBlock = {
  type: 'newsletter';
  heading: string;
  subheading?: string;
  /** Optional override of the site-wide newsletter config. */
  config?: NewsletterConfig;
  background?: 'base' | 'raised' | 'inverse' | 'accent';
};

export type DonorboxEmbedBlock = {
  type: 'donorbox';
  campaignUrl: string;
  paypalExpress?: boolean;
  height?: number;
  background?: 'base' | 'raised';
};

export type EcwidStoreBlock = {
  type: 'ecwidStore';
  storeId: string;
};

export type VideoEmbedBlock = {
  type: 'videoEmbed';
  /** YouTube video ID, e.g. "MijsOH-eYu8". */
  youtubeId: string;
  title: string;
  /** Optional custom poster. Falls back to YouTube's default thumbnail. */
  poster?: ImageRef;
  caption?: string;
  background?: 'base' | 'raised';
};

export type EventItem = {
  /** URL slug — the card links to `/events/{slug}`. */
  slug: string;
  title: string;
  /** ISO date — e.g. "2026-05-17". Component formats for display. */
  date: string;
  /** Optional end date for multi-day events. */
  endDate?: string;
  time?: string;
  location?: string;
  body: string;
  image?: ImageRef;
  cta?: CtaRef;
  /** Human-readable cadence for recurring events, e.g. "Second Sunday of every month". */
  recurrence?: string;
};

export type EventsBlock = {
  type: 'events';
  heading: string;
  intro?: string;
  events: EventItem[];
  viewAllCta?: CtaRef;
  /** Layout: 'grid' (default) or 'carousel' (horizontal, swipeable). */
  display?: 'grid' | 'carousel';
};

export type ContentBlock =
  | HeroBlock
  | RichTextBlock
  | GalleryBlock
  | TimelineBlock
  | BoardDirectoryBlock
  | PartnersBlock
  | ActivityGridBlock
  | TestimonialBlock
  | CallToActionBlock
  | ProjectsBlock
  | SectionHeadingBlock
  | EventsBlock
  | TextWithMediaBlock
  | TwoColumnTextBlock
  | VideoEmbedBlock
  | NewsletterBlock
  | VolunteerFormBlock
  | MapEmbedBlock
  | ContactFormBlock
  | FollowUsBlock
  | DonorboxEmbedBlock
  | EcwidStoreBlock;

/* ---------- Pages & site-wide ---------- */

export type PageContent = {
  slug: string;
  title: string;
  metaDescription?: string;
  blocks: ContentBlock[];
};

export type NewsletterConfig = {
  heading: string;
  /** Form POST target. Until a backend exists, leave empty and the form submits to /. */
  action?: string;
  method?: 'POST' | 'GET';
  /** Hidden fields the provider expects (e.g. Mailchimp's anti-bot honeypot). */
  hiddenFields?: { name: string; value: string }[];
  fields: {
    name: { name: string; placeholder: string; label: string };
    email: { name: string; placeholder: string; label: string };
  };
  submitLabel: string;
};

export type SiteContent = {
  name: string;
  tagline: string;
  logo: ImageRef;
  logoInverse?: ImageRef;
  primaryNav: NavItem[];
  footerNav: NavItem[];
  donateCta: CtaRef;
  contact: {
    address: string[];
    email: string;
  };
  social: SocialLink[];
  newsletter: NewsletterConfig;
  copyright: string;
};
