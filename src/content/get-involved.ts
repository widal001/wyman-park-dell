import type { PageContent } from "../types/content";

const WP = "https://wymanparkdell.org/site/wp-content/uploads";

export const getInvolved: PageContent = {
  slug: "get-involved",
  title: "Get involved",
  metaDescription:
    "Become a Friend of the Dell. Donate, volunteer, or partner with the Friends of Wyman Park Dell to help keep this Baltimore park accessible and extraordinary for everyone.",
  blocks: [
    {
      type: "hero",
      variant: "standard",
      heading: "Become a Friend of the Dell",
      image: {
        src: `https://pub-793f2ed4365042cb96f36d101a563f6e.r2.dev/241433689_10159395889436061_7809489849254585591_n.jpg`,
        alt: "Friends of Wyman Park Dell volunteers gathered for a clean-up",
      },
    },
    {
      type: "sectionHeading",
      variant: "lead",
      width: "medium",
      heading:
        "The Dell is almost entirely supported by people like you. As a nonprofit, the Friends of Wyman Park Dell need your support to keep this public space accessible — and extraordinary — for everyone.",
      align: "center",
      headingColor: "dark",
    },
    {
      type: "textWithMedia",
      heading: "Make a donation",
      mediaPosition: "left",
      image: {
        src: `https://pub-793f2ed4365042cb96f36d101a563f6e.r2.dev/Volunteer.jpg`,
        alt: "Volunteers gathered at Wyman Park Dell",
      },
      html: `
        <p>Donors like you are critical to maintaining, beautifying, and programming the Dell. Donate today by making a one-time gift or setting up a recurring donation to maximize your impact.</p>
        <p>Prefer to give by mail? Make checks payable to the <strong>Friends of Wyman Park Dell</strong> and send them to:</p>
        <p>Friends of Wyman Park Dell<br />1008 West 42nd Street<br />Baltimore, MD 21211</p>
      `,
      ctas: [
        {
          label: "Donate online",
          href: "https://wymanparkdell.org/donate/",
          variant: "outline",
          external: true,
        },
      ],
    },
    {
      type: "volunteerForm",
      heading: "Become a volunteer",
      mediaPosition: "right",
      image: {
        src: `https://pub-793f2ed4365042cb96f36d101a563f6e.r2.dev/Get-Involved-2-1.jpg`,
        alt: "Volunteers smiling after a Wyman Park Dell clean-up",
      },
      html: `
        <p>The Dell needs you!</p>
        <p>Keep an eye on the <a href="/events/">Events Page</a> for upcoming park maintenance days or sign up to receive opportunities in your inbox.</p>
      `,
      submitLabel: "Sign up",
    },
    {
      type: "testimonial",
      quote:
        "We’re always looking to collaborate with local businesses and organizations. Email us if you’d like to collaborate on making something happen at the Dell.",
      attribution: "Friends of Wyman Park Dell",
    },
    {
      type: "gallery",
      layout: "mosaic",
      images: [
        {
          src: `https://pub-793f2ed4365042cb96f36d101a563f6e.r2.dev/WPD_Volunteer_1.jpg`,
          alt: "Volunteers gathered at Wyman Park Dell",
        },
        {
          src: `https://pub-793f2ed4365042cb96f36d101a563f6e.r2.dev/WPD_Volunteer_2.jpg`,
          alt: "FWPD volunteers tending to the park",
        },
        {
          src: `https://pub-793f2ed4365042cb96f36d101a563f6e.r2.dev/WPD_Volunteer_3.jpg`,
          alt: "A volunteer working in the Dell",
        },
        {
          src: `https://pub-793f2ed4365042cb96f36d101a563f6e.r2.dev/WPD_Volunteer_4.jpg`,
          alt: "Volunteers smiling after a clean-up",
        },
      ],
    },
  ],
};
