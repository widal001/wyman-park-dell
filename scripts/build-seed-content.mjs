/**
 * One-shot migration script: reads src/content/*.ts and emits the EmDash seed
 * `content` section for each per-page collection (homepage_content,
 * about_content, contact_content, events_page_content, friends_content,
 * get_involved_content), plus the shared collections (events, team_members,
 * partners).
 *
 * - HTML body strings → PortableText (paragraphs, headings, lists, links,
 *   strong/em). Inline anchors get markDefs.
 * - ImageRef objects → resolved external MediaValue (provider:"external") so
 *   $media download isn't needed in dev. The Phase E R2 migration will
 *   replace these with R2-hosted media later.
 *
 * Reads existing modules via tsx/jiti — invoke with `pnpm tsx`.
 * Output is written to seed/content-generated.json; merge into seed/seed.json.
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Bun-style direct imports — tsx is required to run this
const { homepage } = await import('../src/content/homepage.ts');
const { about } = await import('../src/content/about.ts');
const { contact } = await import('../src/content/contact.ts');
const { events: eventsPage } = await import('../src/content/events.ts');
const { friends } = await import('../src/content/friends.ts');
const { getInvolved } = await import('../src/content/get-involved.ts');
const { site } = await import('../src/content/site.ts');

const HTML = (await import('node-html-parser')).default;

let pkCounter = 0;
const pk = (prefix = 'k') => `${prefix}${(++pkCounter).toString(36)}`;

function img(ref) {
  if (!ref || !ref.src) return undefined;
  const id = 'ext_' + createHash('sha1').update(ref.src).digest('hex').slice(0, 16);
  return { id, src: ref.src, alt: ref.alt ?? '', width: ref.width, height: ref.height, provider: 'external' };
}

/** Convert an HTML string to PortableText blocks. */
function htmlToPt(html) {
  if (!html || typeof html !== 'string') return [];
  const root = HTML.parse(`<root>${html}</root>`);
  const blocks = [];
  for (const child of root.firstChild.childNodes) {
    pushNode(child, blocks);
  }
  return blocks;
}

function pushNode(node, blocks, listType = null) {
  if (!node) return;
  if (node.nodeType === 3) {
    // text node at root — wrap in paragraph
    const text = (node.rawText || '').trim();
    if (text) blocks.push(textBlock([{ text }], 'normal'));
    return;
  }
  if (node.nodeType !== 1) return;
  const tag = (node.tagName || '').toLowerCase();
  if (tag === 'p') {
    blocks.push(textBlock(collectSpans(node), 'normal'));
  } else if (/^h[1-6]$/.test(tag)) {
    blocks.push(textBlock(collectSpans(node), tag));
  } else if (tag === 'ul' || tag === 'ol') {
    const listItem = tag === 'ul' ? 'bullet' : 'number';
    for (const li of node.childNodes) {
      if (li.tagName && li.tagName.toLowerCase() === 'li') {
        const collected = collectSpans(li);
        blocks.push({
          _type: 'block',
          _key: pk('b'),
          style: 'normal',
          listItem,
          level: 1,
          markDefs: collected.markDefs,
          children: collected.children,
        });
      }
    }
    return;
  } else if (tag === 'br') {
    return;
  } else {
    // wrap arbitrary inline-ish content as a paragraph
    const spans = collectSpans(node);
    if (spans.children.some((c) => c.text.trim())) {
      blocks.push(textBlock(spans, 'normal'));
    }
  }
}

function textBlock(spansOrCollected, style) {
  const collected =
    Array.isArray(spansOrCollected)
      ? { children: spansOrCollected.map((s) => ({ _type: 'span', _key: pk('s'), marks: [], ...s })), markDefs: [] }
      : spansOrCollected;
  return {
    _type: 'block',
    _key: pk('b'),
    style,
    markDefs: collected.markDefs,
    children: collected.children,
  };
}

/** Walk a node and return { children: span[], markDefs: [] }. */
function collectSpans(node) {
  const markDefs = [];
  const children = [];
  walk(node, [], markDefs, children);
  if (children.length === 0) {
    children.push({ _type: 'span', _key: pk('s'), marks: [], text: '' });
  }
  return { children, markDefs };
}

function walk(node, activeMarks, markDefs, out) {
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      const text = child.rawText.replace(/\s+/g, ' ');
      if (text) out.push({ _type: 'span', _key: pk('s'), marks: [...activeMarks], text });
    } else if (child.nodeType === 1) {
      const tag = child.tagName.toLowerCase();
      if (tag === 'a') {
        const href = child.getAttribute('href') || '#';
        const key = pk('lk');
        markDefs.push({ _key: key, _type: 'link', href });
        walk(child, [...activeMarks, key], markDefs, out);
      } else if (tag === 'strong' || tag === 'b') {
        walk(child, [...activeMarks, 'strong'], markDefs, out);
      } else if (tag === 'em' || tag === 'i') {
        walk(child, [...activeMarks, 'em'], markDefs, out);
      } else if (tag === 'br') {
        // insert a soft break (split into two spans)
        out.push({ _type: 'span', _key: pk('s'), marks: [...activeMarks], text: '\n' });
      } else {
        walk(child, activeMarks, markDefs, out);
      }
    }
  }
}

function findBlock(blocks, type) {
  return blocks.find((b) => b.type === type);
}

function ctaPair(cta) {
  return cta ? { label: cta.label, href: cta.href } : { label: undefined, href: undefined };
}

/* ---------- per-page builders ---------- */

function buildHomepage() {
  const b = homepage.blocks;
  const hero = findBlock(b, 'hero');
  const ev = findBlock(b, 'events');
  const sh = findBlock(b, 'sectionHeading');
  const ag = findBlock(b, 'activityGrid');
  const test = findBlock(b, 'testimonial');
  const gal = findBlock(b, 'gallery');
  const cta1 = hero?.ctas?.[0];
  const cta2 = hero?.ctas?.[1];
  return {
    id: 'homepage-main',
    slug: 'main',
    status: 'published',
    data: {
      hero_heading: hero?.heading,
      hero_body: hero?.body,
      hero_image: img(hero?.image),
      hero_cta1_label: cta1?.label,
      hero_cta1_href: cta1?.href,
      hero_cta2_label: cta2?.label,
      hero_cta2_href: cta2?.href,
      events_section_heading: ev?.heading,
      events_section_intro: ev?.intro,
      events_view_all_label: ev?.viewAllCta?.label,
      events_view_all_href: ev?.viewAllCta?.href,
      discover_heading: sh?.heading,
      discover_subheading: sh?.subheading,
      activity_grid_image: img(ag?.image),
      testimonial_quote: test?.quote,
      testimonial_attribution: test?.attribution,
      gallery_image_1: img(gal?.images?.[0]),
      gallery_image_2: img(gal?.images?.[1]),
      gallery_image_3: img(gal?.images?.[2]),
      gallery_image_4: img(gal?.images?.[3]),
    },
  };
}

function buildAbout() {
  const b = about.blocks;
  const hero = b.find((x) => x.type === 'hero');
  const history = b.find((x) => x.type === 'textWithMedia' && x.heading === 'Park history');
  const cta = b.find((x) => x.type === 'cta');
  const credits = b.find((x) => x.type === 'twoColumnText');
  const tubman = b.find((x) => x.type === 'textWithMedia' && x.heading === 'Harriet Tubman Grove');
  const gal = b.find((x) => x.type === 'gallery');
  const test = b.find((x) => x.type === 'testimonial');
  return {
    id: 'about-main',
    slug: 'main',
    status: 'published',
    data: {
      hero_heading: hero?.heading,
      hero_image: img(hero?.image),
      history_heading: history?.heading,
      history_image: img(history?.image),
      history_body: htmlToPt(history?.html),
      history_cta1_label: history?.ctas?.[0]?.label,
      history_cta1_href: history?.ctas?.[0]?.href,
      history_cta2_label: history?.ctas?.[1]?.label,
      history_cta2_href: history?.ctas?.[1]?.href,
      cta_bar_heading: cta?.heading,
      cta_bar_label: cta?.ctas?.[0]?.label,
      cta_bar_href: cta?.ctas?.[0]?.href,
      credits_left_body: htmlToPt(credits?.leftHtml),
      credits_right_body: htmlToPt(credits?.rightHtml),
      credits_cta_label: credits?.ctas?.[0]?.label,
      credits_cta_href: credits?.ctas?.[0]?.href,
      tubman_heading: tubman?.heading,
      tubman_image: img(tubman?.image),
      tubman_body: htmlToPt(tubman?.html),
      testimonial_quote: test?.quote,
      testimonial_attribution: test?.attribution,
      gallery_image_1: img(gal?.images?.[0]),
      gallery_image_2: img(gal?.images?.[1]),
      gallery_image_3: img(gal?.images?.[2]),
      gallery_image_4: img(gal?.images?.[3]),
    },
  };
}

function buildContact() {
  const b = contact.blocks;
  const hero = b.find((x) => x.type === 'hero');
  const rich = b.find((x) => x.type === 'richText');
  const map = b.find((x) => x.type === 'mapEmbed');
  const form = b.find((x) => x.type === 'contactForm');
  return {
    id: 'contact-main',
    slug: 'main',
    status: 'published',
    data: {
      hero_heading: hero?.heading,
      hero_image: img(hero?.image),
      address_body: htmlToPt(rich?.html),
      map_embed_url: map?.embedUrl,
      form_heading: form?.heading,
      form_intro: htmlToPt(form?.html),
    },
  };
}

function buildEventsPage() {
  const b = eventsPage.blocks;
  const hero = b.find((x) => x.type === 'hero');
  const ev = b.find((x) => x.type === 'events');
  const proj = b.find((x) => x.type === 'projects');
  const tct = b.find((x) => x.type === 'twoColumnText');
  const news = b.find((x) => x.type === 'newsletter');
  return {
    id: 'events-page-main',
    slug: 'main',
    status: 'published',
    data: {
      hero_heading: hero?.heading,
      hero_image: img(hero?.image),
      events_section_heading: ev?.heading,
      events_section_intro: ev?.intro,
      events_max: 3,
      events_view_all_label: ev?.viewAllCta?.label,
      events_view_all_href: ev?.viewAllCta?.href,
      annual_events_heading: proj?.heading,
      annual_events_intro: proj?.intro,
      host_left_heading: tct?.leftHeading,
      host_left_body: htmlToPt(tct?.leftHtml),
      host_left_cta_label: tct?.leftCtas?.[0]?.label,
      host_left_cta_href: tct?.leftCtas?.[0]?.href,
      host_right_heading: tct?.rightHeading,
      host_right_body: htmlToPt(tct?.rightHtml),
      host_right_cta_label: tct?.rightCtas?.[0]?.label,
      host_right_cta_href: tct?.rightCtas?.[0]?.href,
      newsletter_heading: news?.heading,
      newsletter_subheading: news?.subheading,
    },
  };
}

function buildFriends() {
  const b = friends.blocks;
  const hero = b.find((x) => x.type === 'hero');
  const lead = b.find((x) => x.type === 'sectionHeading' && x.variant === 'lead');
  const history = b.find((x) => x.type === 'textWithMedia');
  const board = b.find((x) => x.type === 'board');
  const mission = b.find((x) => x.type === 'sectionHeading' && x.heading === 'Our mission');
  const missionBody = b.find((x) => x.type === 'richText');
  const video = b.find((x) => x.type === 'videoEmbed');
  const projects = b.find((x) => x.type === 'projects');
  const partnersBlock = b.find((x) => x.type === 'partners');
  const test = b.find((x) => x.type === 'testimonial');
  return {
    id: 'friends-main',
    slug: 'main',
    status: 'published',
    data: {
      hero_heading: hero?.heading,
      hero_image: img(hero?.image),
      lead_paragraph: lead?.heading,
      history_heading: history?.heading,
      history_image: img(history?.image),
      history_body: htmlToPt(history?.html),
      history_cta_label: history?.ctas?.[0]?.label,
      history_cta_href: history?.ctas?.[0]?.href,
      board_heading: board?.heading,
      board_intro: board?.intro,
      mission_heading: mission?.heading,
      mission_subheading: mission?.subheading,
      mission_body: htmlToPt(missionBody?.html),
      video_youtube_id: video?.youtubeId,
      video_title: video?.title,
      video_caption: video?.caption,
      projects_heading: projects?.heading,
      projects_intro: projects?.intro,
      partners_heading: partnersBlock?.heading,
      testimonial_quote: test?.quote,
      testimonial_attribution: test?.attribution,
    },
  };
}

function buildGetInvolved() {
  const b = getInvolved.blocks;
  const hero = b.find((x) => x.type === 'hero');
  const lead = b.find((x) => x.type === 'sectionHeading' && x.variant === 'lead');
  const donate = b.find((x) => x.type === 'textWithMedia' && x.heading === 'Make a donation');
  const volunteer = b.find((x) => x.type === 'volunteerForm');
  const test = b.find((x) => x.type === 'testimonial');
  const gal = b.find((x) => x.type === 'gallery');
  return {
    id: 'get-involved-main',
    slug: 'main',
    status: 'published',
    data: {
      hero_heading: hero?.heading,
      hero_image: img(hero?.image),
      lead_paragraph: lead?.heading,
      donate_heading: donate?.heading,
      donate_image: img(donate?.image),
      donate_body: htmlToPt(donate?.html),
      donate_cta_label: donate?.ctas?.[0]?.label,
      donate_cta_href: donate?.ctas?.[0]?.href,
      volunteer_heading: volunteer?.heading,
      volunteer_image: img(volunteer?.image),
      volunteer_body: htmlToPt(volunteer?.html),
      testimonial_quote: test?.quote,
      testimonial_attribution: test?.attribution,
      gallery_image_1: img(gal?.images?.[0]),
      gallery_image_2: img(gal?.images?.[1]),
      gallery_image_3: img(gal?.images?.[2]),
      gallery_image_4: img(gal?.images?.[3]),
    },
  };
}

function buildEvents() {
  // Events list from both homepage and events page; dedupe by title.
  const all = [
    ...(findBlock(homepage.blocks, 'events')?.events ?? []),
    ...(findBlock(eventsPage.blocks, 'events')?.events ?? []),
  ];
  const seen = new Set();
  const out = [];
  for (const e of all) {
    if (seen.has(e.title)) continue;
    seen.add(e.title);
    const slug = e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    out.push({
      id: `event-${slug}`,
      slug,
      status: 'published',
      data: {
        title: e.title,
        starts_at: e.date ? new Date(e.date).toISOString() : undefined,
        ends_at: e.endDate ? new Date(e.endDate).toISOString() : undefined,
        time_text: e.time,
        location: e.location,
        summary: e.body,
        image: img(e.image),
        cta_label: e.cta?.label,
        cta_href: e.cta?.href,
      },
    });
  }
  return out;
}

function buildTeamMembers() {
  const board = findBlock(friends.blocks, 'board');
  return (board?.members ?? []).map((m, i) => ({
    id: `member-${m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    slug: m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    status: 'published',
    data: {
      name: m.name,
      role: m.role,
      photo: img(m.photo),
      bio: m.bio,
      sort_order: i,
    },
  }));
}

function buildPartners() {
  const p = findBlock(friends.blocks, 'partners');
  return (p?.partners ?? []).map((x, i) => ({
    id: `partner-${x.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    slug: x.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    status: 'published',
    data: {
      name: x.name,
      logo: img(x.logo),
      url: x.url,
      sort_order: i,
    },
  }));
}

function buildSiteExtras() {
  return {
    id: 'site-extras-main',
    slug: 'main',
    status: 'published',
    data: {
      logo_inverse: img(site.logoInverse),
      donate_cta_label: site.donateCta.label,
      donate_cta_href: site.donateCta.href,
      contact_email: site.contact.email,
      contact_address: site.contact.address.join('\n'),
      copyright: site.copyright.replace(/©\s*\d+\s*/, ''),
      newsletter_heading: site.newsletter.heading,
      newsletter_action: site.newsletter.action,
      newsletter_submit_label: site.newsletter.submitLabel,
    },
  };
}

const content = {
  homepage_content: [buildHomepage()],
  about_content: [buildAbout()],
  contact_content: [buildContact()],
  events_page_content: [buildEventsPage()],
  friends_content: [buildFriends()],
  get_involved_content: [buildGetInvolved()],
  events: buildEvents(),
  team_members: buildTeamMembers(),
  partners: buildPartners(),
  site_extras: [buildSiteExtras()],
};

// Merge into seed/seed.json
const seedPath = 'seed/seed.json';
const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
seed.content = content;
writeFileSync(seedPath, JSON.stringify(seed, null, 2) + '\n');

const counts = Object.fromEntries(
  Object.entries(content).map(([k, v]) => [k, Array.isArray(v) ? v.length : 1]),
);
console.log('Wrote content to', seedPath, counts);
