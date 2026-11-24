# Module 3: promo video (After Effects)

A 45-second, 1920x1080, 30 fps promo. `build_promo.jsx` builds the whole project inside After Effects, so the
`.aep` is generated from a script you can read and edit.

## What's here

| Path | What it is |
|---|---|
| `build_promo.jsx` | The After Effects script. Creates the composition, animates it, and saves `samrah_promo.aep` next to itself. |
| `footage/avatar/` | Transparent renders of the avatar (idle, wave, cheer, think, play), made by `assets/blender/render_avatar_stills.py`. |
| `footage/screens/` | One screenshot from each game (taken from the games' itch.io pages). |
| `footage/music.mp3` | **You add this.** A licensed track; the script adds it automatically if it exists. |

## Storyboard

| Time | Scene | What happens |
|---|---|---|
| 0:00-0:06 | Intro | "HELLO, I'M", name pops in, role line slides up, avatar waves in. |
| 0:06-0:14 | About | Three lines slide in (NED University, skills, "I build games that feel alive"), internship pill, avatar thinks. |
| 0:14-0:26 | Projects | Four 3-second cards: The Unbroken Oath, The Abduction, Warp, Super Jump, each with tilted screenshot and details. |
| 0:26-0:33 | Skills | Twelve skill pills pop in one after another; avatar plays her console. |
| 0:33-0:39 | Achievements | GAMECON'26 runner-up and Best FYDP winner cards; avatar cheers. |
| 0:39-0:45 | Call to action | "LET'S BUILD SOMETHING FUN", website and email, fade to black. |

Always-on: a pink-to-teal gradient, drifting circles (`wiggle`), a progress bar, glow and drop-shadow effects, and
pink/yellow wipe transitions between scenes.

## Steps

1. **Music (licensed).** Pick one track that allows use in a student project and put it in `footage/` as
   `music.mp3`. Safe sources: Pixabay Music (Pixabay Content License, no attribution needed) or the YouTube Audio
   Library (check the licence shown next to the track; some need a credit line). Write the track name, author and
   licence in your report.
2. In After Effects: **File > Scripts > Run Script File...** and choose `build_promo.jsx`.
   (If it says scripts can't access files: **Edit > Preferences > Scripting & Expressions >
   "Allow Scripts to Write Files and Access Network"**.)
3. Press the spacebar to preview. Everything is an ordinary layer, so you can change text, timing or colours by hand.
4. Export: **Composition > Add to Adobe Media Encoder Queue**, preset **H.264 - Match Source - High bitrate**, and
   save as `promo.mp4`.
5. Embed: copy `promo.mp4` to `frontend/public/video/promo.mp4` (and a frame as `poster.jpg` if you like). The
   "Intro video" section of the site picks them up on its own.
6. Hand in: `promo.mp4` and `assets/aftereffects/samrah_promo.aep`.

## Re-making the avatar stills

```bash
"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python assets/blender/render_avatar_stills.py -- assets/blender/avatar.blend assets/aftereffects/footage/avatar
```

## The Niazi promo (`samrah_niazi_promo.mp4`)

A second, darker 48-second promo that mixes two reference styles: misty dark 3D scenes with particle title text, serif
headings, a skills globe and 3D bars, and a dot-matrix portrait on a wireframe grid with giant type, a white "paper" beat
and a red neon ending. It is built entirely from code, like the first one.

| File | What it is |
|---|---|
| `build_samrah_niazi_promo.jsx` | The After Effects script. Builds one composition per scene plus the main composition and saves `samrah_niazi_promo.aep`. |
| `make_portrait_assets.py` | Makes the portrait footage (`footage/portrait/cutout.png`, `edges.png`, `dots.png`) from your photo and its cutout mask. |
| `make_music.py` | Composes the soundtrack (`footage/music_niazi.wav`): original, generated from code, so it needs no license. |
| `render_samrah_niazi_promo.ps1` | Renders the master with `aerender` and encodes `samrah_niazi_promo.mp4` with ffmpeg. If After Effects stops with "output module stopped responding" near the end, render in chunks with `-s` and `-e` and join them with ffmpeg. |

Scenes: 0-4 loading screen, 4-12 line art, dots and then the real portrait with the name behind her, 12-18 particle
"PORTFOLIO" title, 18-26 skills globe, 26-32 numbers, 32-36 3D game gallery, 36-38 white paper beat, 38-42 awards,
42-48 "LET'S TALK" contact scene.

To rebuild: run `build_samrah_niazi_promo.jsx` in After Effects (or `AfterFX.exe -noui -r build_samrah_niazi_promo.jsx`), then
`render_samrah_niazi_promo.ps1`. The soundtrack is generated, not downloaded; to use a licensed track instead, replace
`footage/music_niazi.wav` before running the script.
