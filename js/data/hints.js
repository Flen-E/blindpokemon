// ===== Mystery encounter hint database =====
// Canonical Pokédex measurements and taxonomy for the species currently in
// the game. Values are kept separately from battle stats so encounters can
// reveal clues without revealing the species id or sprite.

const DEFENSE_HINT_TYPES = [
  'NORMAL', 'GRASS', 'WATER', 'FIRE', 'ICE', 'FIGHTING', 'GROUND',
  'ELECTRIC', 'DRAGON', 'FLYING', 'PSYCHIC', 'BUG', 'ROCK', 'GHOST',
  'DARK', 'POISON', 'STEEL', 'FAIRY',
];

const HINT_TYPE_NAMES = {
  NORMAL: '\uB178\uB9D0', GRASS: '\uD480', WATER: '\uBB3C', FIRE: '\uBD88',
  ICE: '\uC5BC\uC74C', FIGHTING: '\uACA9\uD22C', GROUND: '\uB545',
  ELECTRIC: '\uC804\uAE30', DRAGON: '\uB4DC\uB798\uACE4', FLYING: '\uBE44\uD589',
  PSYCHIC: '\uC5D0\uC2A4\uD37C', BUG: '\uBC8C\uB808', ROCK: '\uBC14\uC704',
  GHOST: '\uACE0\uC2A4\uD2B8', DARK: '\uC545', POISON: '\uB3C5',
  STEEL: '\uAC15\uCCA0', FAIRY: '\uD398\uC5B4\uB9AC',
};

const HINT_DATA = {
  bulbasaur:  { name: '\uC774\uC0C1\uD574\uC528', height: 0.7, weight: 6.9, color: 'green',  shape: 'quadruped', gender: '87.5/12.5', growth: 'medium-slow', previous: null,       next: 'ivysaur',   nextLevel: 16, catchRate: 45 },
  ivysaur:    { name: '\uC774\uC0C1\uD574\uD480', height: 1.0, weight: 13.0, color: 'green', shape: 'quadruped', gender: '87.5/12.5', growth: 'medium-slow', previous: 'bulbasaur', next: 'venusaur', nextLevel: 32, catchRate: 45 },
  venusaur:   { name: '\uC774\uC0C1\uD574\uAF43', height: 2.0, weight: 100.0, color: 'green', shape: 'quadruped', gender: '87.5/12.5', growth: 'medium-slow', previous: 'ivysaur', next: null, nextLevel: null, catchRate: 45 },
  charmander: { name: '\uD30C\uC774\uB9AC', height: 0.6, weight: 8.5, color: 'red',    shape: 'upright',   gender: '87.5/12.5', growth: 'medium-slow', previous: null,         next: 'charmeleon', nextLevel: 16, catchRate: 45 },
  charmeleon: { name: '\uB9AC\uC790\uB4DC', height: 1.1, weight: 19.0, color: 'red',   shape: 'upright',   gender: '87.5/12.5', growth: 'medium-slow', previous: 'charmander', next: 'charizard', nextLevel: 36, catchRate: 45 },
  charizard:  { name: '\uB9AC\uC790\uBABD', height: 1.7, weight: 90.5, color: 'red',  shape: 'wings',     gender: '87.5/12.5', growth: 'medium-slow', previous: 'charmeleon', next: null, nextLevel: null, catchRate: 45 },
  squirtle:   { name: '\uAF2C\uBD80\uAE30', height: 0.5, weight: 9.0, color: 'blue',   shape: 'upright',   gender: '87.5/12.5', growth: 'medium-slow', previous: null,       next: 'wartortle', nextLevel: 16, catchRate: 45 },
  wartortle:  { name: '\uC5B4\uB2C8\uBD80\uAE30', height: 1.0, weight: 22.5, color: 'blue', shape: 'upright', gender: '87.5/12.5', growth: 'medium-slow', previous: 'squirtle', next: 'blastoise', nextLevel: 36, catchRate: 45 },
  blastoise:  { name: '\uAC70\uBD81\uC655', height: 1.6, weight: 85.5, color: 'blue',  shape: 'upright',   gender: '87.5/12.5', growth: 'medium-slow', previous: 'wartortle', next: null, nextLevel: null, catchRate: 45 },
  caterpie:   { name: '\uCE90\uD130\uD53C', height: 0.3, weight: 2.9, color: 'green',   shape: 'squiggle',  gender: '50/50',     growth: 'medium-fast', previous: null,       next: 'metapod', nextLevel: 7, catchRate: 255 },
  metapod:    { name: '\uB2E8\uB370\uAE30', height: 0.7, weight: 9.9, color: 'green',   shape: 'squiggle',  gender: '50/50',     growth: 'medium-fast', previous: 'caterpie', next: 'butterfree', nextLevel: 10, catchRate: 120 },
  butterfree:  { name: '\uBC84\uD130\uD50C', height: 1.1, weight: 32.0, color: 'white', shape: 'wings',     gender: '50/50',     growth: 'medium-fast', previous: 'metapod', next: null, nextLevel: null, catchRate: 45 },
  weedle:     { name: '\uBFD4\uCDA9\uC774', height: 0.3, weight: 3.2, color: 'brown',  shape: 'squiggle',  gender: '50/50',     growth: 'medium-fast', previous: null,       next: 'kakuna', nextLevel: 7, catchRate: 255 },
  kakuna:     { name: '\uB531\uCDA9\uC774', height: 0.6, weight: 10.0, color: 'yellow', shape: 'squiggle',  gender: '50/50',     growth: 'medium-fast', previous: 'weedle', next: 'beedrill', nextLevel: 10, catchRate: 120 },
  beedrill:   { name: '\uB3C5\uCE68\uBD95', height: 1.0, weight: 29.5, color: 'yellow', shape: 'wings',     gender: '50/50',     growth: 'medium-fast', previous: 'kakuna', next: null, nextLevel: null, catchRate: 45 },
  pidgey:     { name: '\uAD6C\uAD6C', height: 0.3, weight: 1.8, color: 'brown',  shape: 'wings',     gender: '50/50',     growth: 'medium-slow', previous: null,       next: 'pidgeotto', nextLevel: 18, catchRate: 255 },
  pidgeotto:  { name: '\uD53C\uC96C', height: 1.1, weight: 30.0, color: 'brown', shape: 'wings',     gender: '50/50',     growth: 'medium-slow', previous: 'pidgey', next: 'pidgeot', nextLevel: 36, catchRate: 120 },
  pidgeot:    { name: '\uD53C\uC96C\uD22C', height: 1.5, weight: 39.5, color: 'brown', shape: 'wings',   gender: '50/50', growth: 'medium-slow', previous: 'pidgeotto', next: null, nextLevel: null, catchRate: 45 },
  rattata:    { name: '\uAF2C\uB9AC\uC120', height: 0.3, weight: 3.5, color: 'purple', shape: 'quadruped', gender: '50/50', growth: 'medium-fast', previous: null, next: 'raticate', nextLevel: 20, catchRate: 255 },
  raticate:   { name: '\uB2E4\uAF2C\uB9AC', height: 0.7, weight: 18.5, color: 'brown', shape: 'quadruped', gender: '50/50', growth: 'medium-fast', previous: 'rattata', next: null, nextLevel: null, catchRate: 127 },
  spearow:    { name: '깨비참', height: 0.3, weight: 2.0, color: 'brown', shape: 'wings', gender: '50/50', growth: 'medium-fast', previous: null, next: 'fearow', nextLevel: 20, catchRate: 255 },
  fearow:     { name: '깨비드릴조', height: 1.2, weight: 38.0, color: 'brown', shape: 'wings', gender: '50/50', growth: 'medium-fast', previous: 'spearow', next: null, nextLevel: null, catchRate: 90 },
  pikachu:    { name: '피카츄', height: 0.4, weight: 6.0, color: 'yellow', shape: 'quadruped', gender: '50/50', growth: 'medium-fast', previous: null, next: 'raichu', nextLevel: null, catchRate: 190 },
  raichu:     { name: '라이츄', height: 0.8, weight: 30.0, color: 'yellow', shape: 'upright', gender: '50/50', growth: 'medium-fast', previous: 'pikachu', next: null, nextLevel: null, catchRate: 75 },
  sandshrew:  { name: '모래두지', height: 0.6, weight: 12.0, color: 'yellow', shape: 'upright', gender: '50/50', growth: 'medium-fast', previous: null, next: 'sandslash', nextLevel: 22, catchRate: 255 },
  sandslash:  { name: '고지', height: 1.0, weight: 29.5, color: 'yellow', shape: 'upright', gender: '50/50', growth: 'medium-fast', previous: 'sandshrew', next: null, nextLevel: null, catchRate: 90 },
  zubat:      { name: '주뱃', height: 0.8, weight: 7.5, color: 'purple', shape: 'wings', gender: '50/50', growth: 'medium-fast', previous: null, next: 'golbat', nextLevel: 22, catchRate: 255 },
  golbat:     { name: '골뱃', height: 1.6, weight: 55.0, color: 'purple', shape: 'wings', gender: '50/50', growth: 'medium-fast', previous: 'zubat', next: null, nextLevel: null, catchRate: 90 },
  mankey:     { name: '망키', height: 0.5, weight: 28.0, color: 'brown', shape: 'upright', gender: '50/50', growth: 'medium-fast', previous: null, next: 'primeape', nextLevel: 28, catchRate: 190 },
  primeape:   { name: '성원숭', height: 1.0, weight: 32.0, color: 'brown', shape: 'upright', gender: '50/50', growth: 'medium-fast', previous: 'mankey', next: null, nextLevel: null, catchRate: 75 },
  sentret:    { name: '꼬리선', height: 0.8, weight: 6.0, color: 'brown', shape: 'quadruped', gender: '50/50', growth: 'medium-fast', previous: null, next: 'furret', nextLevel: 15, catchRate: 255 },
  furret:     { name: '다꼬리', height: 1.8, weight: 32.5, color: 'brown', shape: 'quadruped', gender: '50/50', growth: 'medium-fast', previous: 'sentret', next: null, nextLevel: null, catchRate: 90 },
  zigzagoon:  { name: '지그제구리', height: 0.4, weight: 17.5, color: 'brown', shape: 'quadruped', gender: '50/50', growth: 'medium-fast', previous: null, next: 'linoone', nextLevel: 20, catchRate: 255 },
  linoone:    { name: '직구리', height: 0.5, weight: 32.5, color: 'white', shape: 'quadruped', gender: '50/50', growth: 'medium-fast', previous: 'zigzagoon', next: null, nextLevel: null, catchRate: 90 },
  starly:     { name: '찌르꼬', height: 0.3, weight: 2.0, color: 'brown', shape: 'wings', gender: '50/50', growth: 'medium-slow', previous: null, next: 'staravia', nextLevel: 14, catchRate: 255 },
  staravia:   { name: '찌르버드', height: 0.6, weight: 15.5, color: 'brown', shape: 'wings', gender: '50/50', growth: 'medium-slow', previous: 'starly', next: 'staraptor', nextLevel: 34, catchRate: 120 },
  staraptor:  { name: '찌르호크', height: 1.2, weight: 24.9, color: 'brown', shape: 'wings', gender: '50/50', growth: 'medium-slow', previous: 'staravia', next: null, nextLevel: null, catchRate: 45 },
  lillipup:   { name: '요테리', height: 0.4, weight: 4.1, color: 'brown', shape: 'quadruped', gender: '50/50', growth: 'medium-slow', previous: null, next: 'herdier', nextLevel: 16, catchRate: 255 },
  herdier:    { name: '하데리어', height: 0.9, weight: 14.7, color: 'gray', shape: 'quadruped', gender: '50/50', growth: 'medium-slow', previous: 'lillipup', next: 'stoutland', nextLevel: 32, catchRate: 120 },
  stoutland:  { name: '바랜드', height: 1.2, weight: 61.0, color: 'gray', shape: 'quadruped', gender: '50/50', growth: 'medium-slow', previous: 'herdier', next: null, nextLevel: null, catchRate: 45 },
  fletchling: { name: '화살꼬빈', height: 0.3, weight: 1.7, color: 'red', shape: 'wings', gender: '50/50', growth: 'medium-slow', previous: null, next: 'fletchinder', nextLevel: 17, catchRate: 255 },
  fletchinder:{ name: '불화살빈', height: 0.7, weight: 16.0, color: 'red', shape: 'wings', gender: '50/50', growth: 'medium-slow', previous: 'fletchling', next: 'talonflame', nextLevel: 35, catchRate: 120 },
  talonflame: { name: '파이어로', height: 1.2, weight: 24.5, color: 'red', shape: 'wings', gender: '50/50', growth: 'medium-slow', previous: 'fletchinder', next: null, nextLevel: null, catchRate: 45 },
  grubbin:    { name: '턱지충이', height: 0.4, weight: 4.4, color: 'gray', shape: 'armor', gender: '50/50', growth: 'medium-fast', previous: null, next: 'charjabug', nextLevel: 20, catchRate: 255 },
  charjabug:  { name: '전지충이', height: 0.5, weight: 10.5, color: 'green', shape: 'squiggle', gender: '50/50', growth: 'medium-fast', previous: 'grubbin', next: 'vikavolt', nextLevel: 30, catchRate: 120 },
  vikavolt:   { name: '투구뿌논', height: 1.5, weight: 45.0, color: 'blue', shape: 'armor', gender: '50/50', growth: 'medium-fast', previous: 'charjabug', next: null, nextLevel: null, catchRate: 45 },
  rookidee:   { name: '파라꼬', height: 0.2, weight: 1.8, color: 'blue', shape: 'wings', gender: '50/50', growth: 'medium-slow', previous: null, next: 'corvisquire', nextLevel: 18, catchRate: 255 },
  corvisquire:{ name: '파크로우', height: 0.8, weight: 16.0, color: 'blue', shape: 'wings', gender: '50/50', growth: 'medium-slow', previous: 'rookidee', next: 'corviknight', nextLevel: 38, catchRate: 120 },
  corviknight:{ name: '아머까오', height: 2.2, weight: 75.0, color: 'purple', shape: 'wings', gender: '50/50', growth: 'medium-slow', previous: 'corvisquire', next: null, nextLevel: null, catchRate: 45 },
  pawmi:      { name: '빠모', height: 0.3, weight: 2.5, color: 'yellow', shape: 'quadruped', gender: '50/50', growth: 'medium-fast', previous: null, next: 'pawmo', nextLevel: 18, catchRate: 190 },
  pawmo:      { name: '빠모트', height: 0.4, weight: 6.5, color: 'yellow', shape: 'upright', gender: '50/50', growth: 'medium-fast', previous: 'pawmi', next: 'pawmot', nextLevel: 30, catchRate: 80 },
  pawmot:     { name: '빠르모트', height: 0.9, weight: 41.0, color: 'yellow', shape: 'upright', gender: '50/50', growth: 'medium-fast', previous: 'pawmo', next: null, nextLevel: null, catchRate: 45 },
  oddish:     { name: '뚜벅쵸', height: 0.5, weight: 5.4, color: 'blue', shape: 'upright', gender: '50/50', growth: 'medium-slow', previous: null, next: 'gloom', nextLevel: 21, catchRate: 255 },
  gloom:      { name: '냄새꼬', height: 0.8, weight: 8.6, color: 'blue', shape: 'upright', gender: '50/50', growth: 'medium-slow', previous: 'oddish', next: 'vileplume', nextLevel: null, catchRate: 120 },
  vileplume:  { name: '라플레시아', height: 1.2, weight: 18.6, color: 'red', shape: 'upright', gender: '50/50', growth: 'medium-slow', previous: 'gloom', next: null, nextLevel: null, catchRate: 45 },
  gastly:     { name: '고오스', height: 1.3, weight: 0.1, color: 'purple', shape: 'ball', gender: '50/50', growth: 'medium-slow', previous: null, next: 'haunter', nextLevel: 25, catchRate: 190 },
  haunter:    { name: '고우스트', height: 1.6, weight: 0.1, color: 'purple', shape: 'arms', gender: '50/50', growth: 'medium-slow', previous: 'gastly', next: 'gengar', nextLevel: null, catchRate: 90 },
  gengar:     { name: '팬텀', height: 1.5, weight: 40.5, color: 'purple', shape: 'upright', gender: '50/50', growth: 'medium-slow', previous: 'haunter', next: null, nextLevel: null, catchRate: 45 },
  mareep:     { name: '메리프', height: 0.6, weight: 7.8, color: 'white', shape: 'quadruped', gender: '50/50', growth: 'medium-slow', previous: null, next: 'flaaffy', nextLevel: 15, catchRate: 235 },
  flaaffy:    { name: '보송송', height: 0.8, weight: 13.3, color: 'pink', shape: 'upright', gender: '50/50', growth: 'medium-slow', previous: 'mareep', next: 'ampharos', nextLevel: 30, catchRate: 120 },
  ampharos:   { name: '전룡', height: 1.4, weight: 61.5, color: 'yellow', shape: 'upright', gender: '50/50', growth: 'medium-slow', previous: 'flaaffy', next: null, nextLevel: null, catchRate: 45 },
  ralts:      { name: '랄토스', height: 0.4, weight: 6.6, color: 'white', shape: 'upright', gender: '50/50', growth: 'slow', previous: null, next: 'kirlia', nextLevel: 20, catchRate: 235 },
  kirlia:     { name: '킬리아', height: 0.8, weight: 20.2, color: 'white', shape: 'upright', gender: '50/50', growth: 'slow', previous: 'ralts', next: 'gardevoir', nextLevel: 30, catchRate: 120 },
  gardevoir:  { name: '가디안', height: 1.6, weight: 48.4, color: 'white', shape: 'upright', gender: '50/50', growth: 'slow', previous: 'kirlia', next: null, nextLevel: null, catchRate: 45 },
  roggenrola: { name: '단굴', height: 0.4, weight: 18.0, color: 'blue', shape: 'armor', gender: '50/50', growth: 'medium-slow', previous: null, next: 'boldore', nextLevel: 25, catchRate: 255 },
  boldore:    { name: '암트르', height: 0.9, weight: 102.0, color: 'blue', shape: 'armor', gender: '50/50', growth: 'medium-slow', previous: 'roggenrola', next: 'gigalith', nextLevel: null, catchRate: 120 },
  gigalith:   { name: '기가이어스', height: 1.7, weight: 260.0, color: 'blue', shape: 'armor', gender: '50/50', growth: 'medium-slow', previous: 'boldore', next: null, nextLevel: null, catchRate: 45 },
  noibat:     { name: '음뱃', height: 0.5, weight: 8.0, color: 'purple', shape: 'wings', gender: '50/50', growth: 'medium-fast', previous: null, next: 'noivern', nextLevel: 48, catchRate: 190 },
  noivern:    { name: '음번', height: 1.5, weight: 85.0, color: 'purple', shape: 'wings', gender: '50/50', growth: 'medium-fast', previous: 'noibat', next: null, nextLevel: null, catchRate: 45 },
  snom:       { name: '누니머기', height: 0.3, weight: 3.8, color: 'white', shape: 'squiggle', gender: '50/50', growth: 'medium-fast', previous: null, next: 'frosmoth', nextLevel: null, catchRate: 190 },
  frosmoth:   { name: '모스노우', height: 1.3, weight: 42.0, color: 'white', shape: 'wings', gender: '50/50', growth: 'medium-fast', previous: 'snom', next: null, nextLevel: null, catchRate: 75 },
  tinkatink:  { name: '어리짱', height: 0.4, weight: 8.9, color: 'pink', shape: 'upright', gender: '0/100', growth: 'medium-slow', previous: null, next: 'tinkatuff', nextLevel: 24, catchRate: 190 },
  tinkatuff:  { name: '벼리짱', height: 0.7, weight: 59.1, color: 'pink', shape: 'upright', gender: '0/100', growth: 'medium-slow', previous: 'tinkatink', next: 'tinkaton', nextLevel: 38, catchRate: 90 },
  tinkaton:   { name: '두드리짱', height: 0.7, weight: 112.8, color: 'pink', shape: 'upright', gender: '0/100', growth: 'medium-slow', previous: 'tinkatuff', next: null, nextLevel: null, catchRate: 45 },
  rockruff:   { name: '암멍이', height: 0.5, weight: 9.2, color: 'brown', shape: 'quadruped', gender: '50/50', growth: 'medium-fast', previous: null, next: 'lycanroc', nextLevel: 25, catchRate: 190 },
  lycanroc:   { name: '루가루암', height: 0.8, weight: 25.0, color: 'brown', shape: 'quadruped', gender: '50/50', growth: 'medium-fast', previous: 'rockruff', next: null, nextLevel: null, catchRate: 90 },
  wooper:     { name: '우파', height: 0.4, weight: 8.5, color: 'blue', shape: 'legs', gender: '50/50', growth: 'medium-fast', previous: null, next: 'quagsire', nextLevel: 20, catchRate: 255 },
  quagsire:   { name: '누오', height: 1.4, weight: 75.0, color: 'blue', shape: 'upright', gender: '50/50', growth: 'medium-fast', previous: 'wooper', next: null, nextLevel: null, catchRate: 90 },
  houndour:   { name: '델빌', height: 0.6, weight: 10.8, color: 'black', shape: 'quadruped', gender: '50/50', growth: 'slow', previous: null, next: 'houndoom', nextLevel: 24, catchRate: 120 },
  houndoom:   { name: '헬가', height: 1.4, weight: 35.0, color: 'black', shape: 'quadruped', gender: '50/50', growth: 'slow', previous: 'houndour', next: null, nextLevel: null, catchRate: 45 },
  swablu:     { name: '파비코', height: 0.4, weight: 1.2, color: 'blue', shape: 'wings', gender: '50/50', growth: 'erratic', previous: null, next: 'altaria', nextLevel: 35, catchRate: 255 },
  altaria:    { name: '파비코리', height: 1.1, weight: 20.6, color: 'blue', shape: 'wings', gender: '50/50', growth: 'erratic', previous: 'swablu', next: null, nextLevel: null, catchRate: 45 },
  shinx:      { name: '꼬링크', height: 0.5, weight: 9.5, color: 'blue', shape: 'quadruped', gender: '50/50', growth: 'medium-slow', previous: null, next: 'luxio', nextLevel: 15, catchRate: 235 },
  luxio:      { name: '럭시오', height: 0.9, weight: 30.5, color: 'blue', shape: 'quadruped', gender: '50/50', growth: 'medium-slow', previous: 'shinx', next: 'luxray', nextLevel: 30, catchRate: 120 },
  luxray:     { name: '렌트라', height: 1.4, weight: 42.0, color: 'blue', shape: 'quadruped', gender: '50/50', growth: 'medium-slow', previous: 'luxio', next: null, nextLevel: null, catchRate: 45 },
  drilbur:    { name: '두더류', height: 0.3, weight: 8.5, color: 'gray', shape: 'upright', gender: '50/50', growth: 'medium-fast', previous: null, next: 'excadrill', nextLevel: 31, catchRate: 120 },
  excadrill:  { name: '몰드류', height: 0.7, weight: 40.4, color: 'gray', shape: 'humanoid', gender: '50/50', growth: 'medium-fast', previous: 'drilbur', next: null, nextLevel: null, catchRate: 60 },
  goomy:      { name: '미끄메라', height: 0.3, weight: 2.8, color: 'purple', shape: 'squiggle', gender: '50/50', growth: 'slow', previous: null, next: 'sliggoo', nextLevel: 40, catchRate: 45 },
  sliggoo:    { name: '미끄네일', height: 0.8, weight: 17.5, color: 'purple', shape: 'squiggle', gender: '50/50', growth: 'slow', previous: 'goomy', next: 'goodra', nextLevel: 50, catchRate: 45 },
  goodra:     { name: '미끄래곤', height: 2.0, weight: 150.5, color: 'purple', shape: 'upright', gender: '50/50', growth: 'slow', previous: 'sliggoo', next: null, nextLevel: null, catchRate: 45 },
  rowlet:     { name: '나몰빼미', height: 0.3, weight: 1.5, color: 'brown', shape: 'wings', gender: '87.5/12.5', growth: 'medium-slow', previous: null, next: 'dartrix', nextLevel: 17, catchRate: 45 },
  dartrix:    { name: '빼미스로우', height: 0.7, weight: 16.0, color: 'brown', shape: 'wings', gender: '87.5/12.5', growth: 'medium-slow', previous: 'rowlet', next: 'decidueye', nextLevel: 34, catchRate: 45 },
  decidueye:  { name: '모크나이퍼', height: 1.6, weight: 36.6, color: 'brown', shape: 'wings', gender: '87.5/12.5', growth: 'medium-slow', previous: 'dartrix', next: null, nextLevel: null, catchRate: 45 },
  fidough:    { name: '쫀도기', height: 0.3, weight: 10.9, color: 'yellow', shape: 'quadruped', gender: '50/50', growth: 'medium-slow', previous: null, next: 'dachsbun', nextLevel: 26, catchRate: 190 },
  dachsbun:   { name: '바우첼', height: 0.5, weight: 14.9, color: 'brown', shape: 'quadruped', gender: '50/50', growth: 'medium-slow', previous: 'fidough', next: null, nextLevel: null, catchRate: 90 },
  frigibax:   { name: '드니차', height: 0.5, weight: 17.0, color: 'gray', shape: 'upright', gender: '50/50', growth: 'slow', previous: null, next: 'arctibax', nextLevel: 35, catchRate: 45 },
  arctibax:   { name: '드니꽁', height: 0.8, weight: 30.0, color: 'blue', shape: 'upright', gender: '50/50', growth: 'slow', previous: 'frigibax', next: 'baxcalibur', nextLevel: 54, catchRate: 25 },
  baxcalibur: { name: '드닐레이브', height: 2.1, weight: 210.0, color: 'blue', shape: 'upright', gender: '50/50', growth: 'slow', previous: 'arctibax', next: null, nextLevel: null, catchRate: 10 },
  glimmet:    { name: '초롱순', height: 0.7, weight: 8.0, color: 'blue', shape: 'ball', gender: '50/50', growth: 'medium-slow', previous: null, next: 'glimmora', nextLevel: 35, catchRate: 70 },
  glimmora:   { name: '킬라플로르', height: 1.5, weight: 45.0, color: 'blue', shape: 'ball', gender: '50/50', growth: 'medium-slow', previous: 'glimmet', next: null, nextLevel: null, catchRate: 25 },
};

const HINT_COLOR_NAMES = {
  green: '\uCD08\uB85D', red: '\uBE68\uAC15', blue: '\uD30C\uB791', white: '\uD770\uC0C9',
  brown: '\uAC08\uC0C9', yellow: '\uB178\uB791', purple: '\uBCF4\uB77C', gray: '\uD68C\uC0C9', pink: '\uBD84\uD64D',
  black: '\uAC80\uC815',
};
// Runtime copy of silhouette_color.json's palette. The validator cross-checks
// both the hex codes and every species classification so file:// play stays
// synchronous without letting the supplied JSON drift from the game data.
const HINT_COLOR_HEX = {
  red: '#FF0000', blue: '#0000FF', yellow: '#FFFF00', green: '#008000',
  black: '#000000', brown: '#A52A2A', purple: '#800080', gray: '#808080',
  white: '#FFFFFF', pink: '#FFC0CB',
};
const HINT_SHAPE_NAMES = {
  quadruped: '\uB124\uBC1C\uD615', upright: '\uC9C1\uB9BD\uD615', wings: '\uB0A0\uAC1C\uD615', squiggle: '\uAFC8\uD2C0\uD615',
  armor: '\uAC11\uC637\uD615', ball: '\uAD6C\uD615', arms: '\uBD80\uC720 \uD314\uD615',
  legs: '\uB2E4\uB9AC\uD615', humanoid: '\uC778\uAC04\uD615',
};
const HINT_GROWTH_NAMES = {
  'medium-slow': '\uC911\uAC04 \uB290\uB9BC', 'medium-fast': '\uC911\uAC04 \uBE60\uB984', slow: '\uB290\uB9BC',
  erratic: '\uBD88\uADDC\uCE59',
};

const HINT_DEFINITIONS = [
  { id: 'height', label: '\uD0A4', value: d => `${d.height.toFixed(1)} m` },
  { id: 'weight', label: '\uBAB8\uBB34\uAC8C', value: d => `${d.weight.toFixed(1)} kg` },
  { id: 'catchRate', label: '\uD3EC\uD68D\uB960', value: d => `${d.catchRate}/255` },
  { id: 'color', label: '\uC0C9\uAE54', value: d => HINT_COLOR_NAMES[d.color] },
  { id: 'gender', label: '\uC131\uBE44', value: d => `\uC218 ${d.gender.split('/')[0]}% / \uC554 ${d.gender.split('/')[1]}%` },
  { id: 'growth', label: '\uACBD\uD5D8\uCE58', value: d => HINT_GROWTH_NAMES[d.growth] },
  // These remain simple availability slots for now. Their value functions can
  // later expose level, item, friendship, special, or trade evolution methods.
  { id: 'previous', label: '\uC774\uC804 \uC9C4\uD654', value: d => d.previous ? 'O' : 'X' },
  { id: 'next', label: '\uB2E4\uC74C \uC9C4\uD654', value: d => d.next ? 'O' : 'X' },
  ...DEFENSE_HINT_TYPES.map(type => ({
    id: `def_${type}`,
    label: HINT_TYPE_NAMES[type],
    value: (d, c) => {
      const mult = typeEffectiveness(type, SPECIES[c.species].types);
      return `${mult}X`;
    },
  })),
];

function hintValue(c, id) {
  const d = HINT_DATA[c.species];
  const def = HINT_DEFINITIONS.find(h => h.id === id);
  return d && def ? def.value(d, c) : '?';
}

function hintLabel(id) {
  const def = HINT_DEFINITIONS.find(h => h.id === id);
  return def ? def.label : '?';
}

// Runtime-safe derivative of assets/Graphics/Silhouette/silhouette.json.
// Keeping the lookup in JS preserves direct file:// play; validate.js checks
// every entry against the source JSON so this table cannot drift silently.
const MYSTERY_SILHOUETTE_GROUPS = Object.freeze({
  asset1: ['gastly', 'glimmet', 'glimmora'],
  asset2: ['oddish', 'roggenrola', 'wooper'],
  asset4: ['caterpie', 'weedle', 'grubbin', 'vikavolt'],
  asset5: ['bulbasaur', 'ivysaur', 'venusaur', 'rattata', 'raticate', 'pikachu', 'sentret', 'furret',
    'zigzagoon', 'linoone', 'lillipup', 'herdier', 'stoutland', 'pawmi', 'mareep', 'rockruff', 'lycanroc',
    'houndour', 'houndoom', 'shinx', 'luxio', 'luxray', 'fidough', 'dachsbun'],
  asset6: ['butterfree', 'beedrill', 'frosmoth'],
  asset8: ['boldore', 'gigalith'],
  asset10: ['charmander', 'charmeleon', 'charizard', 'squirtle', 'wartortle', 'blastoise', 'raichu',
    'sandshrew', 'sandslash', 'mankey', 'primeape', 'pawmo', 'pawmot', 'gengar', 'flaaffy', 'ampharos',
    'quagsire', 'drilbur', 'goodra', 'frigibax', 'arctibax', 'baxcalibur'],
  asset11: ['gloom', 'vileplume', 'ralts', 'kirlia', 'gardevoir', 'tinkatink', 'tinkatuff', 'tinkaton', 'excadrill'],
  asset12: ['pidgey', 'pidgeotto', 'pidgeot', 'spearow', 'fearow', 'zubat', 'golbat', 'starly', 'staravia',
    'staraptor', 'fletchling', 'fletchinder', 'talonflame', 'rookidee', 'corvisquire', 'corviknight',
    'noibat', 'noivern', 'swablu', 'altaria', 'rowlet', 'dartrix', 'decidueye'],
  asset13: ['metapod', 'kakuna', 'charjabug', 'snom', 'goomy', 'sliggoo'],
  asset14: ['haunter'],
});

const MYSTERY_SILHOUETTE_ASSET = Object.freeze(Object.fromEntries(
  Object.entries(MYSTERY_SILHOUETTE_GROUPS)
    .flatMap(([asset, speciesIds]) => speciesIds.map(speciesId => [speciesId, asset]))
));

function mysterySilhouetteAsset(speciesId) {
  return MYSTERY_SILHOUETTE_ASSET[speciesId] || null;
}
