// Single source of truth for every event fact. The page and Heckr's system
// prompt both read from here, so edit facts in this file only.

export const EVENT = {
  name: "Build Open",
  fullName:
    "Build Open, Hacktoberfest Hack Day Galway x Cybersecurity Society, University of Galway",
  dateLabel: "Thursday 29 October 2026",
  dateISO: "2026-10-29", // event day in Europe/Dublin
  timeZone: "Europe/Dublin",
  venue: "The Cube, Áras na Mac Léinn, University of Galway",
  hosts:
    "Cybersecurity Society, University of Galway (founded 2024, a fun space to learn from peers)",
  partner: "MLH",
  sponsor: "Liberty IT",
  checkinCode: "M77TWAB6",
} as const;

export type Milestone = { time: string; label: string; key: string };

export const SCHEDULE: Milestone[] = [
  { time: "11:00", label: "Doors open and check-in", key: "doors" },
  { time: "12:00", label: "Hacking begins", key: "hack" },
  { time: "14:00", label: "Pizza", key: "pizza" },
  { time: "15:30", label: "Projects due", key: "due" },
  { time: "15:45", label: "Judging starts", key: "judging" },
  { time: "16:45", label: "Judging ends", key: "judged" },
  { time: "17:00", label: "Close", key: "close" },
];

export const TRACKS = [
  {
    name: "Best Open-Source AI Project",
    summary: "Build an original project that uses open-source or open-weight AI.",
    prize: "MLH + DEV swag bag",
    link: "https://mlh.com/opensource-ai",
  },
  {
    name: "Best Gemma Project",
    summary: "Build an original project using Google's Gemma open models.",
    prize: "MLH + DEV branded bags",
    link: "https://mlh.link/hackdays-gemma-demo",
  },
];

// Themes mirror the five DEV Hacktoberfest 2026 challenges (dev.to/challenges/hf26).
// Descriptions are paraphrased from each challenge page.
export const THEMES = [
  {
    n: 1,
    name: "Build it for a friend",
    description:
      "Pick one real person you care about and solve a real problem for them. Small is fine, as long as it matters to them.",
    link: "https://dev.to/challenges/hacktoberfest-weekend-2026-10-01",
  },
  {
    n: 2,
    name: "Touch Grass",
    description:
      "Use open AI to get people off their screens and out into the world, like a bird-call identifier that works on a trail with no signal.",
    link: "https://dev.to/challenges/hacktoberfest-week1-2026-10-05",
  },
  {
    n: 3,
    name: "Side Hustle",
    description:
      "Build something small, specific and useful that someone would actually pay for: a freelancer, a local business, a niche hobby group.",
    link: "https://dev.to/challenges/hacktoberfest-week2-2026-10-12",
  },
  {
    n: 4,
    name: "Slow & Steady",
    description:
      "Build something that rewards laziness: a tool that quietly does the boring work so you can do less.",
    link: "https://dev.to/challenges/hacktoberfest-week3-2026-10-19",
  },
  {
    n: 5,
    name: "Ghost in the Machine",
    description:
      "Make something spooky, or something that honours the past in the spirit of Día de los Muertos.",
    link: "https://dev.to/challenges/hacktoberfest-week4-2026-10-26",
  },
];

export const LINKS = {
  checkin: { label: "Check in", href: "https://www.mlh.com/checkin" },
  submit: { label: "Submit your project", href: "https://events.mlh.com/events/15558" },
  dev: {
    label: "Write it up on DEV Challenges",
    note: "for promo credits and sponsor prizes",
    href: "https://mlh.link/dev-hacktoberfest",
  },
  promos: { label: "Free partner credits and promos", href: "https://hacktoberfest.com/my/promos" },
  gemma: { label: "Gemma demo", href: "https://mlh.link/hackdays-gemma-demo" },
  mlhDiscord: { label: "MLH Community Discord", href: "https://mlh.link/Discord" },
  ourDiscord: { label: "Our Discord", href: "https://discord.gg/eUSWQb7jg" },
  coc: { label: "Code of conduct", href: "https://mlh.io/code-of-conduct" },
  incidents: { label: "incidents@mlh.io", href: "mailto:incidents@mlh.io" },
  feedback: { label: "Give feedback", href: "https://mlh.link/gemma-hack-day-feedback" },
  eventPage: {
    label: "Event page",
    href: "https://events.mlh.com/events/15558-hacktoberfest-hack-day-galway-x-cybersecurity-society-university-of-galway",
  },
} as const;

// Organiser-built resource, featured on the page and known to Heckr.
export const OWNABLE = {
  name: "Ownable",
  tagline: "Build it. Ship it. Own it.",
  href: "https://ownable.muhammadmurtuza.com",
  blurb:
    "An AI mentor built by one of your organisers. It guides you step by step through building a real app with free, open-source tools, and shows the full cost before you start.",
};

// Drop logo files into /public/logos/ with these names. Missing files fall back to text.
export const LOGOS = [
  { src: "/logos/mlh.svg", alt: "MLH", caption: "Partner" },
  { src: "/logos/cybersecurity-society.png", alt: "Cybersecurity Society, University of Galway", caption: "Host" },
  { src: "/logos/liberty-it.svg", alt: "Liberty IT", caption: "Exclusive industry sponsor" },
];
