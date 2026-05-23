import { toHTML, type PortableTextOptions } from '@portabletext/to-html';
import type { PortableTextBlock } from 'emdash';

const opts: PortableTextOptions = {
  components: {
    marks: {
      link: ({ children, value }) => {
        const href: string = value?.href ?? '#';
        const external = /^https?:\/\//i.test(href) && !href.startsWith('https://wymanparkdell.org');
        return external
          ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${children}</a>`
          : `<a href="${href}">${children}</a>`;
      },
    },
  },
};

export function ptToHtml(value: PortableTextBlock[] | undefined | null): string {
  if (!value || value.length === 0) return '';
  return toHTML(value, opts);
}
