// ===== Local image assets (downloaded by download-assets.js / download-overworld.js) =====
// The game must run from file:// — everything is local, no hotlinking.
// Every accessor degrades gracefully to the code-drawn sprites if an image
// is missing or fails to load.

const DEX_NUM = {
  bulbasaur: 1, ivysaur: 2, venusaur: 3,
  charmander: 4, charmeleon: 5, charizard: 6,
  squirtle: 7, wartortle: 8, blastoise: 9,
  caterpie: 10, metapod: 11, butterfree: 12,
  weedle: 13, kakuna: 14, beedrill: 15,
  pidgey: 16, pidgeotto: 17, pidgeot: 18,
  rattata: 19, raticate: 20,
};

// User-supplied Essentials-style Graphics pack. Only species used by the
// current adventure are registered, so deployments don't need to ship
// thousands of unused images. Existing #001-#020 keep their compact assets.
const GRAPHICS_SPECIES_FILE = {
  spearow: 'SPEAROW', fearow: 'FEAROW',
  pikachu: 'PIKACHU', raichu: 'RAICHU',
  sandshrew: 'SANDSHREW', sandslash: 'SANDSLASH',
  zubat: 'ZUBAT', golbat: 'GOLBAT',
  mankey: 'MANKEY', primeape: 'PRIMEAPE',
  sentret: 'SENTRET', furret: 'FURRET',
  zigzagoon: 'ZIGZAGOON', linoone: 'LINOONE',
  starly: 'STARLY', staravia: 'STARAVIA', staraptor: 'STARAPTOR',
  lillipup: 'LILLIPUP', herdier: 'HERDIER', stoutland: 'STOUTLAND',
  fletchling: 'FLETCHLING', fletchinder: 'FLETCHINDER', talonflame: 'TALONFLAME',
  grubbin: 'GRUBBIN', charjabug: 'CHARJABUG', vikavolt: 'VIKAVOLT',
  rookidee: 'ROOKIDEE', corvisquire: 'CORVISQUIRE', corviknight: 'CORVIKNIGHT',
  pawmi: 'PAWMI', pawmo: 'PAWMO', pawmot: 'PAWMOT',
  oddish: 'ODDISH', gloom: 'GLOOM', vileplume: 'VILEPLUME',
  gastly: 'GASTLY', haunter: 'HAUNTER', gengar: 'GENGAR',
  mareep: 'MAREEP', flaaffy: 'FLAAFFY', ampharos: 'AMPHAROS',
  ralts: 'RALTS', kirlia: 'KIRLIA', gardevoir: 'GARDEVOIR',
  roggenrola: 'ROGGENROLA', boldore: 'BOLDORE', gigalith: 'GIGALITH',
  noibat: 'NOIBAT', noivern: 'NOIVERN',
  snom: 'SNOM', frosmoth: 'FROSMOTH',
  tinkatink: 'TINKATINK', tinkatuff: 'TINKATUFF', tinkaton: 'TINKATON',
  rockruff: 'ROCKRUFF', lycanroc: 'LYCANROC',
  wooper: 'WOOPER', quagsire: 'QUAGSIRE',
  houndour: 'HOUNDOUR', houndoom: 'HOUNDOOM',
  swablu: 'SWABLU', altaria: 'ALTARIA',
  shinx: 'SHINX', luxio: 'LUXIO', luxray: 'LUXRAY',
  drilbur: 'DRILBUR', excadrill: 'EXCADRILL',
  goomy: 'GOOMY', sliggoo: 'SLIGGOO', goodra: 'GOODRA',
  rowlet: 'ROWLET', dartrix: 'DARTRIX', decidueye: 'DECIDUEYE',
  fidough: 'FIDOUGH', dachsbun: 'DACHSBUN',
  frigibax: 'FRIGIBAX', arctibax: 'ARCTIBAX', baxcalibur: 'BAXCALIBUR',
  glimmet: 'GLIMMET', glimmora: 'GLIMMORA',
};

const ITEM_ICON_FILE = {
  pokeball: 'poke-ball', greatball: 'great-ball',
  potion: 'potion', superpotion: 'super-potion',
  antidote: 'antidote', paralyzeheal: 'paralyze-heal',
  awakening: 'awakening', burnheal: 'burn-heal',
  iceheal: 'ice-heal', fullheal: 'full-heal',
  rarecandy: 'assets/Graphics/Items/RARECANDY.png',
};

function itemIconPath(itemId) {
  const file = ITEM_ICON_FILE[itemId];
  if (!file) return null;
  return file.endsWith('.png') ? file : `assets/items/${file}.png`;
}

// ---------- Overworld tileset slicing (Pokemon-Obsidian sheets) ----------
// Source tiles are 32px, drawn onto the 16px logical grid (2:1 downscale).
// Entry: s = sheet key, x/y/w/h = source rect, base = tile drawn underneath
// (for transparent / tall art), ball = pedestal ball-icon overlay.
// Entries taller than 32px extend upward over the tile above (trees, shelves).
const TILE_SRC_OUT = {
  '.': { s: 'outdoor', x: 0, y: 0, w: 32, h: 32 },
  // Most outdoor maps use these punctuation tiles for their floor strings.
  // Keep them on the supplied textured sheet instead of silently falling
  // back to the flat code-drawn tile art.
  ',': { s: 'outdoor', x: 0, y: 0, w: 32, h: 32 },
  ':': { s: 'outdoor', x: 32, y: 96, w: 32, h: 32 },
  '=': { s: 'outdoor', x: 32, y: 96, w: 32, h: 32 },
  'q': { s: 'outdoor', x: 32, y: 96, w: 32, h: 32 },
  't': { s: 'outdoor', x: 0, y: 2880, w: 32, h: 32, base: '.' },
  // Use the supplied compact object trees across outdoor maps. The old
  // tall-sheet slice looked like a mismatched placeholder at 16px scale.
  'T': { variants: [
    { s: 'tree1', x: 0, y: 0, w: 32, h: 32, base: ',' },
    { s: 'tree1', x: 32, y: 0, w: 32, h: 32, base: ',' },
    { s: 'tree2', x: 0, y: 0, w: 32, h: 32, base: ',' },
    { s: 'tree2', x: 32, y: 0, w: 32, h: 32, base: ',' },
  ] },
  // Animated-looking wave variations from the supplied Sea tileset. The
  // old outdoor slice was a flat sky-blue filler, not a water surface.
  'W': { variants: [
    { s: 'water', x: 0, y: 0, w: 32, h: 32 },
    { s: 'water', x: 32, y: 0, w: 32, h: 32 },
    { s: 'water', x: 64, y: 0, w: 32, h: 32 },
    { s: 'water', x: 96, y: 0, w: 32, h: 32 },
  ] },
  'A': { variants: [
    { s: 'rock', x: 0, y: 0, w: 32, h: 32, base: ',' },
    { s: 'rock', x: 32, y: 0, w: 32, h: 32, base: ',' },
    { s: 'rock', x: 0, y: 32, w: 32, h: 32, base: ',' },
    { s: 'rock', x: 32, y: 32, w: 32, h: 32, base: ',' },
  ] },
  'O': { variants: [
    { s: 'boulder', x: 0, y: 0, w: 32, h: 32, base: ',' },
    { s: 'boulder', x: 32, y: 0, w: 32, h: 32, base: ',' },
    { s: 'boulder', x: 0, y: 32, w: 32, h: 32, base: ',' },
    { s: 'boulder', x: 32, y: 32, w: 32, h: 32, base: ',' },
  ] },
  'F': { variants: [
    { s: 'flowers', x: 0, y: 0, w: 32, h: 32, base: '.' },
    { s: 'flowers', x: 32, y: 0, w: 32, h: 32, base: '.' },
    { s: 'flowers', x: 64, y: 0, w: 32, h: 32, base: '.' },
    { s: 'flowers', x: 96, y: 0, w: 32, h: 32, base: '.' },
  ] },
  'f': { s: 'outdoor', x: 32, y: 768, w: 32, h: 32, base: '.' },
  's': { s: 'outdoor', x: 128, y: 96, w: 32, h: 32, base: '.' },
};
const TILE_SRC_IN = {
  // Every interior fallback now comes from the supplied Graphics pack. The
  // previous downloaded interior sheet was a different tileset and made
  // rooms switch style as soon as one of these object symbols was drawn.
  '_': { s: 'interiorGeneral', x: 0, y: 1888, w: 32, h: 32 },
  'w': { s: 'interiorGeneral', x: 0, y: 64, w: 32, h: 32 },
  // Interior furniture is taken from identifiable objects in the supplied
  // sheets: the old mappings were just random floor slices.
  // The complete horizontal threshold mat is offset by half a source tile in
  // the mansion sheet. The old 96,736 crop stopped through its right and
  // lower edges, which made every interior entrance look visibly torn off.
  'm': { s: 'mansionInterior', x: 112, y: 736, w: 64, h: 40, base: '_', object: 'exit_mat' },
  'D': { s: 'mansionInterior', x: 112, y: 736, w: 64, h: 40, base: '_', object: 'exit_mat' },
  // Complete objects from the supplied sheets. Source rectangles were checked
  // as whole silhouettes; none of these begin or end in the middle of a sofa,
  // shelf, staircase, plant, or machine. Home stairs use one complete compact
  // wall flight rather than assembling the sheet's ceremonial centre stairs.
  'B': { s: 'interiorGeneral', x: 0, y: 4832, w: 64, h: 64, base: '_', ox: 8, oy: 16, object: 'single_bed' },
  'b': { s: 'interiorGeneral', x: 0, y: 4480, w: 64, h: 96, base: '_', ox: 8, oy: 32, object: 'bookcase' },
  // A single three-tile wall flight. The former six-tile ceremonial mansion
  // staircase belonged in a foyer, not a compact family home, and made its
  // centre look like the usable step. This flight rises into the right wall;
  // its lower-right cell is the actual warp approach, so its art extends left.
  'h': { s: 'mansionInterior', x: 96, y: 672, w: 96, h: 64, base: '_', ox: -16, object: 'wall_staircase' },
  'G': { s: 'martInterior', x: 160, y: 416, w: 96, h: 64, base: '_', ox: 16, oy: 16, object: 'goods_shelf' },
  // The next sheet row contains red-X placeholders, so the complete upper
  // machine/counter bank is intentionally a 4x2 object rather than 4x3.
  'H': { s: 'pokeCenter', x: 128, y: 768, w: 128, h: 64, base: '_', ox: 24, oy: 16, object: 'healing_station' },
  'P': { s: 'pokeCenter', x: 224, y: 864, w: 32, h: 64, base: '_', object: 'storage_terminal' },
  // The checkout is centred on its interaction tile so the clerk can stand
  // directly behind it and the player directly in front.
  'k': { s: 'martInterior', x: 0, y: 448, w: 160, h: 32, base: '_', object: 'checkout_counter' },
  'K': { s: 'interiorGeneral', x: 96, y: 4736, w: 128, h: 64, base: '_', ox: 24, oy: 16, object: 'kitchen_counter' },
  'J': { s: 'interiorGeneral', x: 64, y: 5632, w: 64, h: 64, base: '_', ox: 8, oy: 16, object: 'lab_console' },
  // Four complete bicycles (two rows) from the supplied bicycle-shop sheet.
  // The old repair-room placeholder was a cave boulder with no relation to
  // the building's purpose.
  'Y': { s: 'bikeInterior', x: 64, y: 192, w: 128, h: 64, base: '_', ox: 24, oy: 16, object: 'bike_rack' },
  // Both sofas are two source tiles tall. Starting at y=5056 retained only
  // the seat/front row and discarded the entire backrest at y=5024.
  'n': { s: 'interiorGeneral', x: 64, y: 5024, w: 96, h: 64, base: '_', ox: 16, oy: 16, object: 'blue_sofa' },
  // One complete display base plus a local Poké Ball icon per candidate. The
  // source's unrelated orange crystal cap is omitted; the old entries were
  // three adjacent wall fragments from y=5472, not starter furniture.
  '1': { s: 'interiorGeneral', x: 128, y: 5344, w: 32, h: 64, base: '_', ball: true, object: 'starter_pedestal', parts: [
    { x: 128, y: 5376, w: 32, h: 32, dx: 0, dy: 32 },
  ] },
  '2': { s: 'interiorGeneral', x: 128, y: 5344, w: 32, h: 64, base: '_', ball: true, object: 'starter_pedestal', parts: [
    { x: 128, y: 5376, w: 32, h: 32, dx: 0, dy: 32 },
  ] },
  '3': { s: 'interiorGeneral', x: 128, y: 5344, w: 32, h: 64, base: '_', ball: true, object: 'starter_pedestal', parts: [
    { x: 128, y: 5376, w: 32, h: 32, dx: 0, dy: 32 },
  ] },
  'V': { s: 'interiorGeneral', x: 0, y: 5856, w: 64, h: 32, base: '_', ox: 8, object: 'television' },
  'p': { s: 'interiorGeneral', x: 64, y: 5536, w: 32, h: 64, base: '_', oy: 16, object: 'potted_plant' },
  'd': { s: 'interiorGeneral', x: 0, y: 6784, w: 96, h: 64, base: '_', ox: 16, oy: 16, object: 'writing_desk' },
  's': { s: 'interiorGeneral', x: 160, y: 5024, w: 96, h: 64, base: '_', ox: 16, oy: 16, object: 'brown_sofa' },
  'W': { variants: [
    { s: 'water', x: 0, y: 0, w: 32, h: 32 },
    { s: 'water', x: 32, y: 0, w: 32, h: 32 },
    { s: 'water', x: 64, y: 0, w: 32, h: 32 },
    { s: 'water', x: 96, y: 0, w: 32, h: 32 },
  ] },
  'O': { variants: [
    { s: 'boulder', x: 0, y: 0, w: 32, h: 32, base: '_' },
    { s: 'boulder', x: 32, y: 0, w: 32, h: 32, base: '_' },
    { s: 'boulder', x: 0, y: 32, w: 32, h: 32, base: '_' },
    { s: 'boulder', x: 32, y: 32, w: 32, h: 32, base: '_' },
  ] },
};

// Small purpose-built sheets from the supplied Graphics pack. Entries not
// listed here fall back to the standard indoor/outdoor table, then to the
// code-drawn tile art if the image is unavailable.
const TILE_SRC_THEME = {
  // The forest template still falls back to the proven outdoor slices. Cave
  // maps use only visually reviewed, complete cells from the supplied dungeon
  // sheet; its red-X editor placeholders are deliberately not referenced.
  forest: {},
  cave: {
    '_': { variants: [
      { s: 'caveFloor', x: 32, y: 64, w: 32, h: 32 },
      { s: 'caveFloor', x: 32, y: 96, w: 32, h: 32 },
    ] },
    'w': { s: 'dungeonCave', x: 64, y: 0, w: 32, h: 32 },
    's': { s: 'dungeonCave', x: 224, y: 160, w: 32, h: 32, base: '_' },
  },
  // Clean, full-tile rows from the supplied pack. The previous generic
  // indoor slices crossed transparent unused cells, which made rooms look
  // like broken furniture pasted over holes.
  interior: {
    '_': { s: 'interiorGeneral', x: 0, y: 1888, w: 32, h: 32 },
    'w': { s: 'interiorGeneral', x: 0, y: 64, w: 32, h: 32 },
  },
  // Residential and civic rooms use complete, repeatable 32px cells from
  // different reviewed bands of the supplied Interior general sheet. Pairing
  // a floor and wall palette per building keeps ordinary doors from opening
  // onto the same recoloured room while retaining one coherent asset style.
  bedroom_home: {
    '_': { s: 'interiorGeneral', x: 0, y: 1120, w: 32, h: 32 },
    'w': { s: 'interiorGeneral', x: 64, y: 0, w: 32, h: 32 },
  },
  family_home: {
    '_': { s: 'interiorGeneral', x: 0, y: 1888, w: 32, h: 32 },
    'w': { s: 'interiorGeneral', x: 32, y: 0, w: 32, h: 32 },
  },
  rival_home: {
    '_': { s: 'interiorGeneral', x: 0, y: 1248, w: 32, h: 32 },
    'w': { s: 'interiorGeneral', x: 192, y: 128, w: 32, h: 32 },
  },
  willow_craft: {
    '_': { s: 'interiorGeneral', x: 0, y: 1504, w: 32, h: 32 },
    'w': { s: 'interiorGeneral', x: 32, y: 0, w: 32, h: 32 },
  },
  willow_civic: {
    '_': { s: 'interiorGeneral', x: 0, y: 1632, w: 32, h: 32 },
    'w': { s: 'interiorGeneral', x: 0, y: 128, w: 32, h: 32 },
  },
  stone_workshop: {
    '_': { s: 'interiorGeneral', x: 0, y: 1024, w: 32, h: 32 },
    'w': { s: 'interiorGeneral', x: 0, y: 0, w: 32, h: 32 },
  },
  gear_workshop: {
    '_': { s: 'interiorGeneral', x: 0, y: 1120, w: 32, h: 32 },
    'w': { s: 'interiorGeneral', x: 64, y: 0, w: 32, h: 32 },
  },
  gear_residence: {
    '_': { s: 'interiorGeneral', x: 0, y: 1888, w: 32, h: 32 },
    'w': { s: 'interiorGeneral', x: 0, y: 192, w: 32, h: 32 },
  },
  bloom_nursery: {
    '_': { s: 'interiorGeneral', x: 0, y: 1760, w: 32, h: 32 },
    'w': { s: 'interiorGeneral', x: 0, y: 544, w: 32, h: 32 },
  },
  bloom_study: {
    '_': { s: 'interiorGeneral', x: 0, y: 1376, w: 32, h: 32 },
    'w': { s: 'interiorGeneral', x: 192, y: 128, w: 32, h: 32 },
  },
  lab: {
    '_': { s: 'interiorGeneral', x: 0, y: 1888, w: 32, h: 32 },
    'w': { s: 'interiorGeneral', x: 0, y: 64, w: 32, h: 32 },
  },
  pokemon_center: {
    '_': { s: 'pokeCenter', x: 0, y: 256, w: 32, h: 32 },
    'w': { s: 'interiorGeneral', x: 0, y: 64, w: 32, h: 32 },
  },
  mart: {
    '_': { s: 'martInterior', x: 0, y: 128, w: 32, h: 32 },
    'w': { s: 'interiorGeneral', x: 0, y: 64, w: 32, h: 32 },
  },
  stone_gym: {
    '_': { s: 'gymInterior', x: 64, y: 224, w: 32, h: 32 },
    'w': { s: 'gymInterior', x: 0, y: 64, w: 32, h: 32 },
  },
  tide_gym: {
    '_': { s: 'gymInterior', x: 0, y: 544, w: 32, h: 32 },
    'w': { s: 'interiorGeneral', x: 0, y: 64, w: 32, h: 32 },
  },
  circuit_gym: {
    '_': { s: 'gymInterior', x: 0, y: 2304, w: 32, h: 32 },
    'w': { s: 'gymInterior', x: 128, y: 2112, w: 32, h: 32 },
  },
  garden_gym: {
    '_': { s: 'gymInterior', x: 64, y: 1344, w: 32, h: 32 },
    'w': { s: 'interiorGeneral', x: 0, y: 64, w: 32, h: 32 },
  },
  // The supplied object sheets contain cleaner compact tree silhouettes than
  // the tall placeholder slice used by the old outdoor sheet. Vary them by
  // map coordinate so a tree line does not repeat one identical sprite.
  village: {
    T: { variants: [
      { s: 'tree1', x: 0, y: 0, w: 32, h: 32, base: ',' },
      { s: 'tree1', x: 32, y: 0, w: 32, h: 32, base: ',' },
      { s: 'tree2', x: 0, y: 0, w: 32, h: 32, base: ',' },
      { s: 'tree2', x: 32, y: 0, w: 32, h: 32, base: ',' },
    ] },
  },
};

const SHEET_FILE = {
  outdoor: 'assets/overworld/outdoor.png',
  flowers: 'assets/overworld/flowers.png',
  tree1: 'assets/Graphics/Characters/Object tree 1.png',
  tree2: 'assets/Graphics/Characters/Object tree 2.png',
  rock: 'assets/Graphics/Characters/Object rock.png',
  boulder: 'assets/Graphics/Characters/Object boulder.png',
  water: 'assets/Graphics/Autotiles/Sea without shore.png',
  interiorGeneral: 'assets/Graphics/Tilesets/Interior general.png',
  pokeCenter: 'assets/Graphics/Tilesets/Poke Centre interior.png',
  martInterior: 'assets/Graphics/Tilesets/Mart interior.png',
  mansionInterior: 'assets/Graphics/Tilesets/Mansion interior.png',
  gymInterior: 'assets/Graphics/Tilesets/Gyms interior.png',
  bikeInterior: 'assets/Graphics/Tilesets/Bike shop interior.png',
  caveFloor: 'assets/Graphics/Autotiles/Brown cave floor.png',
  dungeonCave: 'assets/Graphics/Tilesets/Dungeon cave.png',
};

const BATTLE_BG_FILE = {
  field: 'field_bg.png', forest: 'forest_bg.png', rocky: 'rocky_bg.png',
  cave1: 'cave1_bg.png', water: 'water_bg.png', city: 'city_bg.png',
  indoor1: 'indoor1_bg.png', indoor2: 'indoor2_bg.png', indoor3: 'indoor3_bg.png',
};

const TRAINER_VISUALS = Object.freeze({
  mason: {
    full: 'assets/Graphics/Trainers/LEADER_Brock.png',
    face: 'assets/Graphics/Transitions/hgss_vs_LEADER_Brock.png',
    player: 'assets/Graphics/Transitions/vsTrainer_POKEMONTRAINER_Red.png',
    mark: 'assets/Graphics/Transitions/hgss_vs1.png',
  },
  seira: {
    full: 'assets/Graphics/Trainers/LEADER_Misty.png',
    face: 'assets/Graphics/Transitions/hgss_vs_LEADER_Misty.png',
    player: 'assets/Graphics/Transitions/vsTrainer_POKEMONTRAINER_Red.png',
    mark: 'assets/Graphics/Transitions/hgss_vs1.png',
  },
  toren: {
    full: 'assets/Graphics/Trainers/LEADER_Surge.png',
    face: 'assets/Graphics/Transitions/hgss_vs_LEADER_Surge.png',
    player: 'assets/Graphics/Transitions/vsTrainer_POKEMONTRAINER_Red.png',
    mark: 'assets/Graphics/Transitions/hgss_vs1.png',
  },
  eloa: {
    full: 'assets/Graphics/Trainers/LEADER_Erika.png',
    face: 'assets/Graphics/Transitions/hgss_vs_LEADER_Erika.png',
    player: 'assets/Graphics/Transitions/vsTrainer_POKEMONTRAINER_Red.png',
    mark: 'assets/Graphics/Transitions/hgss_vs1.png',
  },
});

// Opaque body of each building image (measured; the files carry transparent
// shadow padding right/bottom). All anchoring and collision use the BODY so
// buildings sit flush on their door row with no invisible walls.
const BUILDING_BODY = {
  // occludeH is the upper roof slice redrawn over actors standing behind the
  // building. The lower facade stays behind actors on the front door row.
  house:  { x: 0, y: 9,  w: 80, h: 89, occludeH: 70 },
  center: { x: 0, y: 12, w: 64, h: 87, occludeH: 58 },
  mart:   { x: 0, y: 4,  w: 64, h: 79, occludeH: 50 },
};

// Whole-building images drawn over grassed footprints (tile rects).
// The body is anchored bottom-center on the footprint; every tile the body
// covers by >=8px becomes solid (except the 'D' door tile).
const MAP_DECALS = {
  hometown: [
    { img: 'house',  x0: 4,  y0: 5,  x1: 8,  y1: 7,  hue: -18 }, // woodshop
    { img: 'house',  x0: 25, y0: 5,  x1: 29, y1: 7,  hue: 105 }, // town hall
    { img: 'house',  x0: 25, y0: 15, x1: 29, y1: 17, hue: 155 }, // Rex's house
    { img: 'house',  x0: 4,  y0: 21, x1: 8,  y1: 23 },           // player's house
    { img: 'house',  x0: 12, y0: 21, x1: 16, y1: 23, hue: 52 },  // garden house
    { img: 'center', x0: 20, y0: 21, x1: 24, y1: 23 },           // Maple's lab
  ],
  stonegate: [
    { img: 'house', x0: 4, y0: 6, x1: 10, y1: 8 },      // gym
    { img: 'house', x0: 31, y0: 6, x1: 35, y1: 8 },     // stone workshop
    { img: 'center', x0: 4, y0: 19, x1: 8, y1: 21 },    // healing center
    { img: 'mart', x0: 33, y0: 19, x1: 37, y1: 21 },    // mart
  ],
  lakeglass: [
    { img: 'house', x0: 17, y0: 5, x1: 23, y1: 7 },     // gym
    { img: 'center', x0: 4, y0: 20, x1: 8, y1: 22 },    // healing center
    { img: 'mart', x0: 33, y0: 20, x1: 37, y1: 22 },    // mart
  ],
  brightgear: [
    { img: 'house',  x0: 20, y0: 6,  x1: 26, y1: 8,  hue: 48 },
    { img: 'house',  x0: 5,  y0: 7,  x1: 9,  y1: 9,  hue: -18 },
    { img: 'house',  x0: 37, y0: 7,  x1: 41, y1: 9,  hue: 135 },
    { img: 'center', x0: 4,  y0: 22, x1: 8,  y1: 24 },
    { img: 'mart',   x0: 39, y0: 22, x1: 43, y1: 24 },
  ],
  everbloom: [
    { img: 'house',  x0: 21, y0: 6,  x1: 27, y1: 8,  hue: 92 },
    { img: 'house',  x0: 5,  y0: 17, x1: 9,  y1: 19, hue: 28 },
    { img: 'house',  x0: 40, y0: 17, x1: 44, y1: 19, hue: 150 },
    { img: 'house',  x0: 14, y0: 25, x1: 18, y1: 27, hue: 58 },
    { img: 'house',  x0: 31, y0: 25, x1: 35, y1: 27, hue: 118 },
    { img: 'center', x0: 5,  y0: 24, x1: 9,  y1: 26 },
    { img: 'mart',   x0: 40, y0: 24, x1: 44, y1: 26 },
  ],
};

// RMXP-style charsets: 4 frames per row, rows = down / left / right / up.
const CHAR_ROW = { down: 0, left: 1, right: 2, up: 3 };
// The supplied Graphics pack has 28 distinct four-direction NPC sheets.
// Keep them as visual variants rather than forcing every villager through one
// generic charset.
const NPC_CHAR_PATH = {
  npc01: 'assets/Graphics/Characters/NPC 01.png',
  npc02: 'assets/Graphics/Characters/NPC 02.png',
  npc03: 'assets/Graphics/Characters/NPC 03.png',
  npc04: 'assets/Graphics/Characters/NPC 04.png',
  npc05: 'assets/Graphics/Characters/NPC 05.png',
  npc06: 'assets/Graphics/Characters/NPC 06.png',
  npc07: 'assets/Graphics/Characters/NPC 07.png',
  npc08: 'assets/Graphics/Characters/NPC 08.png',
  npc09: 'assets/Graphics/Characters/NPC 09.png',
  npc10: 'assets/Graphics/Characters/NPC 10.png',
  npc11: 'assets/Graphics/Characters/NPC 11.png',
  npc12: 'assets/Graphics/Characters/NPC 12.png',
  npc13: 'assets/Graphics/Characters/NPC 13.png',
  npc14: 'assets/Graphics/Characters/NPC 14.png',
  npc15: 'assets/Graphics/Characters/NPC 15.png',
  npc16: 'assets/Graphics/Characters/NPC 16.png',
  npc17: 'assets/Graphics/Characters/NPC 17.png',
  npc18: 'assets/Graphics/Characters/NPC 18.png',
  npc19: 'assets/Graphics/Characters/NPC 19.png',
  npc20: 'assets/Graphics/Characters/NPC 20.png',
  npc21: 'assets/Graphics/Characters/NPC 21.png',
  npc22: 'assets/Graphics/Characters/NPC 22.png',
  npc23: 'assets/Graphics/Characters/NPC 23.png',
  npc24: 'assets/Graphics/Characters/NPC 24.png',
  npc25: 'assets/Graphics/Characters/NPC 25.png',
  npc26: 'assets/Graphics/Characters/NPC 26.png',
  npc27: 'assets/Graphics/Characters/NPC 27.png',
  npc28: 'assets/Graphics/Characters/NPC 28.png',
};
const CHAR_PATH = Object.assign({
  player: 'assets/Graphics/Characters/boy_run.png',
  player_bike: 'assets/Graphics/Characters/boy_bike.png',
  // Core cast and service roles were selected by inspecting their front frame,
  // not by NPC sheet number. In particular, NPC 10 is an elderly man and must
  // never be used as a nurse, while NPC 22 reads as an elderly resident rather
  // than the player's mother.
  parent: 'assets/Graphics/Characters/NPC 19.png',
  prof: 'assets/Graphics/Characters/trainer_PROFESSOR.png',
  rival: 'assets/Graphics/Characters/trainer_RIVAL1.png',
  leader: 'assets/Graphics/Characters/trainer_LEADER_Brock.png',
  hiker: 'assets/Graphics/Characters/trainer_HIKER.png',
  clerk: 'assets/Graphics/Characters/NPC 04.png',
  nurse: 'assets/Graphics/Characters/NPC 16.png',
  scout: 'assets/Graphics/Characters/trainer_CAMPER.png',
  picnic: 'assets/Graphics/Characters/trainer_PICNICKER.png',
  villager: 'assets/Graphics/Characters/NPC 17.png',
  villager2: 'assets/Graphics/Characters/NPC 14.png',
  leader_mason: 'assets/Graphics/Characters/trainer_LEADER_Brock.png',
  leader_seira: 'assets/Graphics/Characters/trainer_LEADER_Misty.png',
  leader_toren: 'assets/Graphics/Characters/trainer_LEADER_Surge.png',
  leader_eloa: 'assets/Graphics/Characters/trainer_LEADER_Erika.png',
  trainer_youngster: 'assets/Graphics/Characters/trainer_YOUNGSTER.png',
  trainer_lass: 'assets/Graphics/Characters/trainer_LASS.png',
  trainer_bugcatcher: 'assets/Graphics/Characters/trainer_BUGCATCHER.png',
  trainer_ranger_f: 'assets/Graphics/Characters/trainer_POKEMONRANGER_F.png',
  trainer_ranger_m: 'assets/Graphics/Characters/trainer_POKEMONRANGER_M.png',
  trainer_teamrocket_f: 'assets/Graphics/Characters/trainer_TEAMROCKET_F.png',
  trainer_teamrocket_m: 'assets/Graphics/Characters/trainer_TEAMROCKET_M.png',
  trainer_fisherman: 'assets/Graphics/Characters/trainer_FISHERMAN.png',
  trainer_sailor: 'assets/Graphics/Characters/trainer_SAILOR.png',
  trainer_scientist: 'assets/Graphics/Characters/trainer_SCIENTIST.png',
  trainer_engineer: 'assets/Graphics/Characters/trainer_ENGINEER.png',
  trainer_painter: 'assets/Graphics/Characters/trainer_PAINTER.png',
  trainer_swimmer_f: 'assets/Graphics/Characters/trainer_SWIMMER_F.png',
  trainer_swimmer_m: 'assets/Graphics/Characters/trainer_SWIMMER_M.png',
  trainer_cooltrainer_f: 'assets/Graphics/Characters/trainer_COOLTRAINER_F.png',
  trainer_cooltrainer_m: 'assets/Graphics/Characters/trainer_COOLTRAINER_M.png',
  trainer_biker: 'assets/Graphics/Characters/trainer_BIKER.png',
  trainer_supernerd: 'assets/Graphics/Characters/trainer_SUPERNERD.png',
  trainer_birdkeeper: 'assets/Graphics/Characters/trainer_BIRDKEEPER.png',
  trainer_aromalady: 'assets/Graphics/Characters/trainer_AROMALADY.png',
  trainer_gentleman: 'assets/Graphics/Characters/trainer_GENTLEMAN.png',
  trainer_beauty: 'assets/Graphics/Characters/trainer_BEAUTY.png',
  trainer_ruinmaniac: 'assets/Graphics/Characters/trainer_RUINMANIAC.png',
  trainer_rocketboss: 'assets/Graphics/Characters/trainer_ROCKETBOSS.png',
}, NPC_CHAR_PATH);
const CHAR_FILES = Object.keys(CHAR_PATH);
function characterPath(kind) { return CHAR_PATH[kind] || `assets/Graphics/Characters/${kind}.png`; }

const GameAssets = {
  // Lazily populated caches — an Image is created the first time something
  // actually needs it (current map's sheets, on-screen NPC kinds, the
  // species in the active battle...), never all at once at boot.
  front: {}, back: {}, icons: {}, items: {}, silhouettes: {},
  sheets: {}, chars: {}, buildings: {}, battleBgs: {}, trainerVisuals: {},

  init() { /* nothing eager — everything loads on demand */ },

  _lazy(store, key, src) {
    let img = store[key];
    if (!img) {
      img = new Image();
      img.src = src;
      store[key] = img;
    }
    return img;
  },

  _ready(img) { return !!(img && img.complete && img.naturalWidth > 0); },

  // Image or null (caller falls back to the code-drawn sprite).
  // Pass shiny=true for the shiny palette variant.
  frontFor(species, shiny) {
    const graphicsFile = GRAPHICS_SPECIES_FILE[species];
    if (graphicsFile) {
      const key = shiny ? species + '_gs' : species + '_g';
      const dir = shiny ? 'Front shiny' : 'Front';
      const i = this._lazy(this.front, key, `assets/Graphics/Pokemon/${dir}/${graphicsFile}.png`);
      return this._ready(i) ? i : null;
    }
    const n = DEX_NUM[species];
    if (!n) return null;
    const key = shiny ? species + '_s' : species;
    const dir = shiny ? 'front-shiny' : 'front';
    const i = this._lazy(this.front, key, `assets/sprites/${dir}/${n}.png`);
    return this._ready(i) ? i : null;
  },
  backFor(species, shiny) {
    const graphicsFile = GRAPHICS_SPECIES_FILE[species];
    if (graphicsFile) {
      const key = shiny ? species + '_gbs' : species + '_gb';
      const dir = shiny ? 'Back shiny' : 'Back';
      const i = this._lazy(this.back, key, `assets/Graphics/Pokemon/${dir}/${graphicsFile}.png`);
      return this._ready(i) ? i : null;
    }
    const n = DEX_NUM[species];
    if (!n) return null;
    const key = shiny ? species + '_s' : species;
    const dir = shiny ? 'back-shiny' : 'back';
    const i = this._lazy(this.back, key, `assets/sprites/${dir}/${n}.png`);
    return this._ready(i) ? i : null;
  },
  iconFor(species, shiny) {
    const graphicsFile = GRAPHICS_SPECIES_FILE[species];
    if (!graphicsFile) return null;
    const key = shiny ? species + '_is' : species;
    const dir = shiny ? 'Icons shiny' : 'Icons';
    const i = this._lazy(this.icons, key, `assets/Graphics/Pokemon/${dir}/${graphicsFile}.png`);
    return this._ready(i) ? i : null;
  },
  // Shape silhouettes are shared by every species in the same body category.
  // Battle allies use matching rear-view art; menus and opponents use front.
  // Return the lazy image even before it is ready so DOM canvases can repaint
  // on load; drawMysterySilhouette supplies a code-drawn fallback meanwhile.
  silhouetteFor(species, view = 'front') {
    const asset = mysterySilhouetteAsset(species);
    if (!asset) return null;
    const backView = view === 'back';
    const key = `${backView ? 'back' : 'front'}:${asset}`;
    const file = backView ? `Back/${asset}.png` : `${asset}.png`;
    return this._lazy(this.silhouettes, key, `assets/Graphics/Silhouette/${file}`);
  },
  drawMysterySilhouette(ctx, species, x, y, width, height = width, view = 'front') {
    const backView = view === 'back';
    const img = this.silhouetteFor(species, view);
    if (this._ready(img)) {
      ctx.drawImage(img, x, y, width, height);
      return true;
    }
    // Missing/loading assets must not reveal the real sprite shape.
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(width / 96, height / 96);
    ctx.fillStyle = '#090b10';
    if (backView) {
      // A loading/missing rear asset must still face away and must never leak
      // the real species outline during the first battle frame.
      ctx.beginPath(); ctx.arc(48, 31, 19, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(48, 62, 30, 27, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(27, 72, 17, 17); ctx.fillRect(52, 72, 17, 17);
    } else {
      ctx.beginPath(); ctx.ellipse(48, 58, 31, 25, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(48, 30, 19, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f4f0e8';
      ctx.font = 'bold 30px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 48, 46);
    }
    ctx.restore();
    return false;
  },
  itemIconUrl(itemId) {
    return itemIconPath(itemId);
  },
  itemIconImg(itemId) {
    const path = itemIconPath(itemId);
    if (!path) return null;
    const i = this._lazy(this.items, itemId, path);
    return this._ready(i) ? i : null;
  },
  battleBackground(theme = 'field') {
    const file = BATTLE_BG_FILE[theme];
    if (!file) {
      const old = this._lazy(this.battleBgs, 'fallback', 'assets/battle/back_grass.png');
      return this._ready(old) ? old : null;
    }
    const i = this._lazy(this.battleBgs, theme, `assets/Graphics/Battlebacks/${file}`);
    return this._ready(i) ? i : null;
  },
  trainerVisual(key) {
    const visual = TRAINER_VISUALS[key];
    if (!visual) return null;
    for (const [part, file] of Object.entries(visual)) {
      this._lazy(this.trainerVisuals, `${key}_${part}`, file);
    }
    return visual;
  },
  _sheet(key) { return this._lazy(this.sheets, key, SHEET_FILE[key] || `assets/overworld/${key}.png`); },
  _building(key) { return this._lazy(this.buildings, key, `assets/overworld/${key}.png`); },

  // ----- tileset tiles -----
  _tileEntry(ch, indoor, theme, tileX, tileY) {
    const themed = TILE_SRC_THEME[theme];
    let entry = (themed && themed[ch]) || (indoor ? TILE_SRC_IN : TILE_SRC_OUT)[ch];
    if (entry && entry.variants) {
      const variant = Math.abs(tileX * 17 + tileY * 31) % entry.variants.length;
      entry = entry.variants[variant];
    }
    return entry || null;
  },

  _drawTileObject(ctx, entry, sheet, dx, dy) {
    const dw = entry.w / 2;
    const dh = entry.h / 2;
    const drawX = dx + 8 - dw / 2 + (entry.ox || 0);
    const drawY = dy + 16 - dh + (entry.oy || 0);
    if (entry.parts) {
      for (const part of entry.parts) {
        ctx.drawImage(sheet, part.x, part.y, part.w, part.h,
          drawX + (part.dx || 0) / 2, drawY + (part.dy || 0) / 2,
          part.w / 2, part.h / 2);
      }
    } else {
      ctx.drawImage(sheet, entry.x, entry.y, entry.w, entry.h, drawX, drawY, dw, dh);
    }
    if (entry.ball) {
      const ball = this.itemIconImg('pokeball');
      // 16px source -> 8 logical px -> 16 device px under the game's 2x
      // transform, keeping the supplied icon at exact native pixel scale.
      if (ball) ctx.drawImage(ball, dx + 4, dy - 3, 8, 8);
    }
    return true;
  },

  // Draws ch at (dx,dy) on the 16px grid. Returns false to request the
  // code-drawn fallback (sheet not ready or char unmapped).
  drawTile(ctx, ch, dx, dy, indoor, theme, tileX = 0, tileY = 0) {
    const e = this._tileEntry(ch, indoor, theme, tileX, tileY);
    if (!e) return false;
    const sheet = this._sheet(e.s);
    if (!this._ready(sheet)) return false;
    if (e.base && !this.drawTile(ctx, e.base, dx, dy, indoor, theme, tileX, tileY)) return false;
    // Art is centered by default. Furniture entries may override that anchor
    // so a complete 2- or 3-tile group lands on integer grid cells instead of
    // sitting half a tile off and looking cut.
    return this._drawTileObject(ctx, e, sheet, dx, dy);
  },

  // Multi-cell furniture is rendered in two phases: all floor first, then the
  // whole object in the entity depth pass. This prevents later floor rows from
  // painting over the lower half of a correctly cropped sofa or bookcase.
  drawTileBase(ctx, ch, dx, dy, indoor, theme, tileX = 0, tileY = 0) {
    const e = this._tileEntry(ch, indoor, theme, tileX, tileY);
    return this.drawTile(ctx, e && e.base ? e.base : ch, dx, dy, indoor, theme, tileX, tileY);
  },

  drawTileObject(ctx, ch, dx, dy, indoor, theme, tileX = 0, tileY = 0) {
    const e = this._tileEntry(ch, indoor, theme, tileX, tileY);
    if (!e) return false;
    const sheet = this._sheet(e.s);
    if (!this._ready(sheet)) return false;
    return this._drawTileObject(ctx, e, sheet, dx, dy);
  },

  // ----- building decals -----
  _decalAt(mapId, x, y) {
    return (MAP_DECALS[mapId] || []).find(d =>
      x >= d.x0 && x <= d.x1 && y >= d.y0 && y <= d.y1) || null;
  },

  // True when a ready building image hides this tile (renderer draws grass).
  tileCovered(mapId, x, y) {
    const d = this._decalAt(mapId, x, y);
    return !!(d && this._ready(this._building(d.img)));
  },

  // Tile span the building BODY occupies (measured opaque bounds — the
  // files carry transparent shadow padding that must not block tiles).
  // Horizontal edges still use the measured body width so transparent shadow
  // padding does not create side walls; the upper visual roof is back-lane space.
  _visualSpan(d) {
    // Collision must not wait for Image.decode(). Otherwise the player can
    // walk across the roof during the lazy-load window and become trapped by
    // a building only after its sprite finishes loading.
    if (!BUILDING_BODY[d.img]) return null;
    if (!d._span) {
      const b = BUILDING_BODY[d.img];
      const cx = ((d.x0 + d.x1 + 1) / 2) * 16;
      d._span = {
        x0: Math.floor((cx - b.w / 2 + 8) / 16),
        x1: Math.floor((cx + b.w / 2 - 8) / 16),
        // The cells above the mapped footprint form the intentional back
        // lane. Actors there are hidden by the roof occlusion pass instead of
        // being trapped behind an invisible wall.
        y0: d.y0,
        y1: d.y1,
      };
    }
    return d._span;
  },

  // Collision: the mapped building footprint is solid (doors are exempted by
  // the caller), while the visible roof above it remains a traversable back
  // lane and is handled by the roof occlusion pass.
  decalSolid(mapId, x, y) {
    for (const d of (MAP_DECALS[mapId] || [])) {
      const s = this._visualSpan(d);
      if (s && x >= s.x0 && x <= s.x1 && y >= s.y0 && y <= s.y1) return true;
    }
    return false;
  },

  drawDecals(ctx, mapId, camX, camY, layer = 'full') {
    for (const d of (MAP_DECALS[mapId] || [])) {
      const img = this._building(d.img);
      if (!this._ready(img)) continue;
      const b = BUILDING_BODY[d.img];
      const cx = ((d.x0 + d.x1 + 1) / 2) * 16;
      const bottom = (d.y1 + 1) * 16;
      const drawX = Math.round(cx - (b.x + b.w / 2) - camX);
      const drawY = bottom - (b.y + b.h) - camY;
      // body bottom-center sits on the footprint's bottom edge
      ctx.save();
      if (d.hue) ctx.filter = `hue-rotate(${d.hue}deg)`;
      if (layer === 'roof') {
        const h = Math.min(b.occludeH || 0, img.height);
        if (h > 0) ctx.drawImage(img, 0, 0, img.width, h, drawX, drawY, img.width, h);
      } else {
        ctx.drawImage(img, drawX, drawY);
      }
      ctx.restore();
    }
  },

  // ----- character walk sheets -----
  // Draws the actor anchored at the feet of tile-pixel (px,py). Supplied
  // 32x48 character frames land at 12x18 logical px; the 48x48 bike frames
  // land at 18x18, keeping every actor inside one tile's visual footprint.
  // frame: 0..3 walk cycle (0 = idle). Returns false for drawn fallback.
  drawActor(ctx, kind, facing, frame, px, py) {
    if (!CHAR_FILES.includes(kind)) return false;
    const img = this._lazy(this.chars, kind, characterPath(kind));
    if (!this._ready(img)) return false;
    const fw = img.width / 4, fh = img.height / 4;
    const row = CHAR_ROW[facing] !== undefined ? CHAR_ROW[facing] : 0;
    const dh = Math.min(fh / 2, 18);
    const dw = fw * (dh / fh);
    // half-logical-pixel rounding = whole device pixels on the 2x canvas
    const dx = Math.round((px + 8 - dw / 2) * 2) / 2;
    const dy = Math.round((py + 17 - dh) * 2) / 2;
    ctx.drawImage(img, frame * fw, row * fh, fw, fh, dx, dy, dw, dh);
    return true;
  },

  // ----- background warm-up -----
  // Kicks off every download AFTER boot so nothing waits on page load but
  // everything is cached by the time it's needed. Accessors stay lazy-safe.
  preloadAll() {
    for (const species of Object.keys(DEX_NUM)) {
      this.frontFor(species); this.backFor(species);
      this.frontFor(species, true); this.backFor(species, true);
    }
    for (const species of Object.keys(GRAPHICS_SPECIES_FILE)) {
      this.frontFor(species); this.backFor(species); this.iconFor(species);
      this.frontFor(species, true); this.backFor(species, true); this.iconFor(species, true);
    }
    for (const id of Object.keys(ITEM_ICON_FILE)) this.itemIconImg(id);
    for (const speciesIds of Object.values(MYSTERY_SILHOUETTE_GROUPS)) {
      const species = speciesIds[0];
      this.silhouetteFor(species);
      this.silhouetteFor(species, 'back');
    }
    for (const s of Object.keys(SHEET_FILE)) this._sheet(s);
    for (const b of ['house', 'center', 'mart']) this._building(b);
    for (const kind of CHAR_FILES) this._lazy(this.chars, kind, characterPath(kind));
    for (const key of Object.keys(TRAINER_VISUALS)) this.trainerVisual(key);
    for (const theme of Object.keys(BATTLE_BG_FILE)) this.battleBackground(theme);
  },
};
