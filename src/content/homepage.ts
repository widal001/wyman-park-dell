import type { PageContent } from "../types/content";

const WP = "https://wymanparkdell.org/site/wp-content/uploads";

export const homepage: PageContent = {
  slug: "",
  title: "Friends of Wyman Park Dell",
  metaDescription:
    "Wyman Park Dell is a 16-acre Olmsted-designed public park in Central Baltimore. A green oasis where all are welcome.",
  blocks: [
    {
      type: "hero",
      variant: "fullscreen",
      heading: "Welcome to the Wyman Park Dell",
      body: "Surrounded by tree-lined slopes, the Dell is a green oasis in the heart of Central Baltimore where all are welcome. Your support is needed to keep this unique public space accessible — and extraordinary — for everyone.",
      image: {
        src: `${WP}/2026/01/Home-Page-Image-1024x554.webp`,
        alt: "Aerial view of Wyman Park Dell in summer",
        width: 1024,
        height: 554,
      },
      ctas: [
        {
          label: "Get Involved",
          href: "https://wymanparkdell.org/get-involved/",
          variant: "solid-inverse",
          external: true,
        },
        {
          label: "Plan Your Visit",
          href: "https://wymanparkdell.org/contact/#address",
          variant: "outline-inverse",
          external: true,
        },
      ],
    },
    {
      type: "events",
      heading: "Upcoming Events",
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
            src: "https://wymanparkdell.org/site/wp-content/uploads/2021/11/WPD_Friends.jpg",
            alt: "Volunteers at a Wyman Park Dell clean-up",
          },
          cta: {
            label: "RSVP",
            href: "https://wymanparkdell.org/events/",
            external: true,
          },
        },
        {
          title: "Movie Night in the Dell",
          date: "2026-06-13",
          time: "Sundown (≈ 8:30 PM)",
          location: "Lower lawn, Wyman Park Dell",
          body: "Bring a blanket, a picnic, and the whole family. We project a family-friendly film on the big inflatable screen as the sun sets behind the slopes.",
          image: {
            src: "https://wymanparkdell.org/site/wp-content/uploads/2026/01/Wyman-Park-Dell-2.jpg",
            alt: "Wyman Park Dell at golden hour",
          },
          cta: {
            label: "Add to calendar",
            href: "https://wymanparkdell.org/events/",
            external: true,
          },
        },
        {
          title: "DellFest: Community Festival",
          date: "2026-09-19",
          time: "11:00 AM – 4:00 PM",
          location: "Wyman Park Dell",
          body: "A celebration of the Dell, the neighborhoods around it, and the people who keep it special. Live music, local food, kid activities, and a chance to meet the FWPD board.",
          image: {
            src: "https://wymanparkdell.org/site/wp-content/uploads/2026/01/Wyman-Park-Dell-4.jpg",
            alt: "A community gathering at Wyman Park Dell",
          },
          cta: {
            label: "Learn more",
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
      type: "sectionHeading",
      heading: "How Will You Discover the Dell?",
      width: "medium",
      subheading:
        "The Wyman Park Dell is a 16-acre public park located south of Johns Hopkins University and the Baltimore Museum of Art.",
      align: "center",
      headingColor: "dark",
    },
    {
      type: "activityGrid",
      image: {
        src: `${WP}/2026/01/Dell-Plan.jpg`,
        alt: "Master plan illustration of Wyman Park Dell",
        width: 800,
        height: 660,
      },
      items: [
        {
          label:
            "Stroll the park’s winding paths or people-watch from park benches.",
          icon: {
            src: `${WP}/2021/11/Web-1280-–-1-1.png`,
            alt: "",
            width: 60,
            height: 60,
          },
        },
        {
          label: "Throw a frisbee or kick a soccer ball on the lower lawn.",
          icon: {
            src: `${WP}/2021/11/Web-1280-–-2.png`,
            alt: "",
            width: 60,
            height: 60,
          },
        },
        {
          label:
            "Spend time using the playground, ping-pong table, and Little Library.",
          icon: {
            src: `${WP}/2021/11/Web-1280-–-3.png`,
            alt: "",
            width: 60,
            height: 60,
          },
        },
        {
          label:
            "Explore historic features including the Union Sailors & Soldiers Monument.",
          icon: {
            src: `${WP}/2021/11/Web-1280-–-6.png`,
            alt: "",
            width: 60,
            height: 60,
          },
        },
        {
          label: "Walk your dog.",
          icon: {
            src: `${WP}/2021/11/Web-1280-–-7.png`,
            alt: "",
            width: 60,
            height: 60,
          },
        },
        {
          label: "Picnic at tables in Harriet Tubman Grove.",
          icon: {
            src: `${WP}/2021/11/Web-1280-–-4.png`,
            alt: "",
            width: 60,
            height: 60,
          },
        },
        {
          label: "String up a hammock for an afternoon under the trees.",
          icon: {
            src: `${WP}/2021/11/Web-1280-–-5.png`,
            alt: "",
            width: 60,
            height: 60,
          },
        },
      ],
    },
    {
      type: "testimonial",
      quote:
        "Wyman Park Dell is a beautiful, charming oasis in Charles Village. Great place to unwind, walk your dog, read a book, or just quietly reflect.",
      attribution: "Park Visitor",
    },
    {
      type: "gallery",
      layout: "mosaic",
      paddingTop: "none",
      paddingBottom: "none",
      images: [
        {
          src: `${WP}/2021/11/Home-Page_WPD.jpg`,
          alt: "A sunny day at Wyman Park Dell",
          width: 792,
          height: 792,
        },
        {
          src: `${WP}/2026/01/Wyman-Park-Dell-2.jpg`,
          alt: "Visitors enjoying the lower lawn",
          width: 700,
          height: 467,
        },
        {
          src: `${WP}/2026/01/Wyman-Park-Dell-3.jpg`,
          alt: "Tree-lined slopes of the Dell in fall",
          width: 800,
          height: 533,
        },
        {
          src: `${WP}/2026/01/Wyman-Park-Dell-4.jpg`,
          alt: "A community gathering at Wyman Park Dell",
          width: 800,
          height: 533,
        },
      ],
    },
    {
      type: "followUs",
      paddingTop: "xl",
      paddingBottom: "xl",
    },
  ],
};
