# Report content, written once and rendered to PDF and DOCX by build_report.py.
# Item types: h1, h2, p, bullets, table, fig, figrow, code, pagebreak
SHOTS = "docs/screenshots/"
LIVE = "https://web-3d-portfolio-five.vercel.app"
REPO = "https://github.com/Samrah-Niazi/WEB3d-portfolio"

C = []
def h1(t): C.append(("h1", t))
def h2(t): C.append(("h2", t))
def p(t): C.append(("p", t))
def bullets(*items): C.append(("bullets", list(items)))
def table(header, rows, widths): C.append(("table", header, rows, widths))
def fig(path, caption, width_cm=15.5): C.append(("fig", SHOTS + path, caption, width_cm))
def figrow(paths, caption, width_cm=5.0): C.append(("figrow", [SHOTS + x for x in paths], caption, width_cm))
def code(t): C.append(("code", t))
def pagebreak(): C.append(("pagebreak",))

# ---------------------------------------------------------------- Abstract
h1("Abstract")
p("This report describes the design and development of an interactive 3D web portfolio for Samrah Niazi, a Computer Science and Information Technology student at NED University of Engineering and Technology who specializes in Gaming and Animation. The project combines six pieces of work in one product: a responsive portfolio website with 3D elements built with React and Three.js; an original 3D avatar modelled, rigged and animated in Blender and shown on the site as a GLB file; a 48-second promotional video made in Adobe After Effects and embedded in the site; a Retrieval-Augmented Generation (RAG) chatbot that answers questions about Samrah from her own documents and refuses questions it cannot ground; an email contact system with validation on both the browser and the server and basic spam protection; and a deployment on Vercel with source code on GitHub.")
p("The site opens on a dark maroon look, offers four color palettes each with a dark and a light theme, and works on desktop, tablet and phone. The chatbot answers in English and Urdu and shows the portfolio sections its answers came from. The report explains each module, the decisions behind it, the problems met on the way and how they were solved, and what was tested.")

# ---------------------------------------------------------------- 1
h1("1. Introduction and objectives")
p("A portfolio is the first thing a recruiter or a lecturer sees about a developer. For a game developer a plain page of text undersells the work, so this project treats the portfolio itself as a piece of interactive work: the visitor meets a 3D avatar, watches a short film, scrolls through a game-console themed set of projects and can ask an AI assistant questions in their own language.")
p("The semester project asks for six modules. The table lists them with what was delivered.")
table(["Module", "Requirement", "Delivered"], [
    ["1", "Responsive 3D web portfolio", "React and Three.js site with home, about, skills, projects and achievements, education and experience, contact and gallery sections"],
    ["2", "Custom 3D avatar in Blender", "Original rigged avatar with 8 animations, exported as avatar.glb and shown on the About page; avatar.blend source included"],
    ["3", "After Effects video, 30 to 60 s", "48-second promo with original music, exported as MP4 and embedded; .aep project included"],
    ["4", "RAG-based chatbot", "Markdown knowledge base, chunking, embeddings, vector index, retrieval, Claude answers, source links, two guards against invented answers"],
    ["5", "Email and contact system", "Form with name, email, subject and message; validation in browser and server; honeypot, rate limit and plain-text mail"],
    ["6", "Deployment and documentation", "Live on Vercel; code on GitHub; README, RAG and contact documentation, this report"],
], [2.0, 4.4, 9.6])
p("Beyond the required modules the project adds extra-credit features: dark and light themes with four palettes, mouse-reactive 3D objects, voice input and read-aloud for the chatbot, multilingual chat, avatar gestures, project search, filtering and ordering, privacy-friendly analytics, accessibility support and chatbot source citations.")
p("Live site: " + LIVE)
p("Source code: " + REPO)

# ---------------------------------------------------------------- 2
h1("2. Technology stack")
table(["Area", "Tools", "Why it was chosen"], [
    ["Frontend", "React 19, TypeScript, Vite, Tailwind CSS 4", "Component model for a section-based page, type safety for the content data, fast builds"],
    ["3D on the web", "Three.js, React Three Fiber, drei", "Declarative 3D scenes inside React; GLB loader for the Blender avatar"],
    ["Animation", "Framer Motion, CSS variables", "Small fade and pop effects on scroll, with reduced-motion support"],
    ["Backend", "Node.js, Express, Zod, helmet, express-rate-limit, Nodemailer", "One small API for chat and contact, with schema validation and standard security headers"],
    ["AI", "Gemini embeddings, JSON vector index, Anthropic Claude", "Embeddings for retrieval; Claude writes answers from the retrieved text only"],
    ["3D modelling", "Blender 5.2 (Python script, GLB export)", "Scripted, repeatable avatar with a rig and NLA animations"],
    ["Video", "Adobe After Effects (ExtendScript), aerender, ffmpeg", "Scripted scenes, command-line rendering, H.264 encoding"],
    ["Hosting", "Vercel, GitHub", "Automatic deploy on every push to the main branch"],
], [2.6, 5.4, 8.0])

# ---------------------------------------------------------------- 3
h1("3. System architecture")
p("The browser loads a static React application from Vercel. The application calls two API routes, /api/chat and /api/contact, which run as one Express application. On Vercel the Express code is bundled into a single serverless function with esbuild, so the same code runs locally and in production.")
fig("00-architecture.png", "System architecture: browser, Express API, vector index, Claude, embedding model and SMTP.", 15.5)
p("Content has one source of truth. The text shown on the site lives in frontend/src/data/profile.ts, and the text the chatbot knows lives in backend/data/samrah.md. Counts such as the number of projects are computed from the data, so the site and the chatbot do not drift apart.")

# ---------------------------------------------------------------- 4
h1("4. Module 1: the 3D portfolio website")
h2("4.1 Design direction")
p("The design uses a maroon, black and grey palette with ivory text. The first page is a giant name set behind the shadow of Samrah's portrait, with the introduction and the Download CV and View projects buttons around it. Fonts are Anton for big capitals, Manrope for headings and Inter for body text. Sections fade and pop up slightly as they enter the screen; there are no heavy page transitions, so the page stays quick on a phone.")
fig("01-home.jpg", "Home page: giant name behind the shadow of the portrait, introduction and call-to-action buttons.")
h2("4.2 About, skills and numbers")
p("The About page is a spotlight stage where the Blender avatar sits at a laptop. Visitors drag anywhere on the 3D area to spin it, tap it to make it say hi, and use the move buttons to play other animations. Skills are shown as large moving type, one row per group. The numbers section uses 3D pillars whose heights follow the real counts: 15 projects, 11 of them games, 4 certificates and 2 awards.")
fig("03-about.jpg", "About page with the avatar in the spotlight and the move buttons.")
fig("04-skills.jpg", "Skills and technologies as kinetic type.")
fig("05-numbers.jpg", "By the numbers: 3D pillars scaled to the real counts.")
h2("4.3 Projects and achievements")
p("Projects are shown as game cartridges and achievements as movie tickets, which matches the game-developer theme. Visitors can search by name or technology, filter by category and change the order. Only projects that are deployed or documented publicly are listed; the full counts (11 games and 15 projects in total) appear in the About text, the numbers section and the chatbot.")
fig("06-projects.jpg", "Projects and achievements: tickets for the two TechFest awards and project cartridges.")
fig("06b-projects-search.jpg", "Search applied: typing VR narrows the list.")
h2("4.4 Experience, video and gallery")
fig("08-experience.jpg", "Education and experience timeline that draws as the visitor scrolls.")
fig("07-video.jpg", "Intro video section with the promotional film.")
fig("09-gallery.jpg", "Gallery of floating cards that tilt with the pointer.")
h2("4.5 Themes and palettes")
p("The top bar has a palette picker and a dark or light switch. There are four palettes: Maroon and noir (the default), Black and beige, Emerald and pink, and Indigo and sunset. Each has a dark theme and a genuinely different light theme (a paper-colored page with deep colored panels), not the dark theme turned up in brightness. A new visitor always lands on dark maroon; only a choice made on this site is remembered.")
fig("14b-light-projects.jpg", "Light theme of the Maroon palette.")
fig("16-palette-dark-2.jpg", "A second palette in the dark theme.")
h2("4.6 Responsive design")
p("Layouts were checked at 320, 360, 390, 430, 768 and 1024 pixels wide by loading the site in frames of those widths and measuring every element against the viewport. Problems found this way were fixed: skills rows no longer slide off screen, the 3D pillars scale to the screen width, tickets and the timeline shrink instead of overflowing at 320 px, and on phones the avatar and its move buttons share one screen.")
figrow(["02-home-mobile.jpg", "03b-about-mobile.jpg", "06c-projects-mobile.jpg"], "Phone layout (390 px wide): home, about with the move buttons under the avatar, and projects.", 4.8)
h2("4.7 Accessibility")
p("The page has a skip link, keyboard navigation, labelled form fields and a reduced-motion mode that turns off the scroll effects and the continuous 3D animation for visitors who ask for it.")

# ---------------------------------------------------------------- 5
h1("5. Module 2: the Blender avatar")
h2("5.1 Modelling")
p("The avatar is an original stylized character based on Samrah: round glasses, a dark hijab, a knitted red dress and a laptop on a desk. It is built by a Python script (assets/blender/build_avatar.py) that runs inside Blender 5.2. Building it from a script made every change repeatable: when the pose or the proportions needed to change, the script was edited and re-run instead of editing the mesh by hand.")
p("The head, hair, hijab, glasses, torso, arms, dress, shoes, laptop, desk, plant and mug are separate parts. Each part is assigned rigidly to one bone, so the character moves like a toy figure, which suits the stylized look and keeps the file small.")
h2("5.2 Materials and textures")
p("Materials use Blender's Principled shader with a base color for each part and a knit texture on the dress. Colors follow the site's palette so the avatar looks at home on the page.")
fig("17-blender-avatar.jpg", "The avatar rendered in Blender, seated at the laptop.", 9.0)
h2("5.3 Rig and animations")
p("The rig has 24 bones, including a desk bone and a feet bone. Eight animations are stored as NLA tracks and exported with the model: Idle, Hi, Wave, Nod, Cheer, Twirl, Think and Play. In the seated Idle and Hi poses the desk is shown, so only the upper body is visible and the face is fully visible above the laptop; for the other moves the desk is scaled away so the avatar can stand and move freely.")
fig("19-blender-rig.jpg", "The rig: 24 bones shown over the avatar in its seated pose (hips, spine, chest, neck, head, eyes, arms, hands, skirt, feet).", 9.0)
h2("5.4 Export and integration")
p("The model is exported as GLB (assets/blender/avatar.glb) and copied to frontend/public/models/. The site loads it with React Three Fiber, fits it to a fixed height automatically, loops Idle, and plays Hi when it is tapped. Dragging anywhere on the 3D area rotates the avatar; the listeners sit on the canvas itself and use touch-action pan-y, so a phone user can still scroll the page vertically. The source file avatar.blend is included with the submission.")

# ---------------------------------------------------------------- 6
h1("6. Module 3: the After Effects promo")
h2("6.1 Concept and storyboard")
p("The promo is 48 seconds long, 1920 by 1080 pixels at 30 frames per second. It mixes two reference styles: misty dark 3D scenes with particle title text and serif titles, and bold editorial type with a skills globe and 3D bars. Each scene is its own composition and the main composition (Samrah Niazi Promo) assembles them.")
table(["Scene", "Content"], [
    ["Loading", "Loading bar over a misty maroon background"],
    ["Portrait", "Giant name with a line drawing of the portrait that turns into the photograph"],
    ["Particles", "The name and role built from particles"],
    ["Toolkit", "Skills globe with Unity, Unreal, Blender, Vuforia, XR Toolkit and more"],
    ["Numbers", "Bars growing to 15 projects, 11 games, 4 certificates and 2 awards"],
    ["Work", "Selected game screenshots floating in 3D"],
    ["Paper", "BUILDING WORLDS in editorial type with a halftone portrait"],
    ["Awards", "Winner, Best FYDP and Runner-up, GameCon'26"],
    ["Contact", "Let's talk, with email and profile links"],
], [3.0, 13.0])
fig("18-promo-sheet.jpg", "Frames from the promo, one every four seconds.", 15.5)
fig("20-ae-frame.jpg", "A full-size frame of the promo (at 8 seconds): the portrait scene.", 15.0)
fig("21-ae-timeline.png", "Layer timeline of the main composition: nine scene compositions in sequence over the soundtrack and the shared effect layers.", 15.5)
h2("6.2 Typography, motion and sound")
p("Type pairs a heavy condensed sans for statements with a serif for titles and a small monospace for labels. Effects include Fractal Noise for the mist, CC Ball Action for the particles, Glow, Turbulent Displace, Linear Wipe, a Grid for the floor, 3D layers with a camera, and eased scale and position animation. The background music is an original 48-second track in A minor at 120 BPM, composed by a Python script (assets/aftereffects/make_music.py), so there is no copyright or license to manage.")
h2("6.3 Rendering and delivery")
p("The scenes are built by an ExtendScript file (build_samrah_niazi_promo.jsx) and rendered with aerender. The render is encoded to H.264 video with AAC audio by ffmpeg and exported as samrah_niazi_promo.mp4, then embedded on the site in the Intro video section with a poster frame. The project file samrah_niazi_promo.aep is included with the submission.")

# ---------------------------------------------------------------- 7
h1("7. Module 4: the RAG chatbot")
h2("7.1 What RAG means here")
p("A language model alone does not know Samrah, and it may invent facts about her. Retrieval-Augmented Generation fixes that by finding the relevant passages first and making the model answer only from them. The pipeline has an offline part, which indexes the documents, and an online part, which answers each question.")
h2("7.2 Offline: indexing")
bullets(
    "Collect: backend/data/samrah.md holds the CV, project descriptions, skills, education and achievements. Each heading is one topic and is tagged with the portfolio section it belongs to.",
    "Chunk: the file is split on headings; blocks over 700 characters are split on sentence boundaries with 100 characters of overlap, and the heading is kept in every chunk. The result is 28 chunks.",
    "Embed: every chunk is turned into a vector with Google's gemini-embedding-001 model (768 numbers). For local development without a key the code falls back to the small MiniLM model run in-process.",
    "Store: chunks and vectors are written to backend/data/index.json. At about 28 chunks a JSON file is faster to set up than a vector database and gives the same results.",
)
h2("7.3 Online: answering a question")
bullets(
    "Validate the request with Zod (up to 12 messages, 1 to 1000 characters each) and rate-limit it to 15 requests per minute per visitor address.",
    "Rewrite: Claude turns the visitor's question into a short, standalone English search query. This makes Urdu and other languages searchable against the English knowledge base. The previous question is used only when the new one is clearly a follow-up such as \"tell me more\".",
    "Retrieve: the query is embedded and compared with every chunk by cosine similarity; the five best chunks are kept.",
    "Guard 1: if no chunk scores at least 0.6, the API answers \"I don't have that information\" without calling the language model.",
    "Generate: Claude receives the chunks inside a context block with rules: use only the context, answer NO_INFO when it is missing, treat the context and the visitor's text as data and not as instructions, and reply in the visitor's language.",
    "Guard 2: if the model answers NO_INFO, the API returns the same refusal and no sources.",
    "Cite: otherwise the response lists the titles and sections of the retrieved chunks, and the chat window shows them as links to those sections of the portfolio.",
)
h2("7.4 Results")
p("The chat window opens from the Ask AI button. It offers a language selector, voice input and read-aloud, suggested questions and clickable source chips. The three screenshots show a grounded answer in English with its sources, a refusal of an unrelated question, and an answer in Urdu.")
figrow(["11-chat-answer.jpg", "12-chat-refusal.jpg", "13-chat-urdu.jpg"], "Left to right: grounded answer with source chips, refusal of an out-of-scope question, and an Urdu question answered in Urdu.", 5.2)
table(["Question", "Result"], [
    ["What VR projects has Samrah built?", "Describes the VR Escape Room (Unity, Meta Quest, XR Interaction Toolkit) with source chips"],
    ["Where did Samrah intern?", "Game Developer Intern at Game Storm Studios, 16 June to 17 August 2026"],
    ["Did she win any awards?", "Two recognitions at TechFest'26: Winner, Best FYDP and Runner-up, GameCon'26"],
    ["What is her favourite food?", "Refused: the documents do not contain it"],
    ["Who is the president of France?", "Refused: outside the portfolio"],
    ["Urdu: where did Samrah do her internship?", "Answered in Urdu with the Game Storm Studios experience and sources"],
], [6.2, 9.8])

# ---------------------------------------------------------------- 8
h1("8. Module 5: the email and contact system")
p("The contact section is a doorway-framed form with four fields: name, email, subject and message. The form is handled by POST /api/contact in backend/src/contact.ts.")
table(["Field", "Rule"], [
    ["Name", "2 to 80 characters, no line breaks"],
    ["Email", "Valid address, up to 254 characters"],
    ["Subject", "3 to 120 characters, no line breaks"],
    ["Message", "10 to 2000 characters"],
], [4.0, 12.0])
p("The browser checks these rules first and shows an inline message under each field. The server checks them again with Zod and answers 400 with one message per field, so the rules hold even if someone calls the API directly.")
fig("10-contact-errors.jpg", "Submitting the empty form: inline validation messages under every field.")
h2("8.1 Evidence of delivery")
p("A test message was sent through the form on the live site and arrived in Samrah's inbox. The email comes from the \"Portfolio contact form\" sender, its subject starts with [Portfolio] followed by the visitor's subject, and its body lists the visitor's name, email address, subject and message, so Samrah can reply to the right person.")
fig("15-email-inbox.jpg", "The test message received in the inbox after sending it from the contact form.", 15.0)
h2("8.2 Spam protection and safe handling of input")
bullets(
    "Honeypot: a hidden field that people never see; bots fill it in. The server answers \"success\" but sends nothing.",
    "Minimum fill time: forms sent less than 3 seconds after the page loaded are dropped the same way.",
    "Rate limits: 5 messages per hour per address (HTTP 429 afterwards) and 60 API requests per minute overall.",
    "Header injection: name and subject may not contain line breaks, so a visitor cannot add headers such as Bcc.",
    "Plain-text mail: the message is never sent as HTML, so markup or scripts inside it are never interpreted. Control characters are stripped.",
    "Limits and headers: request bodies are capped at 20 KB, helmet sets security headers, and CORS allows only the site's own origin.",
)
h2("8.3 Credentials")
p("The SMTP user and password, the recipient address and the API keys are read from environment variables: backend/.env locally and the host's settings on Vercel. The .env file is excluded from Git, and the repository only contains .env.example with empty values. If credentials are missing the endpoint answers 503 and the form shows an error message instead of pretending to succeed. Every send is also logged with the SMTP message id.")

# ---------------------------------------------------------------- 9
h1("9. Extra features")
table(["Feature", "How it works"], [
    ["Interactive 3D", "The hero, gallery cards, 3D pillars and avatar react to the pointer; cards tilt toward it"],
    ["Dark and light themes", "A switch in the top bar, with four palettes, each with a distinct light theme"],
    ["Voice interaction", "Microphone input with the browser speech API and optional read-aloud of answers"],
    ["Multilingual chatbot", "Language selector; tested in English and Urdu, with the answer written in the chosen language"],
    ["Avatar gestures", "Eight animations, blinking, drag to spin, tap to say hi"],
    ["Project search, filter and ordering", "Search box, category buttons and a Featured first or A to Z order"],
    ["Analytics", "Privacy-friendly page and chat events, reported once the site is on Vercel"],
    ["Accessibility", "Skip link, keyboard navigation, labelled fields, reduced-motion mode"],
    ["Citations", "Source chips under each chatbot answer link to the matching portfolio section"],
], [4.6, 11.4])

# ---------------------------------------------------------------- 10
h1("10. Testing")
table(["Area", "What was tested", "Result"], [
    ["Chatbot, in scope", "VR projects, internship, awards", "Correct answers with sources"],
    ["Chatbot, out of scope", "Favourite food, president of France", "Politely refused, no sources"],
    ["Chatbot, language", "Internship question in Urdu, language set to Urdu", "Answered in Urdu with sources"],
    ["Contact form", "Empty submission", "Inline errors in the browser; the API returns 400 with a message per field"],
    ["Contact form, delivery", "Valid message sent from the live site", "Email arrived in the inbox with the visitor's details (section 8.1)"],
    ["Responsive layout", "320, 360, 390, 430, 768 and 1024 px wide", "No element wider than the screen after the fixes in section 4.6"],
    ["Themes", "Four palettes, dark and light", "All sections readable; light themes differ from dark"],
    ["Projects", "Search, category filter and ordering", "Results update immediately"],
    ["Build", "Production build of the frontend and the API bundle", "Both build without errors"],
], [3.6, 6.4, 6.0])

# ---------------------------------------------------------------- 11
h1("11. Challenges and lessons")
bullets(
    "After Effects 2023 crashed on the project. The promo was built in After Effects 2022, and opening it in 2023 made the program close at once. The cause was GPU-accelerated effects. The project was re-saved with the renderer set to software mode, which opens and renders in 2023 as well, and the same file is the one included in the submission.",
    "The render lost its last six seconds. After Effects stopped with an output-module error near the end of the full render. Rendering in three chunks (frames 0 to 479, 480 to 959 and 960 to 1439) and joining them with ffmpeg solved it.",
    "Alignment on phones. The first version looked right on a laptop but moved out of place on a phone. Testing at fixed widths and measuring element boxes found the cases, and the fixes are listed in section 4.6. The avatar also had to be easy to spin with a thumb, which led to listening on the whole canvas.",
    "Embeddings on Vercel. The first design used a small local embedding model, which is too heavy for a serverless function. The hosted build now uses Gemini embeddings, with the local model kept for development. Because the two models score differently, the similarity threshold is 0.6 for Gemini and 0.22 for the local model.",
    "A chatbot bug found while writing this report. Short questions were joined with the previous question before searching. After a refused question, an Urdu question of five words was searched together with it and was refused too. The fix is to let Claude rewrite every question into a standalone English query and use the previous question only for real follow-ups; the tests in section 10 were repeated after the fix.",
    "The chatbot caches the index in memory, so after changing the knowledge file the index must be rebuilt and the server restarted.",
)

# ---------------------------------------------------------------- 12
h1("12. Deployment")
p("The frontend is deployed on Vercel with the frontend folder as the project root. The file frontend/vercel.json rewrites /api requests to frontend/api/index.js, which is the Express application bundled by npm run bundle in the backend folder. The environment variables (Anthropic key, Gemini key, SMTP user and password, recipient, allowed origin) are set in the Vercel project settings and are never committed. Every push to the main branch of the GitHub repository deploys automatically.")
table(["Item", "Link"], [
    ["Live portfolio", LIVE],
    ["GitHub repository", REPO],
], [4.0, 12.0])
p("To run the project locally, install the dependencies in the frontend and backend folders, create backend/.env from .env.example, then start the API (npm run dev in backend, port 5000) and the site (npm run dev in frontend, port 5173). The README gives the full steps.")

# ---------------------------------------------------------------- 13
h1("13. Conclusion and future work")
p("The project delivers all six modules as one connected product: the website carries the avatar, the video and the chatbot, and the contact form sends visitors' messages to Samrah's inbox. The most useful lessons were to script everything that has to be repeated (the avatar, the video and the embeddings index), to test the layout on real widths instead of trusting a laptop view, and to give the chatbot two ways of saying \"I don't know\".")
p("Future work: keep adding new projects, including the final year project TALEEM360, to the portfolio and the knowledge base; test the chatbot in the remaining interface languages (Arabic, Hindi, Spanish and French); and add a set of test questions with expected answers so that changes to retrieval can be measured.")

# ---------------------------------------------------------------- Appendix
h1("Appendix: repository contents")
table(["Path", "Contents"], [
    ["frontend/", "React application, 3D scenes, content data, public assets (avatar.glb, promo.mp4, CV)"],
    ["backend/", "Express API, RAG code (chunk, embed, store, answer), contact system, knowledge file and vector index"],
    ["assets/blender/", "avatar.blend, avatar.glb and build_avatar.py"],
    ["assets/aftereffects/", "samrah_niazi_promo.aep, samrah_niazi_promo.mp4, build and render scripts, footage, music script"],
    ["docs/", "RAG pipeline, contact system, screenshots, this report"],
    ["README.md", "Setup, run and deploy instructions"],
], [4.6, 11.4])
