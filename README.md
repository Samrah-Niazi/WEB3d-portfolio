# Interactive 3D Web Portfolio: Samrah Niazi

A responsive portfolio with a 3D hero and avatar (React + Three.js), a RAG-based AI chatbot, and an email contact system (Node + Express).

## Module status

| Module | State |
|---|---|
| 1. 3D portfolio site | Done |
| 2. Blender avatar | Done: `assets/blender/avatar.blend` (source), `avatar.glb` (web export, copied to `frontend/public/models/`), built by `assets/blender/build_avatar.py` from `assets/reference/profile-reference-2.jpg` |
| 3. After Effects video | Done: `assets/aftereffects/samrah_niazi_promo.aep` and `samrah_niazi_promo.mp4` (48 s, original music), embedded on the site |
| 4. RAG chatbot | Done ([how it works](docs/rag-pipeline.md)) |
| 5. Contact system | Done ([details](docs/contact-system.md)) |
| 6. Deployment and docs | Docs done. Redeploy the new design to Vercel, then fill in the live URL, screenshots and the PDF report |

Design: four palettes you can switch from the top bar (Maroon & noir, Black & beige, Emerald & pink, Indigo & sunset), each with a dark and a light theme. The light theme is a different page, not the dark one turned up: a paper-colored page with deep colored panels. Page one is a glowing splash and a hero with the shaded shadow of the portrait in front of a giant name; page two is an "About me" card that slams in and then zooms by itself into a spotlight where the 3D avatar stands. Each section fades in and pops up slightly as you scroll into it, and fades softly as you leave it (turned off for visitors who prefer reduced motion). Then: a showreel, skills as big kinetic type, 3D "by the numbers" pillars, Work as game cartridges with achievements as movie tickets, a scroll-drawn Journey timeline, floating certificate cards, a doorway-framed contact form, and floating gallery cards. Fonts: Anton (big capitals), Manrope (headings), Inter (body).

Extras built: dark and light themes, mouse-reactive 3D (hero, gallery cards, pillars), project search/filter/ordering, chatbot source citations, multilingual chatbot (6 languages), voice input and read-aloud, avatar wave gesture and blinking, accessibility features, optional privacy-friendly analytics.

## Tech stack

| Area | Tools |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Three.js with React Three Fiber and drei, Framer Motion |
| Backend | Node.js, Express, Zod, helmet, express-rate-limit, Nodemailer |
| AI | `@huggingface/transformers` (local embeddings, all-MiniLM-L6-v2), JSON vector index, Anthropic Claude |
| 3D and video | Blender (GLB export), Adobe After Effects (MP4) |

## Setup

Requires Node.js LTS (24 or newer is fine) and Git.

```bash
cd frontend && npm install
cd ../backend && npm install
```

Create `backend/.env` from `.env.example` and fill in the values:

| Variable | Needed for |
|---|---|
| `ANTHROPIC_API_KEY` | Chatbot answers |
| `SMTP_USER`, `SMTP_PASS`, `CONTACT_TO` | Contact form. For Gmail, use an app password (needs 2-step verification) |
| `CLIENT_ORIGIN` | Allowed website origin (default `http://localhost:5173`) |

Never commit `.env`; it is git-ignored.

## Run locally

Two terminals:

```bash
cd backend && npm run dev     # API on http://localhost:5000
```

```bash
cd frontend && npm run dev    # site on http://localhost:5173 (proxies /api to the backend)
```

The first backend start downloads the embedding model (about 25 MB) and builds the vector index. Rebuild it after editing the knowledge files with `npm run ingest` in `backend/`.

## Where to change things

| To change | Edit |
|---|---|
| Text on the site (about, skills, projects, timeline) | `frontend/src/data/profile.ts` |
| What the chatbot knows | `backend/data/samrah.md`, then `npm run ingest` |
| Theme colours | `frontend/src/palettes.css` (one block per palette and theme) |
| Project counts (11 games, 15 projects) | `totals` in `frontend/src/data/profile.ts`. Projects that were never deployed are counted there and in `backend/data/samrah.md`, but not listed in the Projects section |

## Adding your own assets

Drop these into `frontend/public/`. The site picks them up automatically, and shows a placeholder when they are missing.

| File | Used for |
|---|---|
| `models/avatar.glb` | The hero avatar. It is scaled to a fixed height automatically. An animation clip named `Idle` loops, and one named `Wave` plays once when the avatar is clicked |
| `Samrah_Niazi_CV.pdf` | The "Download CV" button in the hero (a copy of the CV at the project root) |
| `video/promo.mp4` | The Intro video section. Optional poster image: `video/poster.jpg` |
| `images/profile.jpg` | Portrait in the About section |
| `images/silhouette.png` | The shadow of the portrait in the hero (a transparent PNG). Rebuild it from a new photo with `assets/reference/silhouette/cut_mask.py` then `export_assets.py` (needs Python and OpenCV) |

Keep the source files in `assets/blender/` (`.blend`) and `assets/aftereffects/` (`.aep`, final MP4).

Optional analytics: set `VITE_PLAUSIBLE_DOMAIN` (and `VITE_PLAUSIBLE_SRC` for a self-hosted script) when building the frontend. Nothing is sent without it.

## Gallery

The "Projects & achievements gallery" section shows every image under `frontend/src/assets/gallery/`:

- `itch/<game>/NN.webp`: screenshots taken from the games' itch.io pages (20 images).
- `linkedin/`: pictures you save from your LinkedIn posts; they appear under "Achievements". See the README in that folder for file naming.

## Rebuilding the avatar

The avatar is generated by a Blender script, so any change (colors, glasses, outfit, animations) is a code edit:

```bash
"C:\Program Files\Blender Foundation\Blender 5.2lender.exe" --background --factory-startup --python assets/blender/build_avatar.py -- assets/blender
```

Then copy `assets/blender/avatar.glb` to `frontend/public/models/avatar.glb`. The model is a maxi-dress character with a flowy red knit maxi, a loose black hijab, oval glasses, a fringe and pink heels, with a 20-bone rig (body, shoulders, arms, eyes and brows for blinking and expressions, and a swaying skirt), a knit texture (`assets/blender/textures/knit.png`), and these animations: `Idle` (loops: she sits at a desk behind a Dell laptop, peeks over the lid and waves hi), `Hi` (that hello once), then the standing moves `Wave`, `Nod`, `Cheer`, `Twirl`, `Think` and `Play` (she pulls out a handheld console and plays it). The desk, chair and laptop are only visible in `Idle` and `Hi`; any other move stands her up on the base and the desk goes away until she sits again. On the site, the Say hi button and clicking the avatar play `Hi`, the "Try a move" buttons play the standing moves, clicking the base twirls her (the base turns with her), and dragging the avatar spins it around. The meshes are merged by material (24 meshes) to keep the page light.

## Project structure

```
frontend/   React app (components, 3D scene, chat widget, contact form)
backend/    Express API, RAG pipeline (src/rag), contact handler, knowledge files (data/)
assets/     Blender, After Effects and exported source files
docs/       RAG pipeline, contact system, report outline, screenshot checklist
```

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Health check |
| `POST /api/chat` | `{ messages: [{role, content}], lang? }` returns `{ answer, sources }` |
| `POST /api/contact` | `{ name, email, subject, message }` sends the email |

## Accessibility

Skip link, keyboard-friendly navigation and chat (Escape closes it), labelled form fields with error messages, the current section marked in the nav, reduced-motion support for the 3D scene, text description for the video, right-to-left support in the chat.
