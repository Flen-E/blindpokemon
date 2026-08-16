// ===== Move data (Gen 3 values; category follows the Gen 3 by-type split) =====
// cat: 'phys' | 'spec' | 'status'
// effect: { status, chance }                       — inflict major status
//         { stat, stages, target, chance }         — stat stage change ('self' | 'foe')
//           stats: atk def spa spd spe acc eva
//         { volatile: 'flinch'|'confuse', chance } — volatile condition
// prio: priority bracket. hiCrit: 1/8 crit. multi: [min,max] or 2 (multi-hit).
// special: 'superfang' | 'leechseed'
const MOVES = {
  // --- NORMAL ---
  tackle:      { name: '몸통박치기',     type: 'NORMAL', cat: 'phys', power: 35, acc: 95, pp: 35,
                 desc: '온몸으로 돌진해 공격한다.' },
  scratch:     { name: '할퀴기',         type: 'NORMAL', cat: 'phys', power: 40, acc: 100, pp: 35,
                 desc: '날카로운 발톱으로 상대를 할퀸다.' },
  quickattack: { name: '전광석화',       type: 'NORMAL', cat: 'phys', power: 40, acc: 100, pp: 30, prio: 1,
                 desc: '매우 빠르게 공격해 반드시 먼저 친다.' },
  slash:       { name: '베어가르기',     type: 'NORMAL', cat: 'phys', power: 70, acc: 100, pp: 20, hiCrit: true,
                 desc: '발톱으로 베어 가른다. 급소에 맞기 쉽다.' },
  hyperfang:   { name: '필살앞니',       type: 'NORMAL', cat: 'phys', power: 80, acc: 90, pp: 15,
                 effect: { volatile: 'flinch', chance: 0.1 },
                 desc: '거대한 앞니로 문다. 상대를 풀이 죽게 할 때가 있다.' },
  superfang:   { name: '분노의앞니',     type: 'NORMAL', cat: 'phys', power: 1, acc: 90, pp: 10, special: 'superfang',
                 desc: '상대의 남은 체력을 절반으로 만든다.' },
  rapidspin:   { name: '고속스핀',       type: 'NORMAL', cat: 'phys', power: 20, acc: 100, pp: 40,
                 desc: '몸을 회전시키며 돌진한다.' },
  defensecurl: { name: '웅크리기',       type: 'NORMAL', cat: 'status', power: 0, acc: true, pp: 40,
                 effect: { stat: 'def', stages: 1, target: 'self', chance: 1 },
                 desc: '몸을 둥글게 웅크려 방어를 올린다.' },
  leer:        { name: '째려보기',       type: 'NORMAL', cat: 'status', power: 0, acc: 100, pp: 30,
                 effect: { stat: 'def', stages: -1, target: 'foe', chance: 1 },
                 desc: '날카로운 눈빛으로 상대의 방어를 떨어뜨린다.' },
  headbutt:    { name: '박치기',         type: 'NORMAL', cat: 'phys', power: 70, acc: 100, pp: 15,
                 effect: { volatile: 'flinch', chance: 0.3 },
                 desc: '머리를 내밀어 돌진한다. 상대를 풀이 죽게 할 때가 있다.' },
  growl:       { name: '울음소리',       type: 'NORMAL', cat: 'status', power: 0, acc: 100, pp: 40,
                 effect: { stat: 'atk', stages: -1, target: 'foe', chance: 1 },
                 desc: '부드럽게 울어 상대의 공격을 떨어뜨린다.' },
  tailwhip:    { name: '꼬리흔들기',     type: 'NORMAL', cat: 'status', power: 0, acc: 100, pp: 30,
                 effect: { stat: 'def', stages: -1, target: 'foe', chance: 1 },
                 desc: '꼬리를 흔들어 상대의 방어를 떨어뜨린다.' },
  smokescreen: { name: '연막',         type: 'NORMAL', cat: 'status', power: 0, acc: 100, pp: 20,
                 effect: { stat: 'acc', stages: -1, target: 'foe', chance: 1 },
                 desc: '연막을 만들어 상대의 명중률을 떨어뜨린다.' },
  sweetscent:  { name: '달콤한향기',     type: 'NORMAL', cat: 'status', power: 0, acc: 100, pp: 20,
                 effect: { stat: 'eva', stages: -1, target: 'foe', chance: 1 },
                 desc: '달콤한 향기로 상대의 회피율을 떨어뜨린다.' },
  scaryface:   { name: '겁나는얼굴',     type: 'NORMAL', cat: 'status', power: 0, acc: 90, pp: 10,
                 effect: { stat: 'spe', stages: -2, target: 'foe', chance: 1 },
                 desc: '무서운 얼굴로 상대의 스피드를 크게 떨어뜨린다.' },
  growth:      { name: '성장',           type: 'NORMAL', cat: 'status', power: 0, acc: true, pp: 40,
                 effect: { stat: 'spa', stages: 1, target: 'self', chance: 1 },
                 desc: '몸을 성장시켜 특수공격을 올린다.' },
  harden:      { name: '단단해지기',     type: 'NORMAL', cat: 'status', power: 0, acc: true, pp: 30,
                 effect: { stat: 'def', stages: 1, target: 'self', chance: 1 },
                 desc: '몸을 단단하게 해 방어를 올린다.' },
  supersonic:  { name: '초음파',         type: 'NORMAL', cat: 'status', power: 0, acc: 55, pp: 20,
                 effect: { volatile: 'confuse', chance: 1 },
                 desc: '기묘한 음파로 상대를 혼란시킨다.' },
  struggle:    { name: '발버둥',         type: 'NORMAL', cat: 'phys', power: 50, acc: 100, pp: 1, recoil: 0.25,
                 desc: '모든 기술의 PP가 없을 때만 사용한다.' },

  // Hint item attack: intentionally weaker than Struggle, but without recoil.
  hintstrike: { name: '\uAD00\uCC30 \uCDA9\uACA9', type: 'NORMAL', cat: 'phys', power: 40, acc: 100, pp: 1,
                desc: '\uAD00\uCC30 \uAE30\uB85D\uC774 \uC57D\uD55C \uCDA9\uACA9\uC744 \uBCF4\uB0B8\uB2E4.' },

  // --- GRASS ---
  vinewhip:    { name: '덩굴채찍',       type: 'GRASS', cat: 'spec', power: 35, acc: 100, pp: 10,
                 desc: '가느다란 덩굴로 상대를 휘감아 친다.' },
  razorleaf:   { name: '잎날가르기',     type: 'GRASS', cat: 'spec', power: 55, acc: 95, pp: 25, hiCrit: true,
                 desc: '날카로운 잎으로 공격한다. 급소에 맞기 쉽다.' },
  absorb:      { name: '흡수',           type: 'GRASS', cat: 'spec', power: 20, acc: 100, pp: 25, drain: 0.5,
                 desc: '양분을 흡수해 공격하고 준 피해의 일부를 회복한다.' },
  megadrain:   { name: '메가드레인',     type: 'GRASS', cat: 'spec', power: 40, acc: 100, pp: 15, drain: 0.5,
                 desc: '강하게 양분을 흡수해 준 피해의 일부를 회복한다.' },
  leechseed:   { name: '씨뿌리기',       type: 'GRASS', cat: 'status', power: 0, acc: 90, pp: 10, special: 'leechseed',
                 desc: '씨앗을 심어 매 턴 상대의 체력을 빼앗는다.' },
  sleeppowder: { name: '수면가루',       type: 'GRASS', cat: 'status', power: 0, acc: 75, pp: 15,
                 effect: { status: 'SLP', chance: 1 },
                 desc: '가루를 흩뿌려 상대를 잠들게 한다.' },
  stunspore:   { name: '마비가루',       type: 'GRASS', cat: 'status', power: 0, acc: 75, pp: 30,
                 effect: { status: 'PAR', chance: 1 },
                 desc: '가루를 흩뿌려 상대를 마비시킨다.' },

  // --- POISON ---
  poisonsting: { name: '독침',           type: 'POISON', cat: 'phys', power: 15, acc: 100, pp: 35,
                 effect: { status: 'PSN', chance: 0.3 },
                 desc: '독침을 쏜다. 상대를 중독시킬 때가 있다.' },
  poisonpowder:{ name: '독가루',         type: 'POISON', cat: 'status', power: 0, acc: 75, pp: 35,
                 effect: { status: 'PSN', chance: 1 },
                 desc: '가루를 흩뿌려 상대를 중독시킨다.' },
  acid:        { name: '용해액',         type: 'POISON', cat: 'phys', power: 40, acc: 100, pp: 30,
                 effect: { stat: 'def', stages: -1, target: 'foe', chance: 0.1 },
                 desc: '강한 산을 끼얹어 공격한다. 방어를 떨어뜨릴 때가 있다.' },

  // --- FIRE ---
  ember:       { name: '불꽃세례',       type: 'FIRE', cat: 'spec', power: 40, acc: 100, pp: 25,
                 effect: { status: 'BRN', chance: 0.1 },
                 desc: '약한 불꽃 공격. 상대를 화상 입힐 때가 있다.' },
  flamethrower:{ name: '화염방사',       type: 'FIRE', cat: 'spec', power: 95, acc: 100, pp: 15,
                 effect: { status: 'BRN', chance: 0.1 },
                 desc: '강력한 불꽃을 내뿜는다. 상대를 화상 입힐 때가 있다.' },

  // --- WATER ---
  bubble:      { name: '거품',           type: 'WATER', cat: 'spec', power: 20, acc: 100, pp: 30,
                 effect: { stat: 'spe', stages: -1, target: 'foe', chance: 0.1 },
                 desc: '거품을 뿜는다. 상대의 스피드를 떨어뜨릴 때가 있다.' },
  watergun:    { name: '물대포',         type: 'WATER', cat: 'spec', power: 40, acc: 100, pp: 25,
                 desc: '물을 세차게 쏘아 공격한다.' },
  withdraw:    { name: '껍질에숨기',     type: 'WATER', cat: 'status', power: 0, acc: true, pp: 40,
                 effect: { stat: 'def', stages: 1, target: 'self', chance: 1 },
                 desc: '껍질 속으로 숨어 방어를 올린다.' },

  // --- ICE ---
  powdersnow:  { name: '눈싸라기',       type: 'ICE', cat: 'spec', power: 40, acc: 100, pp: 25,
                 effect: { status: 'FRZ', chance: 0.1 },
                 desc: '차가운 눈을 흩뿌린다. 상대를 얼릴 때가 있다.' },
  icywind:     { name: '얼어붙은바람',   type: 'ICE', cat: 'spec', power: 55, acc: 95, pp: 15,
                 effect: { stat: 'spe', stages: -1, target: 'foe', chance: 1 },
                 desc: '차가운 바람을 일으켜 공격하고 상대의 스피드를 떨어뜨린다.' },
  icebeam:     { name: '냉동빔',         type: 'ICE', cat: 'spec', power: 90, acc: 100, pp: 10,
                 effect: { status: 'FRZ', chance: 0.1 },
                 desc: '차가운 광선을 쏜다. 상대를 얼릴 때가 있다.' },

  // --- BUG ---
  leechlife:   { name: '흡혈',           type: 'BUG', cat: 'phys', power: 20, acc: 100, pp: 15, drain: 0.5,
                 desc: '피를 빨아 공격하고 준 피해의 일부를 회복한다.' },
  bugbite:     { name: '벌레먹기',       type: 'BUG', cat: 'phys', power: 60, acc: 100, pp: 20,
                 desc: '날카로운 턱으로 상대를 물어 공격한다.' },
  stringshot:  { name: '실뿜기',         type: 'BUG', cat: 'status', power: 0, acc: 95, pp: 40,
                 effect: { stat: 'spe', stages: -1, target: 'foe', chance: 1 },
                 desc: '실로 상대를 묶어 스피드를 떨어뜨린다.' },
  twineedle:   { name: '더블니들',       type: 'BUG', cat: 'phys', power: 25, acc: 100, pp: 20, multi: 2,
                 effect: { status: 'PSN', chance: 0.2 },
                 desc: '두 개의 침으로 두 번 찌른다. 중독시킬 때가 있다.' },
  pinmissile:  { name: '바늘미사일',     type: 'BUG', cat: 'phys', power: 14, acc: 85, pp: 20, multi: [2, 5],
                 desc: '날카로운 침을 쏜다. 2~5회 연속 공격한다.' },

  // --- FLYING ---
  peck:        { name: '쪼기',           type: 'FLYING', cat: 'phys', power: 35, acc: 100, pp: 35,
                 desc: '날카로운 부리로 상대를 쪼아 공격한다.' },
  gust:        { name: '바람일으키기',   type: 'FLYING', cat: 'phys', power: 40, acc: 100, pp: 35,
                 desc: '날개로 바람을 일으켜 공격한다.' },
  wingattack:  { name: '날개치기',       type: 'FLYING', cat: 'phys', power: 60, acc: 100, pp: 35,
                 desc: '날개를 크게 펼쳐 상대를 친다.' },
  pluck:       { name: '쪼아대기',       type: 'FLYING', cat: 'phys', power: 60, acc: 100, pp: 20,
                 desc: '빠르게 파고들어 부리로 세게 쪼아 공격한다.' },
  featherdance:{ name: '깃털댄스',       type: 'FLYING', cat: 'status', power: 0, acc: 100, pp: 15,
                 effect: { stat: 'atk', stages: -2, target: 'foe', chance: 1 },
                 desc: '솜털을 흩날려 상대의 공격을 크게 떨어뜨린다.' },

  // --- ELECTRIC ---
  thundershock:{ name: '전기쇼크',       type: 'ELECTRIC', cat: 'spec', power: 40, acc: 100, pp: 30,
                 effect: { status: 'PAR', chance: 0.1 },
                 desc: '약한 전기를 흘려 공격한다. 마비시킬 때가 있다.' },
  spark:       { name: '스파크',         type: 'ELECTRIC', cat: 'phys', power: 65, acc: 100, pp: 20,
                 effect: { status: 'PAR', chance: 0.3 },
                 desc: '전기를 두르고 돌진한다. 마비시킬 때가 있다.' },
  nuzzle:      { name: '볼부비부비',     type: 'ELECTRIC', cat: 'phys', power: 20, acc: 100, pp: 20,
                 effect: { status: 'PAR', chance: 1 },
                 desc: '전기가 흐르는 볼을 비벼 반드시 마비시킨다.' },
  thunderwave: { name: '전기자석파',     type: 'ELECTRIC', cat: 'status', power: 0, acc: 100, pp: 20,
                 effect: { status: 'PAR', chance: 1 },
                 desc: '약한 전파를 보내 상대를 마비시킨다.' },

  // --- FIGHTING ---
  lowkick:     { name: '안다리걸기',     type: 'FIGHTING', cat: 'phys', power: 50, acc: 90, pp: 20,
                 desc: '상대의 다리를 걸어 넘어뜨린다.' },
  karatechop:  { name: '태권당수',       type: 'FIGHTING', cat: 'phys', power: 50, acc: 100, pp: 25, hiCrit: true,
                 desc: '날카로운 당수로 공격한다. 급소에 맞기 쉽다.' },
  armthrust:   { name: '손바닥치기',     type: 'FIGHTING', cat: 'phys', power: 15, acc: 100, pp: 20, multi: [2, 5],
                 desc: '손바닥을 내질러 2~5회 연속 공격한다.' },

  // --- GROUND ---
  sandattack:  { name: '모래뿌리기',     type: 'GROUND', cat: 'status', power: 0, acc: 100, pp: 15,
                 effect: { stat: 'acc', stages: -1, target: 'foe', chance: 1 },
                 desc: '모래를 뿌려 상대의 명중률을 떨어뜨린다.' },
  mudshot:     { name: '머드샷',         type: 'GROUND', cat: 'phys', power: 55, acc: 95, pp: 15,
                 effect: { stat: 'spe', stages: -1, target: 'foe', chance: 1 },
                 desc: '진흙 덩어리를 쏘아 공격하고 상대의 스피드를 떨어뜨린다.' },
  bulldoze:    { name: '땅고르기',       type: 'GROUND', cat: 'phys', power: 60, acc: 100, pp: 20,
                 effect: { stat: 'spe', stages: -1, target: 'foe', chance: 1 },
                 desc: '지면을 힘껏 울려 공격하고 상대의 스피드를 떨어뜨린다.' },

  // --- ROCK ---
  rockthrow:   { name: '돌떨구기',       type: 'ROCK', cat: 'phys', power: 50, acc: 90, pp: 15,
                 desc: '작은 바위를 들어 상대에게 내던진다.' },
  rockslide:   { name: '스톤샤워',       type: 'ROCK', cat: 'phys', power: 75, acc: 90, pp: 10,
                 effect: { volatile: 'flinch', chance: 0.3 },
                 desc: '큰 바위를 연달아 떨어뜨린다. 상대를 풀이 죽게 할 때가 있다.' },

  // --- STEEL ---
  metalclaw:   { name: '메탈크로우',     type: 'STEEL', cat: 'phys', power: 50, acc: 95, pp: 35,
                 effect: { stat: 'atk', stages: 1, target: 'self', chance: 0.1 },
                 desc: '강철의 발톱으로 공격한다. 자신의 공격이 오를 때가 있다.' },
  irondefense: { name: '철벽',           type: 'STEEL', cat: 'status', power: 0, acc: true, pp: 15,
                 effect: { stat: 'def', stages: 2, target: 'self', chance: 1 },
                 desc: '몸을 단단하게 만들어 방어를 크게 올린다.' },

  // --- PSYCHIC ---
  confusion:   { name: '염동력',         type: 'PSYCHIC', cat: 'spec', power: 50, acc: 100, pp: 25,
                 effect: { volatile: 'confuse', chance: 0.1 },
                 desc: '약한 염동력 공격. 상대를 혼란시킬 때가 있다.' },
  psybeam:     { name: '사이코빔',       type: 'PSYCHIC', cat: 'spec', power: 65, acc: 100, pp: 20,
                 effect: { volatile: 'confuse', chance: 0.1 },
                 desc: '기묘한 빛을 쏜다. 상대를 혼란시킬 때가 있다.' },
  agility:     { name: '고속이동',       type: 'PSYCHIC', cat: 'status', power: 0, acc: true, pp: 30,
                 effect: { stat: 'spe', stages: 2, target: 'self', chance: 1 },
                 desc: '몸의 힘을 빼 스피드를 크게 올린다.' },

  // --- GHOST ---
  astonish:    { name: '놀래키기',       type: 'GHOST', cat: 'phys', power: 30, acc: 100, pp: 15,
                 effect: { volatile: 'flinch', chance: 0.3 },
                 desc: '갑자기 모습을 드러내 상대를 놀라게 한다.' },
  shadowsneak: { name: '야습',           type: 'GHOST', cat: 'phys', power: 40, acc: 100, pp: 30, prio: 1,
                 desc: '그림자에서 튀어나와 재빠르게 먼저 공격한다.' },
  shadowball:  { name: '섀도볼',         type: 'GHOST', cat: 'phys', power: 80, acc: 100, pp: 15,
                 effect: { stat: 'spd', stages: -1, target: 'foe', chance: 0.2 },
                 desc: '검은 그림자 덩어리를 던진다. 특수방어를 떨어뜨릴 때가 있다.' },

  // --- DARK (special in Gen 3) ---
  bite:        { name: '물기',           type: 'DARK', cat: 'spec', power: 60, acc: 100, pp: 25,
                 effect: { volatile: 'flinch', chance: 0.3 },
                 desc: '사나운 이빨로 문다. 상대를 풀이 죽게 할 때가 있다.' },
  pursuit:     { name: '따라가때리기',   type: 'DARK', cat: 'spec', power: 40, acc: 100, pp: 20,
                 desc: '그림자 속에서 갑자기 공격한다.' },

  // --- DRAGON ---
  twister:     { name: '회오리',         type: 'DRAGON', cat: 'spec', power: 40, acc: 100, pp: 20,
                 effect: { volatile: 'flinch', chance: 0.2 },
                 desc: '거센 회오리를 일으킨다. 상대를 풀이 죽게 할 때가 있다.' },
  dragonbreath:{ name: '용의숨결',       type: 'DRAGON', cat: 'spec', power: 60, acc: 100, pp: 20,
                 effect: { status: 'PAR', chance: 0.3 },
                 desc: '강한 숨결을 내뿜는다. 상대를 마비시킬 때가 있다.' },

  // --- FAIRY ---
  fairywind:   { name: '요정의바람',     type: 'FAIRY', cat: 'spec', power: 40, acc: 100, pp: 30,
                 desc: '요정의 바람을 일으켜 공격한다.' },
  sweetkiss:   { name: '천사의키스',     type: 'FAIRY', cat: 'status', power: 0, acc: 75, pp: 10,
                 effect: { volatile: 'confuse', chance: 1 },
                 desc: '귀여운 몸짓으로 상대를 혼란시킨다.' },
  drainingkiss:{ name: '드레인키스',     type: 'FAIRY', cat: 'spec', power: 50, acc: 100, pp: 10, drain: 0.75,
                 desc: '상대의 기운을 빼앗아 준 피해의 일부를 크게 회복한다.' },

  // --- NORMAL multi-hit ---
  furyattack:  { name: '마구찌르기',     type: 'NORMAL', cat: 'phys', power: 15, acc: 85, pp: 20, multi: [2, 5],
                 desc: '상대를 2~5회 연속 찌른다.' },
};

// Status condition display data
const STATUS_INFO = {
  PSN: { name: '독', text: '중독' },
  BRN: { name: '화상', text: '화상' },
  PAR: { name: '마비', text: '마비' },
  SLP: { name: '잠듦', text: '잠듦' },
  FRZ: { name: '얼음', text: '얼어붙음' },
};
