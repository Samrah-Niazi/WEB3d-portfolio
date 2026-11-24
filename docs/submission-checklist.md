# Submission checklist

Status as of 24 Nov 2026. `[x]` = done and checked, `[~]` = built but still needs proof or a final step, `[ ]` = not done.

## Module 1: 3D web-based portfolio
- [x] Interactive 3D environment or 3D elements (avatar stage, 3D numbers pillars, floating gallery cards, tilting cards)
- [x] Home page with name, introduction and profile (giant name, shadow of the portrait, typed role line, CV button)
- [x] About Me section
- [x] Skills and technologies section
- [x] Projects and achievements gallery
- [x] Education and experience section
- [x] Contact section
- [x] Smooth animations, navigation and transitions (section reveals, scroll animations, active nav link)
- [x] Responsive on desktop, tablet and mobile (measured at 320, 360, 390, 430, 768 and 1024 px; look at it on your own phone too)

## Module 2: Blender avatar
- [x] Original 3D avatar modelled in Blender
- [x] Materials, colors and textures (knit dress texture, skin, hijab, glasses, shoes)
- [x] Rigging (24 bones) and animations (Idle, Hi, Wave, Nod, Cheer, Twirl, Think, Play)
- [x] Exported as GLB: `assets/blender/avatar.glb`
- [x] Integrated into the website (About page spotlight stage)
- [x] Animation, rotation and interaction (drag to spin, click to wave, moves, seated at the laptop)
- [x] Deliverables: `assets/blender/avatar.blend` and `avatar.glb`

## Module 3: After Effects video
- [x] 30 to 60 seconds (48 s)
- [x] Name and introduction
- [x] Skills, projects and achievements shown
- [x] Typography, transitions, animation and effects
- [x] Background music that is properly licensed (original track composed in code, no license needed)
- [x] Exported as MP4 and embedded in the portfolio (Intro video section)
- [x] Deliverables: `assets/aftereffects/promo_niazi.mp4` and `samrah_promo_niazi.aep`

## Module 4: RAG chatbot
- [x] Information collected from the CV, projects, skills, education and achievements (`backend/data/samrah.md`)
- [x] Documents split into searchable chunks
- [x] Embeddings generated and stored in a vector index (`backend/data/index.json`)
- [x] Relevant information retrieved for each question
- [x] Answers written by an LLM from the retrieved text only
- [x] Chat interface integrated into the site
- [x] Relevant answers about background and projects
- [x] Does not invent answers (refuses out-of-scope questions)
- [x] Brief explanation of the RAG pipeline: `docs/rag-pipeline.md`

## Module 5: Email and contact system
- [x] Form with name, email, subject and message
- [x] Validation in the browser and on the server
- [~] Sends messages to your email address (set up, but a real delivery has not been tested)
- [x] Success and error messages
- [x] Credentials and API keys in environment variables (`backend/.env`, never committed)
- [x] Spam protection (hidden trap field, rate limiting) and safe handling of input
- [ ] **Evidence of successful email delivery:** send one message from the form and screenshot it arriving in your inbox

## Module 6: Deployment and documentation
- [ ] **Redeploy the new design** (the live Vercel site still shows the old design)
- [ ] Confirm the chatbot and contact form work on the live site

## Extra credit
- [x] 3D objects that respond to mouse movement
- [x] Dark and light themes (plus four color palettes)
- [x] Voice interaction with the chatbot
- [x] Multilingual chatbot (6 languages)
- [x] Animated avatar expressions and gestures
- [x] Project filtering and search
- [~] Website analytics (wired in, but only reports once it is on Vercel)
- [x] Accessibility (skip link, keyboard navigation, reduced-motion support, labelled form fields)
- [x] Chatbot source citations
- [x] Project ordering

## Required submission materials
- [x] Complete source code, frontend and backend
- [x] Blender source file and exported avatar model
- [x] After Effects project file and final video
- [x] Working RAG chatbot
- [~] Functional contact system (needs the delivery screenshot above)
- [ ] **Project report in PDF** (outline is in `docs/report-outline.md`)
- [x] README with setup and installation instructions
- [ ] **Screenshots of the major modules** (list in `docs/screenshots/CHECKLIST.md`)
- [ ] **Live deployment URL**
- [ ] **GitHub repository link** (nothing is committed or pushed yet) or a zip of the project

## Open items, in order
1. Commit and push to GitHub, and redeploy to Vercel (do this last, after you are happy with the site).
2. Send a test message through the contact form on the live site and screenshot the email.
3. Take the screenshots.
4. Write the PDF report from `docs/report-outline.md`.
5. Add the live URL and GitHub link to the README and the report.
