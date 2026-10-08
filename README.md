# The Donut Landers: Halloween Havoc

A Halloween-themed mobile endless runner built with HTML5 Canvas, CSS, and JavaScript.

## Mobile controls

Designed for vertical play on iPhone and Android. Tap the game screen to jump. No keyboard is required.

## Gameplay

Choose Sprinkles, Glaze, or Chocolate Von Donut. Run through five increasingly difficult Halloween levels, avoid donut-shop obstacles and spooky donut creatures, collect candy, build your multiplier, and chase the Top 10 score.

## Obstacles

The game uses only donut-shop themed objects and spooky Halloween donut creatures as obstacles:

- Donut Box
- Donut Tray
- Donut Stack
- Mixing Bowl
- Rolling Pin
- Zombie Donut
- Ghost Donut
- Vampire Donut
- Witch Donut
- Spider Donut
- Bat Donut
- Jack-o'-Lantern Donut

Candy is the collectible and gives bonus points.

## Music

The game uses one continuous looping background track for the entire game. The file is:

`assets/music/game-music.mp3`

The included track is a temporary playable soundtrack so the GitHub build has working music immediately. Replace that file with your final music track using the exact same filename. The game will continue using one track across all five levels without restarting it at each level.

## Sound effects

Sound effects are generated directly in JavaScript, so no separate sound-effect files are required. The game includes character selection, button, jump, landing, candy/score, high score, collision, game over, and level-complete sounds.

Mobile browsers require a user interaction before audio can play. The first touch unlocks the Web Audio system, and pressing Start begins the background music.

## GitHub Pages

Upload the contents of this project to the root of a GitHub repository. The repository should have `index.html` at its top level. Then enable GitHub Pages from the repository's Settings > Pages and deploy the `main` branch from the root folder.

## Leaderboard

The Top 10 leaderboard uses browser localStorage. Scores are stored locally on the device/browser and are not shared between players.
