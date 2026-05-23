import type { PageContent } from "../types/content";

const WP = "https://wymanparkdell.org/site/wp-content/uploads";

export const events: PageContent = {
  slug: "events",
  title: "Events",
  metaDescription:
    "Join us at Wyman Park Dell. Annual celebrations, neighborhood gatherings, and community events year-round.",
  blocks: [
    {
      type: "hero",
      variant: "standard",
      heading: "Join us at the Dell",
      image: {
        src: `https://pub-793f2ed4365042cb96f36d101a563f6e.r2.dev/Events-banner-scaled.jpg`,
        alt: "A community gathering at Wyman Park Dell",
      },
    },
    {
      type: "events",
      heading: "Our events",
      intro:
        "A variety of events take place in Wyman Park Dell throughout the year. From park clean-ups to neighborhood festivals, the Dell is the perfect place to celebrate community.",
      events: [
        {
          title: "Spring Park Clean-Up",
          date: "2026-05-09",
          time: "9:00 AM – 12:00 PM",
          location: "Wyman Park Dell — meet at the playground",
          body: "Join your neighbors for our biggest clean-up of the year. Tools, gloves, and refreshments provided. All ages welcome — kids especially love the wheelbarrows.",
          image: {
            src: `https://pub-793f2ed4365042cb96f36d101a563f6e.r2.dev/WPD_Friends.jpg`,
            alt: "Volunteers at a Wyman Park Dell clean-up",
          },
          cta: {
            label: "RSVP",
            href: "https://wymanparkdell.org/events/",
            external: true,
          },
        },
        {
          title: "Holi Color Celebration",
          date: "2026-03-21",
          time: "12:00 PM – 3:00 PM",
          location: "Lower Dell",
          body: "A joyful “color fight” in the lower Dell to mark the arrival of spring, organized by local restaurant Sweet 27 in partnership with the Friends of Wyman Park Dell.",
          image: {
            src: `https://pub-793f2ed4365042cb96f36d101a563f6e.r2.dev/Events_Holi-Colors-Celebration.jpg`,
            alt: "Holi Color Celebration at the Dell",
          },
          cta: {
            label: "Learn more",
            href: "https://wymanparkdell.org/events/",
            external: true,
          },
        },
        {
          title: "Winter Solstice in the Dell",
          date: "2026-12-21",
          time: "Sundown",
          location: "Wyman Park Dell",
          body: "Gather with neighbors to celebrate the Winter Solstice. Music, marshmallows, and hot drinks and cookies provided by local restaurant Gertrude’s.",
          image: {
            src: `https://pub-793f2ed4365042cb96f36d101a563f6e.r2.dev/Events_Winter-Solstice.jpg`,
            alt: "Winter Solstice gathering at the Dell",
          },
          cta: {
            label: "Add to calendar",
            href: "https://wymanparkdell.org/events/",
            external: true,
          },
        },
      ],
      viewAllCta: {
        label: "See all events",
        href: "https://wymanparkdell.org/events/",
        variant: "ghost",
        external: true,
      },
    },
    {
      type: "projects",
      heading: "Annual events",
      intro:
        "A handful of beloved gatherings return to the Dell every year — celebrate the seasons and the community alongside us.",
      projects: [
        {
          title: "Holi Colors Celebration",
          body: 'The Holi Color Celebration invites the community to a "color fight" in the lower Dell to mark the arrival of spring. This event is organized by local restaurant Sweet 27 in partnership with the Friends of Wyman Park Dell.',
          image: {
            src: `https://pub-793f2ed4365042cb96f36d101a563f6e.r2.dev/Events_Holi-Colors-Celebration.jpg`,
            alt: "Holi Color Celebration at Wyman Park Dell",
          },
          caption: "Held each spring in partnership with Sweet 27.",
        },
        {
          title: "Charles Village Festival",
          body: "For more than 25 years, the Charles Village Festival filled the Dell with live music, performances, food, and vendors. This long-running event came to a close in 2024.",
          image: {
            src: `https://pub-793f2ed4365042cb96f36d101a563f6e.r2.dev/WPD-Event-Charles-Village-Festival.jpg`,
            alt: "Charles Village Festival at the Dell",
          },
          caption: "A 25-year tradition that concluded in 2024.",
        },
        {
          title: "Spooky Tuesdays in the Dell",
          body: "Spooky Tuesdays in the Dell brings the big screen to the park each October with showings of scary (and family-friendly!) films. This event is led by the Friends of Wyman Park Dell with the support of local businesses and sponsors.",
          image: {
            src: `https://pub-793f2ed4365042cb96f36d101a563f6e.r2.dev/Events_Spooky-Tuesdays-in-the-Dell.jpg`,
            alt: "Outdoor movie night at Wyman Park Dell",
          },
          caption: "Outdoor movie nights every Tuesday in October.",
        },
        {
          title: "Winter Solstice in the Dell",
          body: "Every December 21, we invite neighbors to gather in the park to celebrate the Winter Solstice in the Dell. Enjoy music, marshmallows, and hot drinks and cookies provided by local restaurant Gertrude’s.",
          image: {
            src: `https://pub-793f2ed4365042cb96f36d101a563f6e.r2.dev/Events_Winter-Solstice.jpg`,
            alt: "Winter Solstice gathering at Wyman Park Dell",
          },
          caption: "December 21 each year — courtesy of Gertrude’s.",
        },
      ],
    },
    {
      type: "twoColumnText",
      background: "raised",
      leftHeading: "How to host an event",
      leftHtml: `
        <p>Special events in Wyman Park Dell are permitted by Baltimore City. We recommend reviewing the process early and applying at least <strong>eight weeks</strong> prior to your event. We also suggest checking the Friends of Wyman Park Dell calendar to avoid conflicts with scheduled events.</p>
      `,
      leftCtas: [
        {
          label: "Permit information",
          href: "https://bcrp.baltimorecity.gov/parks-permits",
          external: true,
        },
      ],
      rightHeading: "Interested in partnering?",
      rightHtml: `
        <p>The Friends of Wyman Park Dell love collaborating with neighbors, local businesses, and community groups. Whether you have an idea for a new gathering or want to co-host an existing one, we’d love to hear from you.</p>
      `,
      rightCtas: [
        {
          label: "Get in touch with the Friends today",
          href: "https://wymanparkdell.org/contact/",
          external: true,
        },
      ],
    },
    {
      type: "newsletter",
      heading: "Sign up for our newsletter",
      subheading: "Never miss an event at the Dell.",
      background: "base",
    },
  ],
};
