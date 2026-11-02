# Project report outline (export to PDF)

Fill each section in your own words. The "Source" column points to material that already exists.

| # | Section | What to write | Source |
|---|---|---|---|
| 1 | Title page and abstract | Project name, your name, course, date, a 150-word summary | |
| 2 | Introduction and objectives | What the portfolio is for and the six modules | `SEMESTER PROJECT.txt` |
| 3 | Technology stack | Table of tools and why each was chosen | README |
| 4 | System architecture | Diagram: browser, React app, Express API, embedding index, Claude, SMTP | `docs/rag-pipeline.md` |
| 5 | Module 1: portfolio site | Sections, 3D scene, responsive design, theme, animations, accessibility | screenshots |
| 6 | Module 2: Blender avatar | Modelling steps, materials, rig or pose, GLB export settings, how it loads on the site | your Blender work |
| 7 | Module 3: After Effects video | Storyboard, typography, transitions, music source and licence | your AE work |
| 8 | Module 4: RAG chatbot | Pipeline steps, chunking and embedding choices, guards against invented answers, example questions and answers | `docs/rag-pipeline.md` |
| 9 | Module 5: contact system | Validation, spam protection, environment variables, delivery evidence | `docs/contact-system.md` |
| 10 | Extra features | Voice, multilingual chat, citations, filtering, analytics, accessibility | README |
| 11 | Testing | What you tested and results (see the list below) | |
| 12 | Challenges and lessons | Real problems you hit and how you solved them | |
| 13 | Deployment | Hosting, environment variables, live URL | |
| 14 | Conclusion and future work | | |
| 15 | Appendix | GitHub link, live link, screenshots | |

## Test list to run and report
- Chatbot, in scope: "What VR projects has Samrah built?", "Where did she intern?", "Did she win any awards?"
- Chatbot, out of scope (should refuse): "What is her favourite food?", "Who is the president of France?"
- Chatbot, languages: ask one question in Urdu and one in Spanish.
- Contact form: empty fields, invalid email, a valid message (check the inbox), and sending 6 messages quickly (should be rate-limited).
- Responsive layout: phone (375 px), tablet (768 px), desktop.
- Theme toggle, project search, filter, and ordering.
- Keyboard-only navigation (Tab through the page, open and close the chat with Escape).
