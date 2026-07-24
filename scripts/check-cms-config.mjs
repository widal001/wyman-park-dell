/**
 * CMS-config validator.
 *
 * The Pages CMS config (.pages.yml) and the Zod content schemas
 * (src/content/schemas.ts) describe the same content for two different
 * consumers — the editing UI vs. build-time validation / rendering. Nothing
 * keeps them in sync, so they drift. This script introspects the Zod schemas,
 * parses .pages.yml, diffs the two field trees, and reports the drift:
 *
 *   - phantom-required : a field the CMS forces but Zod treats as optional
 *                        (e.g. required subfields inside an optional object)
 *   - missing-in-cms   : a Zod field with no CMS editor UI
 *   - extra-in-cms     : a CMS field Zod ignores (data dropped at build)
 *   - required-mismatch: required in Zod but optional in the CMS
 *   - kind-mismatch    : object/array/scalar shape disagreement
 *
 * Run: node scripts/check-cms-config.mjs  (wired into `pnpm checks`)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { pageSchema, eventSchema } from '../src/content/schemas.ts';

/* ----------------------------- Zod introspection ---------------------------- */

const zdef = (s) => s?._zod?.def ?? s?.def ?? s?._def;

/** Strip optional/default/nullable/etc. wrappers to reach the underlying type. */
function unwrap(schema) {
  let s = schema;
  let d = zdef(s);
  const wrappers = new Set([
    'optional',
    'default',
    'nullable',
    'readonly',
    'catch',
    'prefault',
  ]);
  // A `pipe` is how Zod v4 models `z.preprocess(fn, schema)`: `.out` holds the
  // real output schema (e.g. `optionalCta`'s underlying `cta.optional()`).
  // Descend into it so a preprocessed object isn't mistaken for a scalar.
  while (d && (wrappers.has(d.type) || d.type === 'pipe')) {
    s = d.type === 'pipe' ? d.out : d.innerType;
    d = zdef(s);
  }
  return s;
}

/** Normalize a Zod schema into { kind, children? }. */
function zodNode(schema) {
  const s = unwrap(schema);
  const d = zdef(s);
  if (!d) return { kind: 'scalar' };

  if (d.type === 'object') {
    const shape = typeof d.shape === 'function' ? d.shape() : d.shape;
    const children = {};
    for (const [key, child] of Object.entries(shape)) {
      children[key] = { optional: child.isOptional(), ...zodNode(child) };
    }
    return { kind: 'object', children };
  }

  if (d.type === 'array') {
    const el = zodNode(d.element);
    return {
      kind: 'array',
      children: el.kind === 'object' ? el.children : null,
    };
  }

  return { kind: 'scalar' };
}

/** Literal value of a `z.literal(...)` schema (Zod v4 stores an array). */
function literalValue(schema) {
  const d = zdef(schema);
  return d?.values?.[0] ?? d?.value;
}

/** Map of blockName -> object node, from the discriminated block union. */
function blockNodes() {
  const arr = unwrap(pageSchema.shape.blocks);
  const union = unwrap(zdef(arr).element);
  const options = zdef(union).options ?? [];
  const out = {};
  for (const opt of options) {
    const node = zodNode(opt);
    const name = literalValue(opt.shape.type);
    // `type` is the discriminator, not an editable field.
    delete node.children.type;
    out[name] = node;
  }
  return out;
}

/* ----------------------------- CMS introspection ---------------------------- */

/** Normalize a .pages.yml field definition into { kind, required, children? }. */
function cmsField(field) {
  const required = field.required === true;
  if (field.type === 'object') {
    return {
      kind: field.list ? 'array' : 'object',
      required,
      children: cmsFields(field.fields ?? []),
    };
  }
  return { kind: 'scalar', required };
}

function cmsFields(list) {
  const out = {};
  for (const f of list) out[f.name] = cmsField(f);
  return out;
}

/** blockName -> { children } for the pages collection's `blocks` field. */
function cmsBlockNodes(pagesCollection) {
  const blocksField = pagesCollection.fields.find((f) => f.type === 'block');
  const out = {};
  for (const b of blocksField.blocks ?? []) {
    out[b.name] = { kind: 'object', children: cmsFields(b.fields ?? []) };
  }
  return out;
}

/* --------------------------------- Diffing --------------------------------- */

// Fields Zod owns that intentionally have no CMS editor UI.
const IGNORE_MISSING = new Set([
  'page.blocks.events.events', // injected from the events collection at render
]);

// Documented exceptions to the required-ness rules, keyed by `category:path`.
const ACCEPT = new Set([
  // The homepage's slug is intentionally "" — Pages CMS `required` rejects an
  // empty value, so slug must stay optional in the CMS while Zod keeps it.
  'required-mismatch:page.slug',
]);

// Optional image objects keep `src` required in the CMS: an image with no src
// is invalid, and Pages CMS can't omit a single object. Accepted, not a bug.
function isImageObject(zChildren) {
  return zChildren && 'src' in zChildren && 'alt' in zChildren;
}

const findings = [];
const add = (severity, category, path, message) => {
  if (ACCEPT.has(`${category}:${path}`)) return;
  findings.push({ severity, category, path, message });
};

// `inOptional` is true once we've descended through an object Zod marks
// optional. Everything below an optional object is only *conditionally*
// required, so a required field there is not a "required in Zod" obligation —
// but the CMS marking it required IS a phantom-required trap (the editor is
// forced to fill a section the site treats as optional).
function diff(zNode, cNode, path, inOptional = false) {
  if (zNode.kind !== cNode.kind) {
    add(
      'error',
      'kind-mismatch',
      path,
      `Zod ${zNode.kind} vs CMS ${cNode.kind}`,
    );
    return;
  }
  if (zNode.kind === 'scalar') return;

  const zc = zNode.children ?? {};
  const cc = cNode.children ?? {};
  const zIsImage = isImageObject(zc);

  for (const [key, zChild] of Object.entries(zc)) {
    const childPath = `${path}.${key}`;
    const cChild = cc[key];

    if (!cChild) {
      if (IGNORE_MISSING.has(childPath)) continue;
      if (
        zIsImage &&
        (key === 'caption' || key === 'width' || key === 'height')
      )
        continue; // optional image extras, intentionally not exposed
      if (zChild.optional)
        add(
          'warn',
          'missing-in-cms',
          childPath,
          'optional in Zod, no CMS field',
        );
      else
        add(
          'error',
          'missing-in-cms',
          childPath,
          'required in Zod, no CMS field',
        );
      continue;
    }

    const childOptional = inOptional || zChild.optional;

    if (cChild.kind === 'scalar' && !(zIsImage && key === 'src')) {
      // CMS forces a field the site treats as optional.
      if (cChild.required && childOptional)
        add(
          'error',
          'phantom-required',
          childPath,
          zChild.optional
            ? 'optional in Zod but required in CMS'
            : `required in CMS but ${path} is optional in Zod`,
        );
      // Genuinely required by Zod, but the CMS lets the editor skip it.
      if (!childOptional && !cChild.required)
        add(
          'error',
          'required-mismatch',
          childPath,
          'required in Zod but optional in CMS',
        );
    }

    // Array boundary resets the optional context: a required field inside a
    // list item is validated per-item (only when an item exists), so it is a
    // genuine obligation, not a forced-optional trap.
    diff(
      zChild,
      cChild,
      childPath,
      zChild.kind === 'array' ? false : childOptional,
    );
  }

  for (const key of Object.keys(cc)) {
    if (!(key in zc))
      add(
        'error',
        'extra-in-cms',
        `${path}.${key}`,
        'in CMS but not in Zod (dropped at build)',
      );
  }
}

/* --------------------------------- Run ------------------------------------- */

const root = fileURLToPath(new URL('..', import.meta.url));
const cms = parseYaml(readFileSync(`${root}/.pages.yml`, 'utf8'));
const cmsByName = Object.fromEntries(cms.content.map((c) => [c.name, c]));

// Pages: top-level fields (minus the block list) + each block type.
const pagesTop = cmsFields(
  cmsByName.pages.fields.filter((f) => f.type !== 'block'),
);
const zPagesTop = { ...zodNode(pageSchema).children };
delete zPagesTop.blocks;
diff(
  { kind: 'object', children: zPagesTop },
  { kind: 'object', children: pagesTop },
  'page',
);

const zBlocks = blockNodes();
const cBlocks = cmsBlockNodes(cmsByName.pages);
for (const [name, zNode] of Object.entries(zBlocks)) {
  const cNode = cBlocks[name];
  if (!cNode) {
    add(
      'error',
      'missing-in-cms',
      `page.blocks.${name}`,
      'block type has no CMS UI',
    );
    continue;
  }
  diff(zNode, cNode, `page.blocks.${name}`);
}
for (const name of Object.keys(cBlocks)) {
  if (!(name in zBlocks))
    add(
      'error',
      'extra-in-cms',
      `page.blocks.${name}`,
      'block type not in Zod',
    );
}

// Events collection.
diff(
  zodNode(eventSchema),
  { kind: 'object', children: cmsFields(cmsByName.events.fields) },
  'event',
);

/* -------------------------------- Report ----------------------------------- */

const errors = findings.filter((f) => f.severity === 'error');
const warns = findings.filter((f) => f.severity === 'warn');

const fmt = (list) =>
  list.map((f) => `  [${f.category}] ${f.path}\n      ${f.message}`).join('\n');

if (errors.length) {
  console.error(`\n✖ ${errors.length} CMS-config error(s):\n${fmt(errors)}`);
}
if (warns.length) {
  console.warn(`\n⚠ ${warns.length} CMS-config warning(s):\n${fmt(warns)}`);
}
if (!errors.length && !warns.length) {
  console.log('✓ .pages.yml is consistent with the Zod content schemas');
}

process.exit(errors.length ? 1 : 0);
