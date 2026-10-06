# The Donut Landers: Halloween Havoc

A static HTML5 Canvas endless-runner built for **portrait mobile play** on iPhone and Android. Players tap anywhere in the game screen to jump. No keyboard is required. Desktop keyboard support is optional.

## Put this on GitHub Pages

1. Sign in to GitHub and create a new **public** repository, for example `donut-landers-halloween-havoc`.
2. Upload the contents of this project folder to the repository root. The root must contain `index.html`, `style.css`, `game.js`, and the `assets/` folder (do not upload only the ZIP file).
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose branch `main` and folder `/(root)`, then click **Save**.
6. Wait for GitHub Pages to publish. The public game URL will be shown in Settings → Pages and usually looks like `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.
7. Open that URL on an iPhone and Android phone to test. Use the published URL, not the GitHub code/repository URL, when embedding the game in Google Sites.

GitHub Pages is static hosting. This game does not need a server, build step, npm, or database. The local Top 10 leaderboard is saved separately in each browser/device; it is not a shared worldwide leaderboard.

## Google Sites embed

After GitHub Pages is live, edit the Google Site → **Insert → Embed → By URL**, paste the published GitHub Pages URL, and insert it. Give the embed as much vertical space as practical. Test on the published Google Site on both mobile platforms; the site theme/embed container can affect the available display area.

## Mobile controls

- Tap anywhere on the playfield to jump.
- Touch is handled with the browser Pointer Events API.
- There is no keyboard requirement.
- Music playback follows mobile-browser audio rules and may only begin after the first user tap.

## Add your music later

Upload MP3 tracks to `assets/music/` using these exact filenames:
- `title-theme.mp3`
- `level1.mp3`
- `level2.mp3`
- `level3.mp3`
- `level4.mp3`
- `level5.mp3`

The game can run without these files. Replace the placeholder notes in that folder with the actual MP3 files when ready.

## Assets

- `assets/backgrounds/BG.jpg` — current countertop background.
- `assets/characters/` — selectable characters.
- `assets/objects/` — obstacles and collectibles.

Use the same filenames or update the paths in `game.js` if you rename assets. GitHub paths are case-sensitive, so match capitalization exactly.

## Current game design

1. **Donut Land** — Halloween Shop
2. **Donut Land After Dark** — Haunted Shop
3. **Haunted Bakery** — Back Room
4. **Graveyard** — Moonlit Graveyard
5. **Halloween Factory** — Donut Factory; continues with increasing difficulty

Scoring: 10 points per second with a level bonus; 15 × multiplier for passing an obstacle; candy 25 × multiplier; Jack-o'-Lantern Donut 60 × multiplier; level completion bonuses; combo 3 = 2× and combo 5 = 3×.

## Important limitations

- The Top 10 list uses browser `localStorage`, so scores do not sync across phones or browsers.
- The supplied character art is cropped from the master artwork and is not yet a set of side-view running animations.
- The project is configured for a narrow portrait playfield. Test the actual published URL on physical iPhone and Android devices before promoting it publicly; I cannot claim physical-device testing was completed here.
