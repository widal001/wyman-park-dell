import type { PageContent } from '../types/content';

const WP = 'https://wymanparkdell.org/site/wp-content/uploads';

export const about: PageContent = {
  slug: 'about-the-park',
  title: 'About the Park',
  metaDescription:
    'The Wyman Park Dell is a 16-acre Olmsted-designed public park in Central Baltimore. Read about its history, master plan, and Harriet Tubman Grove.',
  blocks: [
    {
      type: 'hero',
      variant: 'standard',
      heading: 'About Wyman Park Dell',
      image: {
        src: `${WP}/2021/11/About_Dell.jpg`,
        alt: 'Wyman Park Dell from above',
      },
    },
    {
      type: 'textWithMedia',
      heading: 'Park History',
      mediaPosition: 'left',
      image: {
        src: `${WP}/2021/12/Park-History.jpg`,
        alt: 'Historic photograph of the Wyman Park Dell',
      },
      html: `
        <p>The Wyman Park Dell is a 16-acre public park that is a landmark in Central Baltimore. Located south of Johns Hopkins University and the Baltimore Museum of Art, it is surrounded by two neighborhoods: Charles Village to the east and south, and Remington to the west.</p>
        <p>The Dell is noted for its steep enclosing slopes and a large, sweeping lower lawn. It is one of the few parks in Baltimore fully conceived and designed by the Olmsted Brothers, the landscape architecture firm responsible for the City's first comprehensive park system plan in 1904.</p>
      `,
      ctas: [
        {
          label: 'Wyman Park & the Dell',
          href: 'https://drive.google.com/file/d/0B0AAMIyar9c0TDlNaVhQY09NNVdGMUM1NmtKRGtDd2JjeUJn/view?resourcekey=0-rJ0bR9EfnlPTePnDr4RPRw',
          external: true,
        },
        {
          label: 'Olmsted Brothers’ Vision',
          href: 'https://www.olmstedmaryland.org/olmsted-brothers-vision-for-wyman-and-the-stony-run-stream-valley/',
          external: true,
        },
      ],
    },
    {
      type: 'timeline',
      eyebrow: 'Wyman Park',
      heading: 'Master Plan',
      entries: [
        {
          date: 'Early 2000s',
          title: 'Developing the Master Plan',
          body:
            'The Wyman Park Dell Master Plan Steering Committee engaged local landscape architecture firm Mahan Rykiel Associates to lead the local community in developing a Master Plan for the Dell. The master plan process was grounded in community-based planning with involvement from the surrounding communities and institutions.',
        },
        {
          date: 'August 2006',
          title: 'Plan Approved',
          body:
            'The plan was presented by the Baltimore City Department of Recreation and Parks to the Baltimore City Commission for Historical and Architectural Preservation (CHAP) and approved with the exception of two items.',
        },
        {
          date: '2010',
          title: 'Dry Stone Wall Restored',
          body: 'Restoration of the dry stone wall in the Lower Dell, an important Dell icon.',
        },
        {
          date: '2013',
          title: 'Park Information Board Installed',
          body:
            'Welcome signs with message boards at the main entrances to the park are installed to orient visitors and provide space to market community events.',
        },
        {
          date: '2015',
          title: 'Playground Constructed',
          body:
            'Baltimore City Department of Recreation and Parks constructs a new playground in the Dell. Ping Pong Baltimore partners with FWPD to install a ping pong table nearby.',
        },
        {
          date: '2016',
          title: 'Shade Sail Installed',
          body:
            'As an extension of the playground project, a shade sail is installed with support from the Homewood Community Partners Initiative.',
        },
        {
          date: '2017',
          title: 'Tree Pruning',
          body: 'A grant from the Johns Hopkins Neighborhood Fund helps prune trees to improve safety and visibility.',
        },
        {
          date: '2020',
          title: 'Slope Clearing',
          body: 'The FWPD crowdfunds money to hire Eco-Goats to clear the “BMA Slope” of invasive vegetation.',
        },
      ],
    },
    {
      type: 'cta',
      background: 'bar',
      heading: 'What improvements would you like to see at the park?',
      ctas: [
        {
          label: 'Contact us with suggestions and comments',
          href: 'https://wymanparkdell.org/contact/',
          external: true,
        },
      ],
    },
    {
      type: 'twoColumnText',
      background: 'raised',
      alignAcross: false,
      paddingTop: 'none',
      leftHtml: `
        <p>The Wyman Park Dell Master Plan process was underwritten through a generous grant from the <a href="https://www.goldsekerfoundation.org/" target="_blank" rel="noopener noreferrer">Goldseker Foundation</a> with additional contributions from the <a href="https://artbma.org/" target="_blank" rel="noopener noreferrer">Baltimore Museum of Art</a>, <a href="https://www.jhu.edu/" target="_blank" rel="noopener noreferrer">Johns Hopkins University</a>, the Friends of Wyman Park Dell, Remington community members, the <a href="https://charlesvillage.org/" target="_blank" rel="noopener noreferrer">Charles Village Civic Association</a>, the <a href="https://www.olmstedmaryland.org/" target="_blank" rel="noopener noreferrer">Friends of Maryland's Olmsted Parks and Landscapes</a>, the <a href="https://bcrp.baltimorecity.gov/" target="_blank" rel="noopener noreferrer">Baltimore City Department of Recreation and Parks</a>, and the <a href="https://www.bcf.org/" target="_blank" rel="noopener noreferrer">Baltimore Community Foundation</a>.</p>
      `,
      rightHtml: `
        <p>The Friends of Wyman Park Dell continue to implement the Master Plan with the support of volunteers and Baltimore's philanthropic community.</p>
      `,
      ctas: [
        {
          label: 'Learn more about the Friends of Wyman Park Dell',
          href: '/friends-of-wyman-park-dell/',
        },
      ],
    },
    {
      type: 'textWithMedia',
      heading: 'Harriet Tubman Grove',
      mediaPosition: 'right',
      image: {
        src: `${WP}/2021/11/WPD_Harriet-Tubman-Grove.jpg`,
        alt: 'Harriet Tubman Grove at Wyman Park Dell',
      },
      html: `
        <p>The grove on the western plateau of the Dell is now named in honor of Harriet Tubman, an abolitionist and “conductor” on the Underground Railroad. At a community celebration on March 10, 2018, Tubman’s living descendants joined community residents, local activists, and City and State officials to rededicate the area of Wyman Park Dell where a Confederate monument once stood. The monument base remains.</p>
        <p>The Lee and Jackson Monument was removed from the Dell on August 16, 2017, as national debate around Confederate monuments intensified after deadly white supremacist violence in Charlottesville, Virginia. More information is available through the <a href="https://chap.baltimorecity.gov/confederate-monuments" target="_blank" rel="noopener noreferrer">Baltimore Commission on Historical and Architectural Preservation</a> and the <a href="https://baltimoreplanning.wixsite.com/monumentcommission/leeandjacksonmonument" target="_blank" rel="noopener noreferrer">Special Commission to Review Baltimore’s Confederate Monuments</a>.</p>
        <p>In 2020, placemaking and <a href="https://www.baltimoresun.com/maryland/baltimore-city/bs-md-ci-harriet-tubman-grove-signs-wyman-park-dell-20200914-frw5es5rhjdidczjnjdlbfhzl4-story.html" target="_blank" rel="noopener noreferrer">interpretive signage</a> was installed in the grove in collaboration with Baltimore City Department of Recreation and Parks and the Commission for Historical and Architectural Preservation. This project was made possible by the Baltimore National Heritage Area.</p>
      `,
    },
    {
      type: 'gallery',
      layout: 'mosaic',
      images: [
        {
          src: `${WP}/2021/11/WPD_Park_Stairs.jpg`,
          alt: 'Stone stairs leading into the Dell',
        },
        {
          src: `${WP}/2021/11/WPD_Fall.jpg`,
          alt: 'Wyman Park Dell in fall',
        },
        {
          src: `${WP}/2021/11/WPD_Summer.jpg`,
          alt: 'Wyman Park Dell in summer',
        },
        {
          src: `${WP}/2021/11/WPD_Winter.jpg`,
          alt: 'Wyman Park Dell in winter',
        },
      ],
    },
    {
      type: 'testimonial',
      quote: 'Great little slice of nature in the middle of Charles Village.',
      attribution: 'Park Visitor',
    },
  ],
};
