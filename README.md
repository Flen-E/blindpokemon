# FIRERED — a fan-made, GBA-style browser RPG

> **About this project:** this is a trial test of the new Claude model **"Fable 5"**.
> The entire game — engine, battle system, data, maps, UI, audio, and mobile
> support — was generated from a **single-shot prompt** (reproduced in full at
> the bottom of this README), then iterated with bug-fix passes.
>
> Non-commercial fan project for AI-capability testing. **Pokémon is
> © Nintendo / Creatures Inc. / GAME FREAK Inc.** This project is not
> affiliated with, endorsed by, or connected to them in any way.

A single-page monster-catching RPG in plain HTML/CSS/JavaScript. No build
tools, no dependencies, no server — open `index.html` and play, or deploy the
folder as a static site.

## Run

- **Local:** open `index.html` directly (file:// works — plain script tags, no modules).
- **Deployed:** any static host serves it as-is (see Deploy below).

## Language

- All player-facing game text is localized in Korean, including dialogue,
  menus, battle messages, species, moves, items, types, signs, and mobile
  controls. Internal IDs remain unchanged so existing saves stay compatible.

## Controls (desktop)

| Key | Action |
| --- | --- |
| Arrows / WASD | Move / navigate menus |
| Z / Space | A — confirm, talk, interact |
| X / Esc / Backspace | B — cancel/back |
| R | Mount / dismount the Bicycle outdoors |
| Enter | Confirm; opens the menu in the overworld |
| M | Toggle sound |

## Mobile controls & PWA

The game is fully playable on phones, in **landscape only**:

- Portrait shows a full-screen "Please rotate your device" overlay
  (plus a best-effort `screen.orientation.lock('landscape')` attempt).
- **True fullscreen on every device:** the logical viewport *widens*
  (240–360 logical px) to match the screen's aspect ratio, then scales —
  no letterboxing on desktop or phones. Press **F** for browser
  fullscreen on desktop. The page itself never scrolls or bounces.
- Touch controls are overlaid **inside the game** like mobile RPG ports:
  semi-transparent **D-pad** bottom-left (hold to keep walking), **A / B**
  bottom-right with the **START** pill stacked above A — all driving the
  same input layer as the keyboard.
- Controls appear only when touch is the **primary** input (coarse pointer
  + no hover) — touchscreen laptops stay in keyboard mode; a real tap shows
  the controls, a keypress hides them again.
- **Installable PWA**: `manifest.json` (fullscreen display, landscape
  orientation, pixel-Charizard app icon on a fire-red background) plus a
  cache-first service worker, so the deployed game can be added to the
  home screen and played offline.

## Progression

1. Wake up in your room, head downstairs — MOM sends you off with a Potion.
   WILLOWBROOK is a handcrafted 26x22 starter village rather than a straight
   corridor: a short north craft lane, two-wide pond bridge, and south
   family/research lane keep every tutorial destination within one readable loop.
2. Choose one of three starter candidates at Prof. MAPLE's lab. Their cards
   show JSON-classified body-shape silhouettes and original descriptions; names and
   types stay hidden until the choice is made. MAPLE then requires the player
   to use a Scanner on that first partner; completing the hands-on tutorial
   reveals it and unlocks the name-guessing feature.
3. Your rival REX grabs the type-advantaged starter and battles you after the
   Scanner tutorial.
4. FERNWAY TRAIL is now a two-bridge, branching Lv 3–5 riverside route whose encounter
   table deliberately includes one early Pokémon from **every Generation
   1–9**: Pidgey, Sentret, Zigzagoon, Starly, Lillipup, Fletchling, Grubbin,
   Rookidee, and Pawmi. The opening partner starts at Lv 6.
5. SPROUTWOOD is a larger looping pre-gym forest with hedge lanes, clearings,
   interconnected side paths, mixed-generation encounters, and the first story quest:
   ecologist ARA asks the player to recover stolen observation data from a
   rookie of the original villain group, the WHITE MIST CREW.
6. STONEGATE is now a wide stone city with a fountain plaza, cliff terraces,
   workshop quarter, classic red-roof **Pokémon Center**, blue-roof **Poké Mart**,
   and the gym — beat Trainee ROCCO and
   Leader MASON and his mixed-region endurance team for the GRANITE BADGE.
7. The GRANITE BADGE opens Stonegate's north gate into GREYWIND PASS
   (wild Lv 8–11), with three trainers and a type-countering REX rematch.
8. ECHO CAVE is a rocky multi-chamber dungeon with floor encounters (Lv 10–13),
   Zubat, Sandshrew, Mankey, two trainers, branching boulder lanes, and cave battle art.
9. MURMURWOOD is a three-bridge looping forest route with wild Lv 14–17 Pokémon from
   several generations, three more trainers, original travelers, and a
   one-time Scanner reward.
10. LAKEGLASS is a 42-tile-wide lake city whose three bridges connect the
    waterfront, gym island, and southern plaza. Its gym has a persistent
    two-stage tide-valve puzzle: step on the lower valve, cross the first
    lowered water gate, then find the upper valve to open Leader SEIRA's room.
    SEIRA has her own field sprite and awards the GLASSWAVE BADGE after her
    Corvisquire Lv 18 / Wartortle Lv 20 battle.
11. The GLASSWAVE BADGE opens THUNDERWAY, a Lv 20–23 waterside route with
    branching reed beds, bridges, three trainers, and a mixed-generation
    encounter table leading into the 48-tile-wide BRIGHTGEAR city.
12. BRIGHTGEAR's circuit gym has three sequential breakers that permanently
    lower electric barriers. Leader TOREN uses a four-member Lv 24–27 team,
    has a dedicated field/full-body/VS presentation, and awards the
    SPARKGEAR BADGE.
13. The third badge opens STARGALE HIGHLANDS (Lv 25–29), including a dynamic
    REX rematch, before the multi-chamber WHITE MIST OBSERVATORY. Three crew
    battles each yield a frequency fragment; all three are required to disable
    Field Director VEIL's protection signal and fight the story boss. The
    defeated quartermaster also drops an additional Scanner.
14. EVERBLOOM is a compact 38x30 garden city beyond the observatory. Its gym is
    split into three greenhouse rooms joined by correct and reset teleport
    pads, rather than a straight corridor. Before entering, the stolen master
    code must be delivered to archivist BITNA to remove the WHITE MIST CREW's
    forged species labels from the regional observation network.
15. Leader ELOA mixes Bug, Poison, Flying, and Grass pressure across a
    four-member Lv 30–34 team. Her dedicated field/full-body/VS presentation
    ends the current arc with the fourth badge, the VERDANT SCENT BADGE.
16. All four city Pokémon Centers have a PC terminal. It opens a skinned storage
    screen for depositing/withdrawing creatures, viewing summaries, and using
    a Scanner on either party or boxed mystery partners.
17. Save anytime — browser slot or a portable save code you can import from
    the title screen.
18. Open the overworld menu and choose `나가기` to return to the title screen;
   the game offers `저장하고 타이틀로`, `저장하지 않고 타이틀로`, or `취소`.

## Mechanics (Gen-3-modeled)

- Gen 3 damage formula with STAB, 85–100% variance, criticals (1/16; 1/8
  high-crit), and the full real type chart (all 18 types, including Fairy).
- **Mystery battles:** both battlers use their broad body-shape category from
  the supplied 14-category silhouette dataset. Opponents use the front-view
  set while the player's active Pokémon uses the matching rear-view set, and every
  unidentified Pokémon name is fixed to `???`. Wild encounters
  and trainer battles reveal clues from a 26-slot
  board: height, weight, catch rate, color, gender ratio, EXP
  growth, previous/next evolution presence, and one defensive clue for each
  of the 18 types. The supplied `silhouette_color.json` classification is the
  source of truth for each species color, and `색깔` is always the first clue
  opened when battle starts. Its name and color swatch appear immediately.
  One random clue
  opens after every two player skills selected from Fight. A damaging move's
  type matchup directly fills that type's defensive clue; False Swipe
  (칼등치기) is the exception. The Bag's reusable `Hint ?` item reveals exactly two unrevealed
  clues, then makes a weaker recoil-free Hint attack before consuming the
  player's turn. Revealed clues show their values immediately in the compact
  record; its minus button collapses the panel to a title bar and the plus
  button restores it. Defensive matchups begin on a separate row with Normal
  and use direct labels such as `드래곤 2X`, `바위 4X`, or a dual resistance's
  `풀 0.25X`. Previous/next
  evolution currently display `O`/`X`; those value slots are isolated so they
  can later show level, special, friendship, item, or trade methods. Every
  opened clue is saved on a caught creature and can be reviewed from the
  Party or PC `관찰 기록` screen.
- **Scanner:** the player starts with three finite `Scanner` items. Using one
  during battle identifies the current opponent and consumes the turn; using
  one from the overworld Bag identifies an already-caught mystery partner.
  An identified creature keeps its real name and sprite after capture and in
  future party/battle screens. Guessing stays locked until MAPLE's first-partner
  Scanner tutorial is completed. Afterwards, a correct species-name guess
  removes the silhouette and identifies the partner; a wrong answer releases
  that partner after showing that it left in disappointment. Defeating any
  unidentified wild or trainer opponent also reveals its real name and front
  sprite before the faint animation completes.
  Defeating the first Fernway trainer awards one
  additional Scanner, completing Ara's stolen-data quest awards another, and
  defeating Murmurwood's forest keeper and the White Mist quartermaster each
  awards another. The Sproutwood chime, highland wind-vane, and other puzzle
  quests provide additional finite replacements for players who explore.
- **Quest system:** the opening is explicitly staged as bedroom stairs → Mom →
  Professor Maple → three starter pedestals. Mom and the professor carry yellow
  exclamation marks while they are the active objective, the house exit cannot
  skip Mom's send-off, and every new/continued session shows the current main
  objective. The start menu has an `임무` log showing the next main-story
  objective and numerical side-quest progress. Other quest givers have yellow
  exclamation marks, and seven optional original broadcast-culture characters
  reward useful supplies for early trainer wins, identifying two partners,
  filling six caught slots, raising one party member to Lv 28, and completing
  three environmental puzzles. Their
  dialogue uses broad commentator, analyst, reaction, and marathon-stream
  comedy archetypes without reproducing any real creator's name, catchphrase,
  or identifiable wording.
- **Environmental puzzles:** Sproutwood hides a three-note chime sequence,
  Echo Cave has a persistent push-boulder and reset winch that opens its stone
  gate, and Stargale Highlands has three clockwise wind vanes whose directions
  unlock the observatory path. These join the tide valves, circuit breakers,
  and greenhouse warp maze. Puzzle state is saved, every device works through
  the same keyboard/touch input layer, and optional keepers reward exploration.
- **Observation-network story:** the WHITE MIST CREW is deliberately injecting
  mismatched species labels into public records so it can sell exclusive
  "certified" answers. Three transmitter fragments unlock a non-gym story boss;
  restoring Everbloom's archive opens the fourth gym, and reporting the fourth
  badge grants Scanners, Great Balls, and investigation money.
- **Test Rare Candies:** new games start with 100 `Rare Candy` items, and an
  older save receives the same supply once if it has no Rare Candy entry yet.
  They are used from the field Bag, raise the chosen partner by one level,
  process level-up moves and evolution, and cannot be used during battle or at
  level 100.
- **Bicycle:** press `R` outdoors or choose the bicycle option from the
  overworld menu. It uses the supplied four-direction bicycle sheet, moves
  substantially faster than walking, stores the riding state in the player
  save, and automatically dismounts indoors.
- **Compact opening:** Willowbrook is a short 26×22 village with the pond,
  homes, archive, and Maple's lab close enough to form a readable first loop.
  Every ordinary exterior house has a working door and returns the player to
  the exact building they entered.
- **Reviewed town districts:** the five settlements use deliberate footprints
  (26×22, 34×28, 34×28, 36×30, and 38×30) instead of progressively larger empty
  rectangles. Stonegate centres on a quarry court, Lakeglass on three canal
  bridges, Brightgear on twin cooling basins, and Everbloom on a fenced cross
  garden. Every town NPC has a named work/social placement and a reviewed
  one-to-three-tile wander radius; quest and story actors remain fixed at their
  landmarks.
- **Cross-generation regional dex:** the playable pool now contains 100 species.
  The original 20 and ten first-expansion species are joined by 22 complete
  early-route families spanning Generations 2–9: Sentret, Zigzagoon, Starly,
  Lillipup, Fletchling, Grubbin, Rookidee, and Pawmi. Trainer rosters and later
  routes mix their evolutions instead of segregating Pokémon by generation.
  A further 24 species add the Oddish, Gastly, Mareep, Ralts, Roggenrola,
  Noibat, Snom, Tinkatink, and Rockruff families, including new Ghost, Fairy,
  Ice, Dragon, and Rock roles. The 100-species expansion adds 24 more through
  the Wooper, Houndour, Swablu, Shinx, Drilbur, Goomy, Rowlet, Fidough,
  Frigibax, and Glimmet families.
- **Themed wild diversity:** all 100 supported species now appear in at least
  one wild encounter pool across 11 maps. Early routes offer 22–24 mostly base
  forms, midgame forests/waterfronts/cities offer 22–30 species, and the late
  highlands, occupied observatory, and Everbloom gardens offer 36–51 species
  with rare middle/final evolutions. Forests emphasize Bug/Grass/Flying/Fairy,
  cliffs and caves emphasize Rock/Ground/Ghost/Dragon, waterside beds include
  the Squirtle line, and generator gardens favor Electric/Bug/Steel. Lakeglass,
  Brightgear, and Everbloom use walkable flower patches as optional encounter
  zones, leaving each city's main roads safe.
- **Name guessing:** after the first-partner Scanner tutorial, choose `이름 추측`
  from the Party menu. A correct Korean or species-id answer identifies the
  partner and reveals its real art. A wrong answer reveals the real name in the
  message `(포켓몬)은(는) 실망하며 도망갔다` and releases it. The last remaining
  party member cannot be risked this way.
- **PC and Summary:** Center terminals manage the existing six-member party
  and BOX 1 storage. At least one active partner must remain. The supplied PC
  and Summary skins are used locally, and all identity rules still apply:
  unscanned creatures keep their body-shape silhouette, `???` name, and hidden type.
  Scanners can also be consumed directly inside storage.
- Battle damage uses the standard **1x Gen 3 formula** for moves, fixed damage,
  confusion, recoil, poison/burn chip, and Leech Seed drain, with the existing
  minimum of 1 damage where applicable.
- Hint measurements, colors, gender ratios, growth rates, evolution presence, and
  capture rates are stored locally in `js/data/hints.js`; the canonical
  Pokédex source used while preparing that table is [PokéAPI](https://pokeapi.co/).
- Stats HP/Atk/Def/SpA/SpD/Spe; speed order; ±6 stat stages **including
  accuracy and evasion**.
- Status: poison, burn (halves physical Atk), paralysis (¼ speed, 25% full
  para), sleep (2–4 turns), freeze (20% thaw; fire moves thaw). Fire-types
  can't be burned; Poison/Steel-types can't be poisoned.
- Volatiles: flinch, confusion (2–5 turns, 50% self-hit), Leech Seed.
- Multi-hit moves (Fury Attack, Pin Missile, Twineedle), Super Fang,
  priority (Quick Attack), PP and Struggle.
- Gen 3 catch formula (HP, catch rate, ball bonus, status bonus) with a
  focused capture sequence: HUD clears, suck-in shrink, up to three wobbles
  with beeps, lock click + star burst — or a break-open flash with flying
  shell fragments on escape.
- **Later-gen EXP Share:** every able party member earns experience from
  each KO — participants get the full amount, benchwarmers half.
- **Shiny encounters (1/512):** every generated creature can roll shiny,
  with real shiny sprites, a sparkle + callout on wild entry, and shiny
  thumbnails in the party screen.
- Trainer battles show the opponent's team as ball icons that darken as
  each one faints; trainers watch **all four directions** — you can't
  sneak behind them.
- Battle presentation: region-specific field, forest, rocky, cave, water, and
  indoor battleback art (cover-scaled to the viewport),
  soft ground shadows under both combatants, per-move-type canvas hit
  effects (flames, droplets, jolts, leaves, powder, slashes, rings) and
  screen shake. Gym leaders use distinct overworld sheets and a local full-body
  reveal followed by a player/leader `VS` cut-in that contracts into the battle.
- **Purpose-built towns:** settlements use compact, different-sized plans with
  separate work, service, waterfront, and garden districts instead of giant
  rectangular plazas. Willowbrook uses tinted building variants and a short
  bridged pond loop; later towns use a quarry court, canal bridges, cooling
  basins, and a fenced cross garden. Edge travel projects the player's
  position proportionally onto the nearest destination opening, so wide towns
  connect cleanly to 24-tile routes.
- Ordinary townsfolk make reviewed one-to-three-tile loops around a named
  workplace or social landmark. Trainers, quest givers, and story-critical
  residents remain fixed so important interactions stay easy to find.
- Level-ups, move learning with replace prompt, and level evolutions for all
  supported families. Special overworld evolution methods that this compact
  engine does not model yet (Charjabug and Pawmo) are normalized to Lv 30.
  Blacking out returns you to the most recently visited
  healing center (home before you've reached one).

## Assets

- Every runtime image is **local** under `assets/` — the game never hotlinks
  and works fully offline. The original compact set can be refreshed by
  `download-assets.js` and `download-overworld.js`; this two-badge expansion
  also selects only the needed files from the user-supplied `Graphics` pack.
- In-game loading is **lazy with a background warm-up**: nothing blocks the
  page; every image is created on demand, and a `preloadAll()` pass right
  after first paint caches the rest (including all shiny variants) while
  you're still on the title screen.
- Battle sprites (front/back) and item icons:
  [42arch/pokemon-dataset-zh](https://github.com/42arch/pokemon-dataset-zh)
  (dataset/images reference) with [PokeAPI/sprites](https://github.com/PokeAPI/sprites)
  as the actual source for most front sprites, all back sprites, and item
  icons (the dataset's image paths weren't directly fetchable).
- Overworld art — tilesets, building exteriors, character walk-cycle sheets,
  and the battle background — comes from
  [torresflo/Pokemon-Obsidian](https://github.com/torresflo/Pokemon-Obsidian)
  (a PSDK/Pokémon Studio fan game). GPL-3 applies to that project's *code*;
  the artwork itself remains Nintendo-derived.
- The supplied `Graphics` selection adds front/back/shiny/icon art for 80
  additional species (including complete early-route families through Gen 9),
  forest/cave autotile references, 14 front-view body-shape silhouettes plus
  14 matching generated rear-view variants with their authoritative species JSON,
  supplied player/bicycle character sheets,
  separate field/full-body/VS sheets for all four current leaders, nine regional
  battle backgrounds, and PC Storage/Summary skins. The project makes no
  independent ownership claim over that pack; all underlying character and
  artwork rights remain with their respective creators and Nintendo.
- The renderer slices 32px tileset cells onto the game's 16px grid, draws
  whole-building images over grassed footprints, and animates 4-direction
  × 4-frame walk cycles anchored at the feet. If any image is missing or
  fails to load, every surface **falls back to the original code-drawn
  art**, which stays in the codebase. Outdoor punctuation floors use the
  textured local outdoor sheet instead of flat fallback tiles, and tree cells
  use varied compact object-tree sprites from the supplied Graphics pack.
  Town flower, rock, and boulder markers use additional local object sheets
  with map-specific placement so large cities do not read as empty grids.
- Interior floors use the supplied Interior general, Poke Centre, Mart, and Gym
  tilesets, while `W` water cells use wave-textured Sea tiles rather than a
  flat blue filler. House rooms now use identifiable supplied bed, stair,
  bookshelf, TV, potted plant, desk, sofa, kitchen, bicycle rack, PC, research-console,
  healing-station, checkout, and shelf sprites instead of reusing arbitrary
  floor cells. Multi-cell furniture uses reviewed whole-object source groups
  with matching collision footprints, not a cropped cell from the middle of a
  sofa, staircase, doorway, bookcase, plant, machine, or shelf. Both sofa
  variants include their full two-row backrests, and the complete entrance mat
  is depth-rendered so the room border cannot cut it off. The 14×10 starting
  home keeps its bed/study and family living zones compact, with a three-wide
  staircase attached to the upper-right wall and entered from its lower-right
  step instead of the visually incorrect lower-left edge.
  Player, rival, craft, civic, stone, machine, and botanical interiors also use
  reviewed floor/wall palette pairs from different complete bands of the local
  sheet. Every non-outdoor map has a semantic room plan and required set pieces.
  Bedrooms, living floors, labs, ordinary buildings, healing centers, marts,
  caves, and four different gym types are validated independently, including
  NPC approach tiles and routes that remain passable while NPC bodies are
  treated as obstacles. The seven ordinary town doors now lead one-to-one to a
  carpenter shop, archive hall, stone workshop, repair shop, technician studio,
  seedling nursery, and botanist home; none reuse the legacy guest room. The four
  town centers and four marts also have distinct plans—stone symmetry, lakeside
  lounge, machine service, and plant-lined variants—rather than one room copied
  eight times.
- Building collision uses the measured opaque span immediately, even while an
  image is still loading, and the upper roof slice is layered over actors so
  characters can pass through the narrow back lane without rendering on top of
  rooftops; the mapped building footprint and front remain solid.
- Character sheets are assigned explicitly per map and NPC after front-frame
  review, not selected from a numbered random pool. Mom uses an adult-woman
  sheet, Maple uses the supplied professor, every center uses the actual nurse
  sheet, and hikers, swimmers, engineers, cyclists, artists, Rangers, and
  villain crew use their matching trainer sheets. All normal actors are locked
  to 32x48 source frames; only bicycle actors may use 48x48 frames.
- RMXP autotile cells marked with a red X are editor placeholders and are
  never rendered. Cave floors use the local Brown cave floor autotile, while
  walls and markers use reviewed complete cells from the Dungeon cave sheet;
  forest maps retain safe terrain slices. A
  tall tree's trunk plus visible canopy footprint are both solid to movement
  and NPC placement.
- The supplied `Audio` pack provides local title, exploration, wild/trainer/
  leader battle, and victory music. Supplied map MIDI references are rendered
  ahead of time to browser-compatible AAC/M4A, with OGG fallbacks, so homes,
  towns, cities, the lab, all three routes, forests, caves, the lake,
  Pokémon Centers, marts, and gyms each use an appropriate distinct theme
  without making file:// play depend on MIDI decoding;
  map changes, battle return, tab resume, and unmute all retry the active track.
  Moving between maps backed by the same audio source keeps the current playhead while
  applying the destination theme's volume and loop settings.
  `M` mutes both this music and the synthesized sound effects.
- Sprite/character/tile designs **© Nintendo / Creatures Inc. / GAME FREAK
  Inc.** — used here non-commercially for a model-capability test; this
  project is not affiliated with or endorsed by them.

## Deploy (Vercel)

1. Push this folder to a GitHub repo (it's already a git repo — just add a
   remote and push).
2. In Vercel: **Add New → Project → Import** the repo.
3. Done. `vercel.json` pins it as a zero-build static site (`framework: null`,
   no build command, `index.html` at the root, long-lived cache headers for
   `assets/`, day-long for `js/`/`css/`).

## Code layout

| File | Role |
| --- | --- |
| `js/main.js` | Game state, title screen, main loop, mobile setup |
| `js/overworld.js` | Tile engine, movement, NPCs, LOS trainers, warps, menus |
| `js/battle.js` | Battle system, catch logic, hit effects, screen shake |
| `js/ui.js` | Input (keyboard + touch), typewriter dialog, menus, HUD |
| `js/save.js` | Browser save slot + portable save codes |
| `js/audio.js` | Synthesized Web Audio SFX + local BGM playback/fallbacks |
| `js/data/*.js` | Types, moves, species, hint database, items, maps, drawn sprites, image assets |
| `AGENTS.md` / `CLAUDE.md` | Continuation guides for AI agents (see below) |
| `assets/sprites/`, `assets/items/` | Battle sprites (front/back + shiny variants) + item icons |
| `assets/overworld/` | Tilesets, building images, flower autotile |
| `assets/Graphics/Characters/` | Supplied 4-direction player, bicycle, NPC, and trainer sheets |
| `assets/battle/` | Battle background |
| `assets/Graphics/` | Selected additional species, forest/cave, regional battlebacks, PC/Summary UI |
| `assets/Audio/BGM/` | Selected local title, map, battle, and victory music |
| `assets/icons/`, `assets/og-image.png` | PWA app icons + link-preview card |
| `manifest.json` / `sw.js` | PWA manifest (fullscreen, landscape) + offline service worker |
| `download-assets.js` | Dev script: battle sprites + item icons |
| `download-overworld.js` | Dev script: Pokemon-Obsidian overworld art |
| `validate.js` | Dev-only data integrity checker (`node validate.js`) |
| `vercel.json` | Zero-config static deployment |

## For AI agents continuing this project

Two guides ship with the repo so any capable model can pick the work up at
the same quality bar:

- **`AGENTS.md`** — the canonical guide: architecture map, the hard rules
  (no build step, fallback-first rendering, local-only assets, validation
  gates, single-amended-commit git workflow, originality posture), the
  sharp edges already hit (one-shot input semantics, decal body geometry,
  pixel-snapping rules), and the quality bar for new work.
- **`CLAUDE.md`** — Claude-specific workflow notes on top of AGENTS.md
  (validation commands, tooling caveats, where to start per task type).

## Debug helpers (browser console)

```js
DEBUG.give('pidgey', 12)   // add a team member
DEBUG.heal()               // restore the party
DEBUG.money(99999)
DEBUG.warp('stonegate', 9, 13)
DEBUG.warp('sproutwood', 9, 18)
DEBUG.warp('route2', 9, 24)
DEBUG.warp('echocave', 9, 20)
DEBUG.warp('murmurwood', 9, 24)
DEBUG.warp('lakeglass', 9, 19)
```

---

## The single-shot prompt

The prompt below is self-contained and would recreate this system from
scratch in one shot.

```text
Build a complete, playable, FireRed-inspired monster-catching RPG as a pure
static web app in a folder called pokemon-rpg. Requirements:

TECH
- Vanilla HTML + CSS + JavaScript only. No build tools, no modules, no
  server: it must run by double-clicking index.html (file://) and deploy
  unchanged as a static site (include a vercel.json with framework null and
  no build step, plus cache headers for js/css/assets).
- Organize the code into separate files: engine/overworld, battle system,
  UI/input, save system, audio, and a js/data/ folder with types, moves,
  species, items, maps, drawn sprites, and image-asset loading.

DATA (real series values; Gen-3-modeled battle rules)
- The first 20 National Dex Pokémon (Bulbasaur through Raticate), plus
  Spearow/Fearow, Pikachu/Raichu, Sandshrew/Sandslash, Zubat/Golbat, and
  Mankey/Primeape. Add complete cross-generation early-route families for
  Generations 2–9: Sentret/Furret, Zigzagoon/Linoone,
  Starly/Staravia/Staraptor, Lillipup/Herdier/Stoutland,
  Fletchling/Fletchinder/Talonflame, Grubbin/Charjabug/Vikavolt,
  Rookidee/Corvisquire/Corviknight, and Pawmi/Pawmo/Pawmot. Also include
  Oddish/Gloom/Vileplume, Gastly/Haunter/Gengar,
  Mareep/Flaaffy/Ampharos, Ralts/Kirlia/Gardevoir,
  Roggenrola/Boldore/Gigalith, Noibat/Noivern, Snom/Frosmoth,
  Tinkatink/Tinkatuff/Tinkaton, and Rockruff/Lycanroc. Store real names,
  types, base stats, capture rates, base EXP yields, measurements, taxonomy,
  and evolution chains; special field/walking evolutions can be normalized to
  Lv30 until their overworld mechanics exist.
- Real moves with actual power/accuracy/PP/type and the Gen 3 by-type
  physical/special split: Tackle, Scratch, Growl, Tail Whip, String Shot,
  Sand Attack, Smokescreen, Sweet Scent, Scary Face, FeatherDance, Growth,
  Harden, Withdraw, Agility, Supersonic, Vine Whip, Razor Leaf, Leech Seed,
  Sleep Powder, Stun Spore, PoisonPowder, Poison Sting, Ember, Flamethrower,
  Metal Claw, Slash, Bubble, Water Gun, Bite, Rapid Spin, Quick Attack,
  Gust, Wing Attack, Twister, Fury Attack, Pin Missile, Twineedle,
  Confusion, Psybeam, Hyper Fang, Pursuit, Super Fang, Struggle, Leer,
  Headbutt, Bug Bite, Pluck, Spark, Nuzzle, Arm Thrust, and Iron Defense.
- The complete real 18-type chart used by the hint board (Gen 3 chart plus
  Fairy's modern defensive matchups).
- Real items at FireRed prices: Potion 300, Super Potion 700, Antidote 100,
  Paralyze Heal 200, Awakening 250, Burn Heal 250, Ice Heal 250,
  Full Heal 600, Poke Ball 200, Great Ball 600, a reusable non-shop Hint, and
  the finite Scanner identity tool. Add a non-shop Rare Candy with its supplied
  local icon; give 100 at the start for testing, allow field use with normal
  move learning/evolution, migrate older saves once, and block battle use.

BATTLE SYSTEM (Gen 3 mechanics)
- Fight / Bag / Switch / Run menu; up to 4 moves with PP; Struggle when dry.
- Mystery battles hide both battlers behind deterministic body-shape silhouettes
  derived from `assets/Graphics/Silhouette/silhouette.json`; opponents use the
  original front-view assets and the player's active creature uses a matching
  generated rear-view asset so the battle perspective remains coherent. They
  show the 26-slot mystery clue board. Wild and trainer battles always open
  the JSON-backed color clue on entry and one random clue after every two
  player Fight skills. Damaging
  moves also reveal the matching defensive type clue directly; False Swipe
  (칼등치기) does not. Using the reusable Hint item opens exactly two random locked clues,
  makes a weaker recoil-free Hint attack, and then gives the enemy its normal
  turn. Show revealed values immediately in the compact record, place all 18
  multiplier-only defensive clues in a separate Normal-first grid, and provide
  a minus/plus button that minimizes or restores the record without an expanded view;
  keep previous/next evolution as O/X slots whose value functions can later
  expose level, special, friendship, item, or trade methods;
  persist every revealed clue on captured creatures, expose those values through
  Party/PC observation-record screens, and keep party-management silhouettes and
  `???` labels until identification.
- The finite Scanner identifies the current opponent without dealing damage,
  but still gives the enemy its normal turn. It can also identify an already-
  caught party member from the overworld Bag; only identified creatures reveal
  their real names and sprites. Revealing a creature also overrides any wrong
  player-entered guess with the real species name so the revealed art and text
  always refer to the same species.
- Give the player three Scanners at the start, require a hands-on first-partner
  Scanner tutorial before the rival battle, and keep name guessing locked until
  that scan succeeds. Continue awarding one after the first route trainer.
- Resolve Party-menu guesses immediately: identify/reveal on an exact answer,
  or release the partner with its disappointment message on a wrong answer.
- When a mystery opponent faints, reveal its real name and front sprite before
  it leaves the field; this applies to every wild encounter and every member of
  a trainer party, while already scanned opponents skip the duplicate reveal.
- Add a Center PC backed by the saved vault: deposit/withdraw with a party
  limit of six and at least one active member, use Scanners on boxed partners,
  and open a Summary screen. Unidentified summaries must hide name, type, and
  real sprite just like battle and party screens.
- Gen 3 damage formula: ((2L/5+2) * power * A/D)/50 + 2, then crit x2
  (1/16 base, 1/8 high-crit), STAB 1.5, type effectiveness, and random 85-100%
  at the standard 1x damage pace.
- Stat stages -6..+6 for Atk/Def/SpA/SpD/Spe AND accuracy/evasion
  (3-based multiplier), burn halving physical attack, paralysis quartering
  speed with 25% full paralysis, sleep 2-4 turns, freeze with 20% thaw and
  fire-move thawing, poison/burn chip at 1/8 max HP.
- Volatile conditions: flinch (Bite/Hyper Fang/Twister), confusion
  (2-5 turns, 50% chance to hit yourself with a 40-power typeless physical),
  Leech Seed (1/8 drain healing the opponent, fails on Grass types).
- Multi-hit distribution 2/2/3/3/4/5 for Fury Attack and Pin Missile;
  Twineedle hits twice with 20% poison per hit; Super Fang halves HP.
- Status immunities: Fire can't be burned, Poison/Steel can't be poisoned.
- Catching: Gen 3 catch formula a = (3M-2H)*rate*ball/(3M) * status bonus
  (2x sleep/freeze, 1.5x others), b = 1048560/sqrt(sqrt(16711680/a)), four
  16-bit shake checks. Stage the capture for focus: hide the HUD boxes,
  throw arc, suck-in shrink, up to three visible wobbles each with a beep,
  then a lock click with a star burst on success — or a break-open white
  flash with red/white shell fragments plus screen shake on escape. Caught
  Pokémon join the party (max 6) or a vault.
- Later-gen EXP Share: EVERY able party member earns EXP per KO — base
  yield*level/7 (x1.5 vs trainers) in full for battle participants, half
  for the bench. Cubic level curve, stat growth on level-up, learnset
  prompts with "forget a move?" replacement, evolution after battle.
- Shiny system: every generated creature rolls shiny at 1/512; download the
  real shiny front/back sprites too, sparkle + callout when a shiny wild
  appears, shiny thumbnails in the party screen.
- Trainer battles show the opponent's team as ball icons on the enemy HUD
  box, darkening one per faint. Trainers in the overworld watch all four
  directions — approaching from behind still triggers the battle.
- Turn order by priority then effective speed; simple AI that prefers
  super-effective damaging moves 60% of the time.
- Canvas-rendered battle scene: enemy front sprite and player back sprite,
  HP boxes with animated color-shifting bars (numbers on BOTH boxes), EXP
  bar, per-move-type particle hit effects (flames, droplets, electric
  streaks, leaves, poison bubbles, psychic rings, rock chunks, slash
  streaks) and screen shake on impact.

WORLD & PROGRESSION (FireRed opening arc, original writing)
- Beat-for-beat: wake up in your upstairs bedroom -> downstairs, a parent
  NPC sends you off with a Potion (and offers free healing later) -> the
  professor's lab in town -> inspect three description-only starter candidates
  with matching body-shape silhouettes -> a cocky
  rival immediately picks the type-countering starter and battles you in
  the lab, then leaves.
  Keep this opening impossible to lose: use a fixed recognizable mother sprite
  below the stairs, yellow objective markers, a Mom-before-exit gate, concise
  objective toasts, and an `임무` entry that advances from Mom to the professor
  to the three starter pedestals. The three supplied display bases use local
  Poké Ball icons as complete two-tile objects, spaced evenly with a clear inspection tile;
  the left, centre, and right stations each own exactly one candidate instead
  of opening the entire selection menu from an unrelated sprite. Existing saves that already own a starter must
  migrate past these tutorial gates.
- The region is an original cross-generation ecological crossroads, not a
  recreation of a single official generation. The connected progression
  begins with the starting town, Fernway Trail,
  Sproutwood, Stonegate, Greywind Pass, Echo Cave, Murmurwood, and Lakeglass,
  plus their interiors. Fernway's first encounter table contains at least one
  species from every Generation 1–9. Sproutwood is a decorated looping Lv4-8
  pre-gym forest with side paths and an original quest in which ecologist ARA
  asks the player to recover observation data from the WHITE MIST CREW. After
  Leader MASON (Grubbin 9 / Rookidee 9, then Charjabug 11 / Herdier 12 /
  Raticate 13) awards the GRANITE BADGE,
  unlock Stonegate's north gate. Greywind Pass has wild Lv8-11 encounters,
  three trainers, and a dynamic REX rematch whose starter still counters the
  player's choice. Sproutwood also hides three chime devices that must be
  activated in a clue-given order for an optional supply quest. Echo Cave adds
  rocky lanes, wild Lv10-13 floor encounters, two trainers, and a push-boulder
  puzzle with a visible goal, reset winch, persistent state, and stone gate.
  Murmurwood is a looping forest with wild Lv14-17
  cross-generation encounters, three trainers, and a one-time Scanner reward.
  Lakeglass has another Center and Mart plus a water-flow gym with two
  trainees and Leader SEIRA (Corvisquire 18 / Wartortle 20), who awards the
  GLASSWAVE BADGE. Continue north through a Lv20–23 waterside route into a
  wide industrial city. Its circuit gym uses three sequential floor breakers
  to lower electric barriers before Leader TOREN's mixed Lv24–27 team and the
  SPARKGEAR BADGE. The badge opens a Lv25–29 highland route with a dynamic REX
  rematch and a three-device rotating wind-vane puzzle, followed by a multi-room WHITE MIST OBSERVATORY dungeon with three
  crew battles and a Scanner reward. Make the three crew members each provide
  a frequency fragment, require all fragments before a WHITE MIST field-director
  story battle, and reveal that the group is forging public species labels to
  make its own paid answers appear authoritative. End the current arc in a compact 38x30
  garden city whose gym consists of three separated greenhouse rooms connected
  by correct/reset teleport pads. Require delivery of the director's master
  code to a city archivist before the gym opens. Leader ELOA uses a mixed Lv30–34 team and
  awards the fourth badge. Give both new leaders distinct field, full-body,
  and VS assets. Use local forest/cave tiles and map-specific battlebacks,
  with drawn fallbacks for every surface.
- Tile-based overworld: grid movement (arrows/WASD) with tap-to-turn,
  collision, camera, map links and door/stair warps with fades, signs,
  multi-page typewriter NPC dialogue for every NPC (parent, professor,
  rival, hint-giving townsfolk, nurse, clerk, trainers with pre/post lines).
  Ordinary townsfolk wander within a small collision-safe radius while key
  story and quest characters stay anchored.
  Assign every map NPC an explicitly reviewed character sheet that matches age,
  occupation, and story role; never hash role names into a generic numbered
  sprite pool. Keep Mom, the professor, rivals, nurses, clerks, leaders, and
  recurring characters visually stable across maps.
  Give every interior an explicit purpose and required furniture list. Validate
  whole source rectangles, matching multi-tile collision footprints, clear NPC
  approach tiles, usable counters/PCs/pedestals, and a continuous player route
  with stationary NPCs counted as blockers before accepting a room layout.
  Never route multiple ordinary houses or workshops into one shared guest room:
  give every exterior a unique destination, palette, floor plan, resident, and
  return door tied to that building's role.
  Keep all progression clues intact while giving the cast an original comedic
  game-broadcast tone: confident wrong guesses, self-deprecating defeat excuses,
  light meta jokes, and a rival whose explanations are faster than his wins.
  Never copy a real creator's catchphrases or identifiable wording.
  Add an `임무` log, yellow quest markers, and at least seven optional side
  quests spread across towns/routes. Base their original NPC personalities on
  broad broadcast archetypes (overconfident commentator, detailed analyst,
  loud reaction host, relaxed marathon player), never on an imitation of a
  specific real person. Rewards should materially help progression: healing
  items, capture balls, Scanner replacement, or money.
  Include at least three distinct persistent environmental-puzzle archetypes:
  a clue-driven interaction sequence, a directional push-block puzzle with a
  reset device, and clockwise rotating devices with an exact target state.
  Gate progress only when the mechanism is reachable and visibly communicate
  correct, reset, and solved states through dialogue, sound, and map overlays.
  Include
  a start menu (Party with reordering, Bag with item use, Badges, Save),
  blackout-to-respawn on defeat with halved money.
- Give every supported species at least one thematically appropriate wild
  habitat. Use at least 12 distinct species per encounter-enabled map, keep
  early pools focused on base forms, introduce middle evolutions through the
  midgame, and reserve most final evolutions as rare late-area encounters.
  Add optional flower-patch encounters to suitable cities while keeping main
  roads safe. Validate positive weights, unique entries, usable level ranges,
  and complete species coverage so new data cannot silently leave a species
  unobtainable.
- Keep a minimum playable roster of 100 species, including the Oddish, Gastly,
  Mareep, Ralts, Roggenrola, Noibat, Snom, Tinkatink, Rockruff, Wooper,
  Houndour, Swablu, Shinx, Drilbur, Goomy, Rowlet, Fidough, Frigibax, and
  Glimmet families.
  Every added species needs battle stats, a valid learnset, all 26 mystery
  hints, normal/shiny front/back/icon assets, trainer use where appropriate,
  a `silhouette.json`-validated body-shape asset, and at least one
  progression-appropriate wild habitat.
- All character names, town names, and dialogue must be original writing -
  do not copy any text from the actual games.

ASSETS
- Write a node script that downloads, into a local assets/ folder, front
  battle sprites, back sprites, SHINY front/back variants, and item icons
  for the 20 species and 10 items from
  github.com/42arch/pokemon-dataset-zh, falling back to
  github.com/PokeAPI/sprites raw URLs for anything missing; verify PNG
  magic bytes. The game must reference only the local files (offline-safe).
- Write a second node script that downloads real overworld art from
  github.com/torresflo/Pokemon-Obsidian (inspect the repo's
  Obsidian/Graphics tree via the GitHub API first): an outdoor tileset and
  an interior tileset, whole-building images (house, healing center, mart),
  a flower autotile, 4-direction x 4-frame RMXP-style character walk sheets
  for the hero and every NPC kind, and a grass battle background.
- Select only the files needed for this arc from a local user-supplied
  Essentials-style Graphics pack: extra species front/back/shiny/icon sheets,
  field/forest/rock/cave/water/indoor battlebacks, and PC Storage/Summary
  skins. Never render red-X "unused" cells from RMXP autotile templates and
  never load the thousands of unused pack files.
- Renderer requirements for that art: run the canvas at 2x internal
  resolution with a setTransform(2,0,0,2,0,0) so 32px sources land on
  device pixels 1:1; slice 32px tileset cells onto the 16px logical grid
  via per-legend-char source-rect maps (separate indoor / outdoor tables,
  multi-layer tiles with a base tile under transparent or taller-than-tile
  art such as trees and shelves); make every visible tree footprint solid
  and reject NPC placements under its canopy; snap the camera to whole device pixels
  to avoid scroll seams; draw whole-building images over grass-rendered
  footprints — MEASURE each building's opaque pixel bounds first (the
  files carry transparent shadow padding) and anchor/collide using that
  body rect, bottom-centered on the door row, marking body-covered tiles
  solid except the door; animate character walk cycles from the step tween
  with feet-anchored frames at native scale and an idle frame when
  standing; draw the battle background cover-scaled with soft ground
  shadows under each combatant instead of flat platform ellipses.
- Asset loading must be lazy (Images created on first use) plus a
  background preloadAll() shortly after first paint so page load is
  unaffected but everything is cached early.
- GRACEFUL FALLBACK everywhere: also implement simple code-drawn pixel
  tiles/characters/creature sprites, and use them automatically for any
  image that is missing or fails to load.
- Blackout respawn: blacking out returns the player to the most recently
  ENTERED healing center (set on entry, not on heal); home until then.
- Also ship AGENTS.md and CLAUDE.md continuation guides covering the
  architecture, the no-build/fallback/local-asset rules, the validation
  gates, and the git amend-into-one-commit workflow.
- Title screen: FIRERED logo text, warm fire-gradient background with
  drifting embers, a large Charizard front sprite, a synthesized roar on
  the first key press, and the menu placed so the sprite stays visible.

UI / POLISH
- Localize all player-facing dialogue, menus, battle messages, species, moves,
  items, types, signs, and mobile controls in Korean while keeping internal
  IDs stable for save compatibility.
- GBA-style bordered dialog boxes with typewriter text (skip on press),
  bottom-right 2x2 battle menu, move panel with PP/type, party screen with
  HP bars and status chips, bag and shop screens with real item icons,
  battle intro flash/fade transition, retro pixel font (Press Start 2P with
  monospace fallback), synthesized Web Audio SFX for every interaction
  (cursor, confirm, hits by effectiveness, faint, heal jingle, level-up,
  catch sequence, badge fanfare), plus local looping BGM for title, every map,
  wild/trainer/leader battles, and victories. Use browser-decodable local
  AAC/M4A or OGG at runtime, including file://, and switch tracks on warps, links, battle
  entry/exit, blackout, title return, tab resume, and unmute. Preserve the
  playhead when adjacent map themes resolve to the same audio source. M mutes and
  resumes both SFX and BGM.
- Save system: localStorage slot plus an exportable/importable base64 save
  code (title screen has CONTINUE / NEW GAME / IMPORT CODE). Loading validates
  the saved map and relocates only coordinates stranded by a later terrain or
  building redesign to the nearest static walkable tile.
- Build towns with recognizable residential, civic, waterfront, and commercial
  districts. Keep the 26x22 starting village compact and readable: branching
  lanes,
  irregular water with a real bridge, groves, fenced gardens, distinct building
  colors, useful signs, and enough residents to make every district feel lived in.
  Normalize edge landings between different map widths. Give the second gym sequential floor
  valves that permanently lower water gates, a distinct leader walk sheet, and
  full-body/portrait/VS assets in a pre-battle cut-in that collapses into battle.

MOBILE / FULLSCREEN
- Proper viewport meta (width=device-width, initial-scale=1,
  user-scalable=no), fullscreen-friendly meta tags. The page itself never
  scrolls or bounces (overflow hidden, position fixed in touch mode,
  touchmove preventDefault outside textareas).
- Landscape-only on touch devices: CSS portrait overlay saying "Please
  rotate your device" plus a try/catch screen.orientation.lock attempt.
- TRUE fullscreen everywhere: the logical viewport WIDENS (240-360 logical
  px) to match the screen aspect, the canvas and stage resize with it, and
  the stage scales via transform — no letterboxing on desktop or phone.
  F toggles browser fullscreen on desktop. The battle scene stays a 240px
  composition centered in the wider viewport with the backdrop
  cover-scaled across it.
- On-screen touch controls overlaid INSIDE the game like mobile RPG ports:
  semi-transparent D-pad bottom-left (press-and-hold keeps walking), A and
  B bottom-right with the START pill stacked above A, >=48px targets,
  touchstart/touchend with preventDefault, wired into the exact same input
  layer as the keyboard.
- Controls show only when touch is the PRIMARY input (pointer: coarse AND
  hover: none) — touchscreen laptops stay keyboard-first; a real tap shows
  the controls and a keypress hides them.

QUALITY
- Include a node-runnable validate.js that checks map row widths, warp
  targets landing on walkable tiles, learnset/species/item references, and
  sprite data integrity. It must also validate environmental puzzle devices,
  solver flags, reset points, gate reachability, encounter weights, and full
  wild-species coverage. All JS must pass node --check.
```
