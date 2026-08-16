// ===== Type system: Gen 3 chart plus Fairy defensive matchups =====
const TYPES = {
  FAIRY:    { name: '\uD398\uC5B4\uB9AC', color: '#ee99ac' },
  NORMAL:   { name: '노말',     color: '#a8a878' },
  FIRE:     { name: '불꽃',     color: '#f08030' },
  WATER:    { name: '물',       color: '#6890f0' },
  ELECTRIC: { name: '전기',     color: '#f8d030' },
  GRASS:    { name: '풀',       color: '#78c850' },
  ICE:      { name: '얼음',     color: '#98d8d8' },
  FIGHTING: { name: '격투',     color: '#c03028' },
  POISON:   { name: '독',       color: '#a040a0' },
  GROUND:   { name: '땅',       color: '#e0c068' },
  FLYING:   { name: '비행',     color: '#a890f0' },
  PSYCHIC:  { name: '에스퍼',   color: '#f85888' },
  BUG:      { name: '벌레',     color: '#a8b820' },
  ROCK:     { name: '바위',     color: '#b8a038' },
  GHOST:    { name: '고스트',   color: '#705898' },
  DRAGON:   { name: '드래곤',   color: '#7038f8' },
  DARK:     { name: '악',       color: '#705848' },
  STEEL:    { name: '강철',     color: '#b8b8d0' },
};

// TYPE_CHART[attacker][defender] = multiplier (missing = 1x). Gen 3 values.
const TYPE_CHART = {
  FAIRY:    { FIRE: 0.5, FIGHTING: 2, POISON: 0.5, DRAGON: 2, DARK: 2, STEEL: 0.5 },
  NORMAL:   { ROCK: 0.5, GHOST: 0, STEEL: 0.5 },
  FIRE:     { FIRE: 0.5, WATER: 0.5, GRASS: 2, ICE: 2, BUG: 2, ROCK: 0.5, DRAGON: 0.5, STEEL: 2 },
  WATER:    { FIRE: 2, WATER: 0.5, GRASS: 0.5, GROUND: 2, ROCK: 2, DRAGON: 0.5 },
  ELECTRIC: { WATER: 2, ELECTRIC: 0.5, GRASS: 0.5, GROUND: 0, FLYING: 2, DRAGON: 0.5 },
  GRASS:    { FIRE: 0.5, WATER: 2, GRASS: 0.5, POISON: 0.5, GROUND: 2, FLYING: 0.5, BUG: 0.5, ROCK: 2, DRAGON: 0.5, STEEL: 0.5 },
  ICE:      { FIRE: 0.5, WATER: 0.5, GRASS: 2, ICE: 0.5, GROUND: 2, FLYING: 2, DRAGON: 2, STEEL: 0.5 },
  FIGHTING: { NORMAL: 2, ICE: 2, POISON: 0.5, FLYING: 0.5, PSYCHIC: 0.5, BUG: 0.5, ROCK: 2, GHOST: 0, DARK: 2, STEEL: 2 },
  POISON:   { GRASS: 2, POISON: 0.5, GROUND: 0.5, ROCK: 0.5, GHOST: 0.5, STEEL: 0 },
  GROUND:   { FIRE: 2, ELECTRIC: 2, GRASS: 0.5, POISON: 2, FLYING: 0, BUG: 0.5, ROCK: 2, STEEL: 2 },
  FLYING:   { ELECTRIC: 0.5, GRASS: 2, FIGHTING: 2, BUG: 2, ROCK: 0.5, STEEL: 0.5 },
  PSYCHIC:  { FIGHTING: 2, POISON: 2, PSYCHIC: 0.5, DARK: 0, STEEL: 0.5 },
  BUG:      { FIRE: 0.5, GRASS: 2, FIGHTING: 0.5, POISON: 0.5, FLYING: 0.5, PSYCHIC: 2, GHOST: 0.5, DARK: 2, STEEL: 0.5 },
  ROCK:     { FIRE: 2, ICE: 2, FIGHTING: 0.5, GROUND: 0.5, FLYING: 2, BUG: 2, STEEL: 0.5 },
  GHOST:    { NORMAL: 0, PSYCHIC: 2, GHOST: 2, DARK: 0.5, STEEL: 0.5 },
  DRAGON:   { DRAGON: 2, STEEL: 0.5 },
  DARK:     { FIGHTING: 0.5, PSYCHIC: 2, GHOST: 2, DARK: 0.5, STEEL: 0.5 },
  STEEL:    { FIRE: 0.5, WATER: 0.5, ELECTRIC: 0.5, ICE: 2, ROCK: 2, STEEL: 0.5 },
};

// Fairy was introduced after the original Gen 3 chart, but is included in
// the mystery defense hints. Patch its matchups onto the legacy rows too.
TYPE_CHART.DRAGON.FAIRY = 0;
TYPE_CHART.DARK.FAIRY = 0.5;
TYPE_CHART.STEEL.FAIRY = 2;
TYPE_CHART.FIGHTING.FAIRY = 0.5;
TYPE_CHART.POISON.FAIRY = 2;
TYPE_CHART.BUG.FAIRY = 0.5;

// Multiply across all of the defender's types.
function typeEffectiveness(moveType, defenderTypes) {
  let mult = 1;
  const row = TYPE_CHART[moveType] || {};
  for (const t of defenderTypes) {
    if (row[t] !== undefined) mult *= row[t];
  }
  return mult;
}
