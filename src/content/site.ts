import type { SiteContent } from '../types/content';

export const site: SiteContent = {
  name: 'Friends of Wyman Park Dell',
  tagline:
    'A green oasis in the heart of Central Baltimore where all are welcome.',
  logo: {
    src: '/media/2026/01/FWPD-RGB.jpg',
    alt: 'Friends of Wyman Park Dell',
    width: 160,
    height: 160,
  },
  logoInverse: {
    src: '/media/2021/11/FWPD-WHITE.png',
    alt: 'Friends of Wyman Park Dell',
    width: 200,
    height: 80,
  },
  primaryNav: [
    { label: 'About the park', href: '/about-the-park/' },
    { label: 'Friends of Wyman Park Dell', href: '/friends-of-wyman-park-dell/' },
    { label: 'Events', href: '/events/' },
    { label: 'Get involved', href: '/get-involved/' },
    { label: 'Shop', href: '/shop/' },
    { label: 'Contact', href: '/contact/' },
  ],
  footerNav: [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about-the-park/' },
    { label: 'Friends', href: '/friends-of-wyman-park-dell/' },
    { label: 'Get involved', href: '/get-involved/' },
    { label: 'Events', href: '/events/' },
    { label: 'Shop', href: '/shop/' },
    { label: 'Contact us', href: '/contact/' },
  ],
  donateCta: {
    label: 'Donate',
    href: '/get-involved/',
    variant: 'outline',
  },
  contact: {
    address: [
      'Wyman Park Dell',
      'North Charles and 29th Streets',
      'Baltimore, MD 21218',
    ],
    email: 'wymanparkdell@gmail.com',
  },
  social: [
    {
      network: 'facebook',
      url: 'https://www.facebook.com/wymanparkdell/',
      label: 'Friends of Wyman Park Dell on Facebook',
    },
    {
      network: 'instagram',
      url: 'https://www.instagram.com/wymanparkdell/',
      label: 'Friends of Wyman Park Dell on Instagram',
    },
    {
      network: 'youtube',
      url: 'https://www.youtube.com/channel/UCHgICuR617nXurJEXxILXEw/videos',
      label: 'Friends of Wyman Park Dell on YouTube',
    },
  ],
  newsletter: {
    heading: 'Sign up for our newsletter',
    /** Wire to Mailchimp/Buttondown/Worker endpoint when ready. */
    action: '',
    method: 'POST',
    fields: {
      name: { name: 'name', placeholder: 'Name', label: 'Name' },
      email: { name: 'email', placeholder: 'Email', label: 'Email address' },
    },
    submitLabel: 'Subscribe',
  },
  copyright: `© ${new Date().getFullYear()} Friends of Wyman Park Dell. All rights reserved.`,
};
