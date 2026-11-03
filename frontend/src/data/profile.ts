// Single source of content for the site. Source: CV (Samrah_Niazi_.pdf).
export const profile = {
  name: "Samrah Niazi",
  role: "Game Developer · AR/VR · Gameplay Programmer",
  tagline:
    "I build Unity and Unreal experiences: 2D/3D games, AR/VR systems, gameplay mechanics, and player-facing UI.",
  about: [
    "I'm a Computer Science and Information Technology student at NED University of Engineering and Technology (2023–2027), specializing in Gaming & Animation.",
    "I build Unity and Unreal experiences, including 2D/3D games, AR/VR systems, gameplay mechanics, and player-facing UI. I'm interested in gameplay programming, level design, and immersive interactive experiences.",
    "My final year project, TALEEM360, is an AI-powered bilingual AR learning companion that turns textbook diagrams into interactive 3D STEM models for government-school students.",
  ],
  email: "samrahniazi677@gmail.com",
  github: "https://github.com/samrah-niazi",
  linkedin: "https://www.linkedin.com/in/samrah-niazi-3176ab323",
  itch: "https://samrah-niazi.itch.io",
};

export const stats = [
  { value: "7", label: "Game projects" },
  { value: "2", label: "Awards at TechFest'26" },
  { value: "3", label: "Engines & platforms: Unity, Unreal, Meta Quest" },
];

export const skills = [
  {
    group: "AR/VR & Computer Vision",
    items: ["AR marker/image tracking", "Vuforia", "XR Interaction Toolkit", "Meta Quest", "VR locomotion", "Spatial UI"],
  },
  {
    group: "Game Development",
    items: ["Unity 2D/3D", "Unreal Engine", "C#", "C/C++", "Gameplay programming", "Level design"],
  },
  {
    group: "HCI & UI/UX",
    items: ["Player onboarding flows", "Menu and HUD design", "Interaction feedback systems"],
  },
  {
    group: "Programming",
    items: ["C#", "C/C++", "Python", "SQL", "HTML", "CSS", "JavaScript"],
  },
  {
    group: "Tools",
    items: ["Git/GitHub", "VS Code", "MySQL Workbench", "PostgreSQL", "XAMPP", "Blender (basics)", "After Effects (basics)"],
  },
];

// Something a card can open in the pop-up viewer.
export type Media = { type: "image" | "video"; src: string; title: string; label: string; alt?: string };

const TRAILER: Media = {
  type: "video",
  src: "/video/taleem360-trailer.mp4",
  title: "TALEEM360 trailer",
  label: "Watch trailer",
};
const INTERN_LETTER: Media = {
  type: "image",
  src: "/images/internship-letter.jpg",
  title: "Internship completion letter, Game Storm Studios",
  label: "View completion letter",
  alt: "Internship completion letter from Game Storm Studios certifying Samrah Niazi as a Game Developer intern",
};

const UNBROKEN_OATH: Media = {
  type: "video",
  src: "/video/unbroken-oath.mp4",
  title: "The Unbroken Oath gameplay",
  label: "Watch gameplay",
};

export type Project = {
  title: string;
  stack: string;
  summary: string;
  tags: string[];
  category: "Game" | "Research" | "Web & Software";
  featured?: boolean;
  media?: Media;
  repo?: string; // GitHub repository URL
  play?: string; // where to play it (itch.io)
};

export const projects: Project[] = [
  {
    title: "TALEEM360",
    stack: "AR · Computer Vision · AI · Final Year Design Project",
    summary:
      "AI-powered bilingual augmented reality learning companion. AR marker and computer-vision recognition turn textbook diagrams into interactive 3D STEM models, with bilingual explanations and a curriculum-constrained AI companion.",
    tags: ["AR", "Computer Vision", "AI"],
    category: "Research",
    featured: true,
    media: TRAILER,
  },
  {
    title: "The Unbroken Oath",
    stack: "Unity 3D · First-Person Tactical Rescue Shooter",
    summary:
      "Rescue three captured teammates from a temple in Operation Sun Temple, fighting from a bright morning into a night storm. Rescue cutscenes, cookable grenades, a minimap and full map, an operator voice assistant, and dynamic weather. The characters are modeled with the faces of the developer and her team.",
    tags: ["Unity", "FPS", "C#", "Cinematics"],
    category: "Game",
    featured: true,
    media: UNBROKEN_OATH,
    repo: "https://github.com/Samrah-Niazi/The-Unbroken-Oath",
    play: "https://samrah-niazi.itch.io/the-unbroken-oath",
  },
  {
    title: "The Abduction",
    stack: "Unity 3D · Horror Escape · Third-person",
    summary:
      "A kidnapped boy must escape a dark abandoned asylum by solving linked clues, collecting items, and surviving guards and air patrols. Riddle-based progression, enemy sight and noise detection with patrol AI, and atmospheric lighting.",
    tags: ["Unity", "Horror", "Puzzle", "AI"],
    category: "Game",
    repo: "https://github.com/Samrah-Niazi/The-Abduction",
    play: "https://samrah-niazi.itch.io/the-abduction",
  },
  {
    title: "VR Escape Room",
    stack: "Unity 3D · VR Escape Room · Meta Quest",
    summary:
      "VR escape room built with XR Interaction Toolkit: hand/controller interaction, teleportation, object grabbing, and socket-based puzzle UI.",
    tags: ["Unity", "VR", "XR"],
    category: "Game",
    repo: "https://github.com/Samrah-Niazi/Escape_VR_Room",
  },
  {
    title: "Spikes Rush",
    stack: "Unreal Engine 5.7 · Blueprints · Endless Runner",
    summary:
      "An endless runner set inside the bloodstream: run as a germ, collect bacteria, grab a magnet power-up, and dodge syringes and white blood cells. Built entirely with Blueprints, with a saved high score and a curved-world material that bends the track.",
    tags: ["Unreal", "Blueprints", "Endless runner"],
    category: "Game",
    repo: "https://github.com/Samrah-Niazi/Spikes-Rush",
  },
  {
    title: "Warp: Fractured Reality",
    stack: "Unity 6 · Local Co-op Sci-fi Runner",
    summary:
      "Two-player split-screen co-op runner: two scientists escape a collapsing warp tunnel by dodging barriers and rewinding hazards, and by using warp pickups to clear the way. Both players must reach the end to win. A re-themed version of the game-jam project The Masked Regime.",
    tags: ["Unity", "Co-op", "Split-screen", "C#"],
    category: "Game",
    repo: "https://github.com/Samrah-Niazi/Warp-Fractured-Reality",
    play: "https://samrah-niazi.itch.io/warp-fractured-reality",
  },
  {
    title: "Super Jump",
    stack: "Unity 2D · Platformer",
    summary:
      "2D platformer where you jump across obstacles, collect coins, burgers and drinks, and survive with 5 lives. Tilemap-based levels, a bird companion with a custom follow script, and a collectibles UI.",
    tags: ["Unity", "2D", "C#"],
    category: "Game",
    play: "https://samrah-niazi.itch.io/super-jump",
  },
  {
    title: "Spot the Difference",
    stack: "Unity 2D · Game Storm Studios internship project",
    summary: "Level-based 2D spot-the-difference puzzle game, with level design and difficulty refined through tester feedback.",
    tags: ["Unity", "2D", "Mobile"],
    category: "Game",
  },
  {
    title: "NED Masters Admissions Portal",
    stack: "PHP · MySQL · Web Application",
    summary: "Admissions web app with a responsive student UI, admin panel, and PHP/MySQL backend with form validation.",
    tags: ["PHP", "MySQL", "Web"],
    category: "Web & Software",
  },
  {
    title: "AI Code Mentor",
    stack: "Python · Flask · TinyLlama (Ollama) · JavaScript",
    summary:
      "Full-stack web app that uses TinyLlama through Ollama to analyze and explain Python code and spot bugs in real time, with speech synthesis. A Flask backend, a JavaScript front end, and a local open-source model.",
    tags: ["Python", "Flask", "AI"],
    category: "Web & Software",
    repo: "https://github.com/Samrah-Niazi/AI_code_mentor",
  },
  {
    title: "Cyber Cafe Management System",
    stack: "C++ / SFML · OOP",
    summary: "OOP-based management system with a graphical interface for managing inventory and bookings.",
    tags: ["C++", "SFML", "OOP"],
    category: "Web & Software",
  },
];

export const achievements = [
  { title: "Runner-up, GAMECON'26", link: "https://lnkd.in/p/dyt3bmSK", detail: "with The Unbroken Oath, at TechFest'26 by Dept. of CSIT, NEDUET." },
  { title: "Winner, Best FYDP", link: "https://lnkd.in/p/ddcBM9Kg", detail: "at the NEDUET FYDP Exhibition, TechFest'26 by Dept. of CSIT, NEDUET." },
];

export const timeline = [
  {
    period: "2023 – 2027",
    type: "Education",
    title: "Bachelor of Computer Science and Information Technology",
    place: "NED University of Engineering and Technology · Specialization in Gaming & Animation",
    detail:
      "Coursework: Graphics Design, Fundamentals of Game Development, Regulations and Ethics in Gaming Industry, Game Programming, Design of AR and VR Applications, Game Design and Development, Video Games and Creative Writing.",
  },
  {
    period: "Jul 2026 – Jun 2027",
    type: "Research",
    title: "TALEEM360, Final Year Design Project",
    place: "Supervisor: Sadia Arshad · Co-Supervisor: Dr. Usman Amjad",
    detail: "Dissertation in progress. Publication planned on completion.",
    media: TRAILER,
  },
  {
    period: "16 Jun – 17 Aug 2026",
    type: "Experience",
    title: "Game Developer Intern",
    place: "Game Storm Studios",
    detail:
      "Designed game levels and integrated art and UI assets into Unity, building interactive systems and menu/HUD flows. Packaged iterative builds for QA review and used tester feedback to refine a playable Android title.",
    media: INTERN_LETTER,
  },
  {
    period: "Jun – Aug 2026",
    type: "Experience",
    title: "Game & Backend Developer",
    place: "Self-employed (independent)",
    detail: "Built a real-time multiplayer Ludo game in Unity, plus the Laravel admin panel and the Node.js backend (with load balancing) that runs it.",
  },
  {
    period: "Oct 2025 – Jan 2026",
    type: "Experience",
    title: "Teaching Assistant, Object-Oriented Programming",
    place: "NED University, Dept. of CSIT",
    detail: "Delivered OOP lectures and academic support, mentoring students on debugging, design decisions, and core programming concepts.",
  },
];

export const certificates = [
  { title: "Unity 2D & 3D Game Dev", issuer: "NED University of Engineering and Technology" },
  { title: "Pre-Production", issuer: "CEGA (Centre of Excellence for Gaming and Animation)" },
  { title: "Post-Production (Adobe After Effects)", issuer: "CEGA (Centre of Excellence for Gaming and Animation)" },
  { title: "Unreal Engine", issuer: "CEGA (Centre of Excellence for Gaming and Animation)" },
];

export const community = [
  "Volunteer, TechFest (CSIT, NED University): helped organize coding competitions, contests, workshops, and seminars.",
  "Member, Gameverse: hosted society events and contributed to planning and organization.",
  "Volunteer & Photographer, TNF and SOFE: supported event operations and photography.",
  "Co-Lead, Marketing (NST) · Co-Lead, Photography (SOFE) · Former Member, Operations (TNF).",
  "Participated in TechFest, GameCon (NED and CEGA), and a Game Jam at IBA University.",
  "Attended hands-on Blender and 3D modelling workshops, including “3D Design in Blender” at TechFest.",
];
