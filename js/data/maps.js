// ===== Map data =====
// Tile legend:
//   . grass   , meadow : dirt path  = cobble road  q sand   v bridge
//   t tall grass (encounters)   T tree   A shrub   C cliff   W water
//   F flowers f fence   r roof   w wall   D door(warp)   s sign
//   _ floor   k counter m exit mat(warp)  b bookshelf  O boulder
//   l floor valve (walkable)   j closed water gate (opened by a gym valve)
//   e circuit breaker (walkable)   z electric barrier (opened by a breaker)
//   B bed     h stairs(warp)   V TV   p plant   d desk   s sofa
//   K kitchen counter   J lab console   Y complete bicycle rack
//   R center roof   M mart roof   c center emblem   g mart emblem   P storage PC
//   H healing machine   G goods shelf   n bench
//   1 2 3 starter ball pedestals   x void
// Solid: T A C W f r w s j z k b O B R M c g H G P n 1 2 3 V p d x  (D, m, h, v, l, e are walkable)
const SOLID_TILES = new Set(['T', 'A', 'C', 'W', 'f', 'r', 'w', 's', 'j', 'z', 'k', 'K', 'J', 'Y', 'b', 'O', 'B',
  'R', 'M', 'c', 'g', 'H', 'G', 'P', 'n', '1', '2', '3', 'V', 'p', 'd', 'x']);

// Each physical laboratory pedestal owns one candidate. Keeping this beside
// the map data lets validation prove that the room and interaction agree.
const STARTER_STATIONS = Object.freeze({
  '1': 'bulbasaur',
  '2': 'charmander',
  '3': 'squirtle',
});
const NPC_FIXED_SPECIALS = new Set([
  'nurse', 'shop', 'prof', 'parent', 'townstory', 'ecology', 'story', 'sidequest',
]);

// Tall supplied furniture occupies more than its anchor cell. Keep its
// visible footprint solid as well, otherwise the player can walk through the
// middle of a bed, bookcase, or sofa even though the anchor tile is blocked.
const INTERIOR_FURNITURE_FOOTPRINTS = {
  B: [0, 0, 2, 2],   // 2x2 bed group, anchored at its top-left tile
  h: [-2, -1, 3, 2], // wall staircase; lower-right anchor is the warp approach
  b: [0, 0, 2, 3],   // 2x3 bookshelf group, anchored at its top-left tile
  G: [0, 0, 3, 2],   // 3x2 mart goods shelf
  H: [0, 0, 4, 2],   // complete 4x2 healing station (placeholder row excluded)
  P: [0, -1, 1, 2],  // two-tile-tall PC, anchored on its lower interaction cell
  k: [-2, 0, 5, 1],  // five-tile checkout, centred on its interaction cell
  K: [0, 0, 4, 2],   // complete sink-and-prep counter group
  J: [0, 0, 2, 2],   // 2x2 laboratory console
  Y: [0, 0, 4, 2],   // complete four-bike rack from the supplied shop sheet
  V: [0, 0, 2, 1],   // 2x1 television and tower group
  p: [0, 0, 1, 2],   // complete plant, leaves and pot
  d: [0, 0, 3, 2],   // three-tile-wide writing desk
  n: [0, 0, 3, 2],   // complete blue sofa, including its backrest
  s: [0, 0, 3, 2],   // complete brown sofa, including its backrest
  m: [-1, -1, 2, 2], // complete two-wide threshold mat centred on the warp
  D: [-1, -1, 2, 2],
  1: [0, -1, 1, 2],  // complete ball pedestal, lower cell is interactable
  2: [0, -1, 1, 2],
  3: [0, -1, 1, 2],
};

// Outdoor tree art is two tiles tall: T is its trunk/base and the tile right
// above is its canopy. Treat both cells as occupied so actors cannot walk
// through the visible tree or be placed inside its art.
function mapTileIsSolid(m, x, y) {
  const ch = m.rows[y]?.[x];
  if (ch === undefined || SOLID_TILES.has(ch)) return true;
  if (m.furniture) {
    for (const furniture of m.furniture) {
      const [ox, oy, width, height] = INTERIOR_FURNITURE_FOOTPRINTS[furniture.ch] || [];
      if (ox === undefined) continue;
      if (x >= furniture.x + ox && x < furniture.x + ox + width &&
          y >= furniture.y + oy && y < furniture.y + oy + height) {
        // Threshold mats are floor markings and remain walkable across their
        // whole image, not just on the cell carrying the warp symbol.
        if (furniture.ch === 'm' || furniture.ch === 'D') continue;
        // A staircase is also a warp. Its anchor remains walkable so the
        // player can use it; only the artwork around it is reserved.
        if (ch === 'h' || ch === 'D' || ch === 'm') continue;
        return true;
      }
    }
  }
  return !!(m.outdoor && m.rows[y + 1]?.[x] === 'T');
}

// All names and dialogue below are original.
const MAPS = {
  // ------------------------------------------------ Player's bedroom (upstairs)
  bedroom: {
    bgm: 'home',
    name: '내 방',
    rows: [
      'wwwwwwwwww',
      'wBB___h__w',
      'w________w',
      'w_b______w',
      'w________w',
      'w________w',
      'wwwwwwwwww',
    ],
    warps: { '8,1': { map: 'house', x: 8, y: 2, facing: 'down' } },
    signs: {},
    npcs: [],
  },

  // ------------------------------------------------ Player's house (downstairs)
  house: {
    bgm: 'home',
    name: '우리 집',
    rows: [
      'wwwwwwwwww',
      'w_______hw',
      'w________w',
      'w_kk_____w',
      'w________w',
      'w________w',
      'w___m____w',
      'wwwwwwwwww',
    ],
    warps: {
      '8,1': { map: 'bedroom', x: 8, y: 2, facing: 'down' },
      '4,6': { map: 'hometown', x: 7, y: 32, facing: 'down' },
    },
    signs: {},
    npcs: [
      // Keep the opening guide directly below the stairs and use an explicit
      // adult-woman sheet. Role-based randomization previously made Mom look
      // like an unrelated elderly villager, which read as if she had vanished.
      { id: 'mom', x: 8, y: 4, kind: 'parent', visual: 'parent', facing: 'up', special: 'parent', wander: false },
    ],
  },

  // ------------------------------------------------ WILLOWBROOK (start town)
  // Buildings are ~7 tiles tall as drawn, so each footprint keeps 4 clear
  // rows above it (made solid at runtime while the building image covers them).
  hometown: {
    bgm: 'town',
    name: '윌로우브룩',
    outdoor: true,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTT::::TTTTTTTTTTTTTTTTTTTTTTT',
      'TTTTTT,,,,,,,,,,,,,,,,,::::,,,,,,,,,,,,,,,,,TTTTTT',
      'TTTTTT,TT,,,,,,,,,,,,,,::::,,,,,,,,,,,,,,TT,TTTTTT',
      'TTTTTT,,T,,,,,,,,,,,,,,::::,,,,ffffffffffff,TTTTTT',
      'TTTTTT,,,,,,,,,,,,,,,,,::::,,,,fFfFffFfFfFf,TTTTTT',
      'T,,F,F,,,,,,F,,,,,,,,,,::::,,,,ffff,,ffffff,,,,,,T',
      'T,,,,,,,,,,,,,F,,,,,,,,::::,,,,,,F,,,,,,,,,F,,,,,T',
      'T,T,T,rrrrr,T,,,,,,,,,,::::,,,,,,,,,rrrrr,,,,,,T,T',
      'T,T,T,rrrrr,,T,,,,,,,,,::::,,,,,,,,,rrrrr,,,,,,T,T',
      'T,,,,,wwwww,,,,F,,,,,,,::::,::::::::wwwww,,,,,,,,T',
      'T,,,,,,,:::::::::::::::::::,:::::::::::::,s,,,,,,T',
      'T,,s,,,,:::::::::::::::=====::::::F::::::,,,F,,,,T',
      'T,,,,T,,:::::T:::::::::======,,,,,,,,,:::,,,,,,,,T',
      'T,,,,,,,:::,,,,,,,,============,,,,,,,:::,,T,T,,,T',
      'T,q,qqqqqqqqqqq,,================,F,F,:F:,,,,,T,,T',
      'T,qqqWWWWWWWWqq,,==FF==WWWW==FF==,,,,,:::,,,,,,F,T',
      'T,qqWWWWWWWWWWq,,s=====FWWW======,,T,,,,,,,,,,,,,T',
      'T,qWWWWWWWWWWWq,,======WWWF=====s,,,,T,,,,rrrrr,,T',
      'T,qWWWWWWWWWWWW,,==FF==WWWW==FF==,,,,,,:::rrrrr,,T',
      'T,qvvvvvvvvvvvv,,================,,,,,,:::wwDww,,T',
      'T,qqWWWWWWWWWWW,,,,============,,,,F,,,::::::,,s,T',
      'T,qqWWWWWWWWWWq,,,,,,========,,,,,,,,,,::::::,,,,T',
      'T,qqqWWWWWWWWqq::::::::::=:::::::::::::::::::,T,,T',
      'T,qqqqWWWWWWqq,:::::::::::::::::::::::::::,,,,,,,T',
      'T,qqqqqqqqqqqqq:::::::::::::::::::::::::::,,T,,,,T',
      'T,,,,,F,:::ffffffffff,F::::,,:::,,,,,,,:::,,,,,,,T',
      'T,,,F,,,:::ffFfFfFfFf,,::::,,:::,,,,,,,::fffffff,T',
      'T,T,,,,,:::ff,,,,,:::,,::::F,::F,,,,,,,::fF,,,,f,T',
      'T,,T,,,,:::fF,rrrrr::,,::::,,:::,,,,,,,::f,F,FTf,T',
      'T,,,,rrrrr:ff,rrrrr::,,::::,F:::,rrrrr,::f,,,,,f,T',
      'T,,,,rrrrr:fF,wwwww:s,,::::,,:::,rrrrr,::f,F,F,f,T',
      'T,,,,wwDww:ff,,,:::,,,,::::,,:::,wwDwws::f,,,,,f,T',
      'T,,s,,,::::::T::::::::::::::::::::::::::,f,F,F,f,T',
      'T,,,,,,:::::::::::::::::::::::::::::::::,:,,,,,f,T',
      'T,,T,,,:::::::::::::::::::::::::::::::::Ff,,,TFfTT',
      'TTTTTT,,,,,,,,,T,,,,,,,::::,,,,,,,,,,,,,,fff::ffTT',
      'TTTTT,,T,,T,,,,,,,,,T,,::::,T,,,,,,,,,,T,,,,,TTTTT',
      'TTTTT,,,,,,,T,,,,,,,,,T::::,,,,,,,,,,,,,,,T,,TTTTT',
      'TTTTT,,,,,,,,,,,,,,,,,,::::,,,,,,,,,,,,,,,,,,TTTTT',
      'TTTTTTTTTTTTTTTTTTTTTTT::::TTTTTTTTTTTTTTTTTTTTTTT',
    ],
    links: { up: 'route1' },
    warps: {
      '7,31':  { map: 'house',    x: 4, y: 5, facing: 'up' },
      '44,19': { map: 'rexhouse', x: 5, y: 4, facing: 'up' },
      '35,31': { map: 'lab',      x: 5, y: 6, facing: 'up' },
    },
    signs: {
      '3,11':  '버들물 목공소\n연못 다리와 마을 울타리를 관리합니다.',
      '42,10': '윌로우브룩 회관\n여러 지방에서 온 여행자의 기록을 보관합니다.',
      '17,16': '물빛광장\n연못과 네 개 생활 구역이 만나는 마을의 중심.',
      '32,17': '동쪽: 렉스의 집\n남쪽: 메이플 연구소와 관찰 과수원',
      '47,20': "렉스의 집\n현관 매트에 '미래의 챔피언 거주 중'이라고 적혀 있다.",
      '3,32':  '우리 집\n엄마가 창문으로 가방을 확인하고 있다.',
      '20,30': '공동 꽃밭\n꽃은 꺾지 말고 눈으로만 잡아 주세요.',
      '38,31': "메이플 포켓몬 연구소\n\"현장 연구원 상시 모집 — 본인 동의는 선택 사항\"",
    },
    npcs: [
      { id: 'hv1', x: 20, y: 17, kind: 'villager', facing: 'down',
        dialog: [
          '윌로우브룩이 작은 시골 마을인 줄 알았지? 걸어 보면 생각이 바뀔 거야. 내 무릎은 이미 바뀌었고.',
          '첫 풀숲부터 여러 지방 포켓몬이 섞여 나와. 아는 실루엣이라고 자신 있게 외쳤다가 틀리면 꽤 민망하지.',
          '메이플 박사님은 그 공존을 조사 중이야. 남쪽 연구소에 가 봐. 신입은 늘 발로 뛰는 법이거든.',
        ] },
      { id: 'hv2', x: 10, y: 19, kind: 'villager2', facing: 'right',
        dialog: [
          '허리가 쑤셔서 배틀은 못 하지만 훈수는 가능하지. 훈수에는 체력이 안 들거든.',
          '물은 불꽃에 강하고, 불꽃은 풀에 강하고, 풀은 물에 강해. 여기까진 쉽지? 문제는 실전에서 꼭 반대로 누른다는 거야.',
          '중독과 마비도 얕보지 말게. 상대 체력은 줄고 포획은 쉬워져. 내 허리 상태 이상은 아직 치료법이 없지만.',
        ] },
      { id: 'hv3', x: 30, y: 10, kind: 'villager', facing: 'left',
        dialog: [
          '어제 남쪽 화물열차에서 파라꼬와 화살꼬빈이 동시에 날아올랐어. 둘 다 자기가 주인공인 표정이더라.',
          '여기서는 몇 세대 출신인지보다 팀에서 밥값을 하는지가 더 중요해. 냉정하지만 파티가 여섯 자리잖아.',
          '북쪽 새싹숲에 회색 외투를 입은 수상한 녀석들이 돌아다닌대. 더운 날에도 외투면 거의 자백이지.',
        ] },
      { id: 'willow_kid', x: 28, y: 20, kind: 'scout', facing: 'right',
        dialog: [
          '광장 한 바퀴, 연못 한 바퀴, 과수원 한 바퀴! 걸어서도 세 번 길을 헷갈렸지만 코스 탓은 아니야.',
          '북쪽 큰길만 달리면 마을 절반을 놓쳐. 넓게 만들었는데 안 보면 꾸민 사람이 운다고!',
        ] },
      { id: 'willow_gardener', x: 44, y: 33, kind: 'villager2', facing: 'left',
        dialog: [
          '이 과수원 꽃은 여러 지방에서 가져온 씨앗으로 피웠단다. 검역 서류만 내 키만큼 쌓였지.',
          '울타리 서쪽 작은 문으로 들어오렴. 나무를 뚫고 들어오려는 트레이너가 꼭 한 명씩 있더구나.',
        ] },
      { id: 'willow_fisher', x: 4, y: 19, kind: 'hiker', facing: 'right',
        dialog: [
          '연못 한가운데 다리는 목공소에서 놓았어. 물 위를 걷는 기분은 나지만 실제로 젖지는 않지.',
          '낚시 성과를 묻는다면 풍경을 낚았다고 해 두자. 물고기는 그 말을 별로 안 좋아하더라.',
        ] },
      { id: 'willow_aide', x: 31, y: 33, kind: 'picnic', facing: 'right',
        dialog: [
          '메이플 박사님 연구소는 남동쪽 빨간 지붕이야. 주변 과수원까지 전부 관찰 구역이고.',
          '나는 현장 연구원인데 오늘 현장은 연구소 문 앞이야. 서류도 엄연한 야외 활동이거든.',
        ] },
      { id: 'willow_runner', x: 24, y: 6, kind: 'scout', facing: 'down',
        dialog: [
          '북문에서 광장까지 달리고, 연못을 돌아서 남쪽 주택가까지! 이게 윌로우브룩 한 바퀴야.',
          '예전보다 길어졌냐고? 응. 그래서 내가 아직도 한 바퀴째인 거야.',
        ] },
    ],
  },

  // ------------------------------------------------ Rex's house
  rexhouse: {
    bgm: 'home',
    name: '렉스의 집',
    rows: [
      'wwwwwwwwww',
      'w_b____b_w',
      'w________w',
      'w_kk_____w',
      'w________w',
      'w____m___w',
      'wwwwwwwwww',
    ],
    warps: { '5,5': { map: 'hometown', x: 44, y: 20, facing: 'down' } },
    signs: {},
    npcs: [
      { id: 'aunt', x: 4, y: 2, kind: 'villager2', facing: 'down',
        dialog: [
          '어머, 렉스를 찾니? 해 뜨자마자 연구소로 뛰어갔단다. 평소엔 아침밥 앞에서도 안 뛰는 애가.',
          '계속 "가장 강한 녀석은 내 거야"라고 외치더라. 아직 아무것도 안 골랐는데 우승 소감부터 준비했지 뭐니.',
          '속은 착한 아이야. 아주 깊이, 정말 발굴 작업이 필요할 만큼 깊이 들어가면 말이지.',
        ] },
    ],
  },

  // ------------------------------------------------ Maple's lab
  lab: {
    bgm: 'lab',
    name: '메이플 연구소',
    rows: [
      'wwwwwwwwwwww',
      'wbb______bbw',
      'w__________w',
      'w__________w',
      'w___123____w',
      'w__________w',
      'w__________w',
      'w____m_____w',
      'wwwwwwwwwwww',
    ],
    warps: { '5,7': { map: 'hometown', x: 35, y: 32, facing: 'down' } },
    signs: {},
    npcs: [
      { id: 'prof', x: 5, y: 2, kind: 'prof', facing: 'down', special: 'prof' },
      { id: 'rex', x: 8, y: 3, kind: 'rival', facing: 'down', hiddenIf: 'rex_gone',
        dialog: [
          '렉스: 이제 왔냐? 네가 일어나는 동안 난 우승 인터뷰까지 다 짜 놨어.',
          '렉스: 박사님이 기다리래서 기다린 거야. 빨리 골라. 난 네 선택을 보고 완벽한 카운터를 고를 테니까. 이걸 전략이라고 하지.',
        ] },
    ],
  },

  // ------------------------------------------------ FERNWAY TRAIL (route)
  route1: {
    bgm: 'route1',
    name: '펀웨이 트레일',
    outdoor: true,
    battleBg: 'field',
    rows: [
      'TTTTTTTTTTT::TTTTTTTTTTT',
      'T,,,,,,,,,,::,,,,,,,,,,T',
      'T,,,,,,,,,,::,,,,,,,,,,T',
      'T,,F,,,,,,,::,,,,,,,F,,T',
      'T,,,,::::::::::::::,,,,T',
      'T,,,,::,,,,,,,,,,::,,,,T',
      'T,ttt::,,,,,,,,,,::ttt,T',
      'T,ttt::,,,,,,,,,,::ttt,T',
      'T,ttt::,fff::ff,,::ttt,T',
      'T,ttt::,,,,,,,,,,::ttt,T',
      'T,,,,::,,,,,,,,,,::ttt,T',
      'T,s,,::,,,T,,,,,,::,,,,T',
      'T,,T,::,,,,,,,,,,::,,,,T',
      'TWWWWvvWWWWWWWWWWvvWWWWT',
      'TWWWWvvWWWWWWWWWWvvWWWWT',
      'TWWWWvvWWWWWWWWWWvvWWWWT',
      'T,,,,::,,,,,,,,,,::,,,,T',
      'T,,,,::::::::::::::,,,,T',
      'T,tttt,::,,,,,,,,,,,T,,T',
      'T,tttt,::,,,,T,,,,,,,,,T',
      'T,tttt,::AA,,AAA,ttttt,T',
      'T,tttt,::,,,,,,,,ttttt,T',
      'T,,,,,,::,,,,,,,,ttttt,T',
      'T,,,,,,::::::,,,,ttttt,T',
      'T,,,,,,,,,,::,,,,ttttt,T',
      'T,,,,,,,,,,::,,,,,,,,,,T',
      'T,,T,,,,,s,::,,,,,,,T,,T',
      'T,,,,,,,,,,::,,,,,,,,,,T',
      'T,,,,,,,,,,::,,,,,,,,,,T',
      'TTTTTTTTTTT::TTTTTTTTTTT',
    ],
    links: { up: 'sproutwood', down: 'hometown' },
    warps: {},
    signs: {
      '2,11': '펀웨이 트레일\n두 개의 다리는 서로 다른 풀숲으로 이어지는 바람길.',
      '9,26': '북쪽: 새싹숲\n강을 건넌 뒤 갈라진 길은 숲 어귀에서 다시 만난다.',
    },
    encounters: {
      rate: 0.14,
      levels: [3, 5],
      table: [
        ['pidgey', 12], ['rattata', 10], ['caterpie', 7], ['weedle', 7],
        ['spearow', 4], ['sentret', 10], ['zigzagoon', 10], ['starly', 10],
        ['lillipup', 10], ['fletchling', 8], ['grubbin', 7],
        ['rookidee', 8], ['pawmi', 7], ['oddish', 6],
        ['mareep', 5], ['rockruff', 4], ['squirtle', 1],
        ['wooper', 7], ['shinx', 6], ['swablu', 5],
        ['fidough', 6], ['rowlet', 1],
      ],
    },
    npcs: [
      { id: 'cal', x: 5, y: 9, kind: 'scout', facing: 'right',
        trainer: {
          flag: 'tr_cal', name: '정찰병 칼', range: 3,
          party: [['lillipup', 4]], prize: 100,
          intro: ['눈 마주쳤지? 못 본 척하기엔 이미 느낌표가 떴다!',
                  '펀웨이식 인사는 배틀이야. 사회성이 조금 과격하지!'],
          loseText: '잠깐, 내 느낌표가 패배 플래그였어?',
          after: ['제법인데. 압박받아도 기술을 막 누르진 않는군.',
                  '보답으로 스캐너를 줄게. 비싼 거니까 풀숲에 흘리고 다니진 마.'],
        } },
      { id: 'mira', x: 18, y: 16, kind: 'picnic', facing: 'left',
        trainer: {
          flag: 'tr_mira', name: '피크닉걸 미라', range: 3,
          party: [['fletchling', 3], ['oddish', 3]], prize: 80,
          intro: ['쉿! 풀숲에서 쉬는 친구들을 밟을 뻔했잖아! 방금 밟은 건 내 샌드위치고!',
                  '샌드위치의 원한까지 담아서 승부하자!'],
          loseText: '포켓몬도 지고 점심도 졌어!',
          after: ['화살꼬빈은 빠르고 턱지충이는 턱 힘이 세. 출신보다 팀에서 맡을 역할을 먼저 봐.',
                  '그리고 풀숲에 음식 두지 마. 오늘의 가장 중요한 공략이야.'],
        } },
      { id: 'route_chronicler', x: 15, y: 23, kind: 'villager2', facing: 'left',
        dialog: [
          '이 길의 풀씨는 여행자들의 발끝에 붙어 여러 지방에서 왔다고 해.',
          '그래서 오래전 알려진 포켓몬과 최근 발견된 포켓몬이 같은 물가에서 밥그릇 싸움을 하지.',
          '누가 몇 세대인지는 중요하지 않아. 야생에서 만나면 다 똑같이 몬스터볼을 깨고 나오거든.',
        ] },
    ],
  },

  // ------------------------------------------------ SPROUTWOOD (pre-gym forest)
  sproutwood: {
    bgm: 'forest',
    name: '새싹숲',
    outdoor: true,
    tileset: 'forest',
    battleBg: 'forest',
    rows: [
      'TTTTTTTTTTT::TTTTTTTTTTT',
      'T,,,,,,,,,,::,,,,,,,,,,T',
      'T,tttt,,,,,::,,,,,tttt,T',
      'T,tttt,,,,,::,,,,,tttt,T',
      'T,tttt,,,,,::,T,,,tttt,T',
      'T,AAAAAAA,,::,,AAAAAAA,T',
      'T,,,,,,A,,,::,,,,,,,s,,T',
      'T,,T,,,A,,,::,,,,,,,T,,T',
      'T,,,,AAAAAA::AAAA,,,,,,T',
      'T,,,,,,A,,,::,,,,,,,,,,T',
      'T,,T,,,A,:::::::::::,,,T',
      'T,,,,,,A,::,,,,,,,::,,,T',
      'T,AAAAAA,::,,,AAAA::AA,T',
      'T,tttt,,,::,,,,A,s::T,,T',
      'T,tttt,,,::,T,,A,,:ttt,T',
      'T,tttt,,,::,,,,A,,:ttt,T',
      'T,ttttAAA::AAAAAAA:ttt,T',
      'T,,,,,,,,::,,,,A,,:ttt,T',
      'T,,,:::::::,,,,A,,:ttt,T',
      'T,,,::,:,,,,,,,A,,::,,,T',
      'T,AA::A:AAAA,,,AAA::AA,T',
      'T,,,::,:,,,,,T,,,,::A,,T',
      'T,,,::,:,,,,,,,,,,::A,,T',
      'T,,,::::::::::::::::A,,T',
      'T,,,::,:ttttt,,,:,::A,,T',
      'T,,,::A:AAAAAAAA:A::A,,T',
      'T,,,::,:tTttt,,,:,::A,,T',
      'T,,,::,:ttttt,,,:,::A,,T',
      'T,,,::::::::::::::::A,,T',
      'T,AAAAAA,,,::,,,,,,,,,,T',
      'T,,Ts,,,,,,::,,,,,,,,T,T',
      'T,,,,,,,,,,::,,,,,,,,,,T',
      'T,,,,,,,,,,::,,,,,,,,,,T',
      'TTTTTTTTTTT::TTTTTTTTTTT',
    ],
    links: { up: 'stonegate', down: 'route1' },
    warps: {},
    signs: {
      '4,30': '새싹숲\n큰길은 빠르고, 고리 모양 샛길은 더 많은 이야기를 품고 있다.',
      '17,13': '동쪽 관찰로\n관목 사이의 길은 북쪽 큰길과 다시 이어집니다.',
    },
    puzzle: {
      sequence: {
        stateFlag: 'sprout_chime_progress', solvedFlag: 'sprout_chime_solved',
        order: ['root', 'sun', 'brook'],
        nodes: {
          '4,30': { id: 'root', label: '뿌리 바람종', tone: '둥' },
          '20,6': { id: 'sun', label: '햇살 바람종', tone: '딩' },
          '17,13': { id: 'brook', label: '물결 바람종', tone: '랑' },
        },
        solvedText: '세 바람종의 울림이 하나로 이어졌다! 숲 가장자리의 새들이 같은 박자로 화답한다.',
        resetText: '울림의 순서가 어긋나 처음 음으로 돌아갔다. 바람 탓이라고 하기엔 손이 너무 가까웠다.',
      },
    },
    encounters: {
      rate: 0.16,
      levels: [4, 8],
      table: [
        ['caterpie', 15], ['weedle', 15], ['grubbin', 15],
        ['metapod', 8], ['kakuna', 8], ['pidgey', 5], ['sentret', 6],
        ['zigzagoon', 3], ['starly', 3], ['lillipup', 3],
        ['fletchling', 7], ['rookidee', 7], ['pawmi', 6],
        ['pikachu', 4], ['oddish', 10], ['mareep', 4],
        ['ralts', 2], ['bulbasaur', 2],
        ['rowlet', 5], ['fidough', 5], ['shinx', 4],
        ['swablu', 4], ['goomy', 1],
      ],
    },
    npcs: [
      { id: 'tami', x: 11, y: 9, kind: 'picnic', facing: 'right',
        trainer: {
          flag: 'tr_tami', name: '곤충채집가 타미', range: 3,
          party: [['caterpie', 5], ['grubbin', 5]], prize: 140,
          intro: ['벌레 포켓몬을 작다고 무시했지? 괜찮아, 다들 쓰러지고 나서 존중하더라!',
                  '두 번 싸우면 힌트도 열려. 그전에 네 포켓몬이 눕지만 않으면 말이야!'],
          loseText: '내 관찰 노트에 방금 크게 "오답"이라고 적혔어!',
          after: ['벌레 포켓몬은 빨리 진화해서 초반 여행에 큰 도움이 돼.',
                  '노란 불빛이 보이면 조용히 다가가. 소리 지르면 희귀 포켓몬보다 내가 먼저 놀라.'],
        } },
      { id: 'ian', x: 9, y: 17, kind: 'scout', facing: 'left',
        trainer: {
          flag: 'tr_ian', name: '숲길소년 이안', range: 3,
          party: [['starly', 6], ['rookidee', 6]], prize: 180,
          intro: ['큰길만 따라왔어? 그러면 내 완벽한 매복 위치를 왜 바로 찾은 거지?',
                  '계획엔 없었지만 일단 배틀이다!'],
          loseText: '길도 잃고 배틀도 잃었네. 오늘 알차다!',
          after: ['북쪽 출구가 스톤게이트야. 체육관 전에 센터부터 들러.',
                  '방어가 단단하면 격투 기술이나 방어를 낮추는 기술을 써. 정면 박치기는 공략이 아니야.'],
        } },
      { id: 'sprout_guide', x: 14, y: 31, kind: 'villager2', facing: 'left', special: 'sidequest',
        quest: {
          id: 'sprout_chimes', title: '바람이 외운 세 음', giver: '숲 해설가 모리',
          intro: [
            '숲 해설가 모리: 새싹숲의 표지판 셋은 사실 오래된 바람종이란다. 안내문만 읽고 지나가서 다들 모르지만.',
            '남쪽의 「뿌리」, 북동쪽의 「햇살」, 동쪽의 「물결」 순서로 앞에서 조사해 보렴. 둥, 딩, 랑. 외우기 쉽게 내가 방금 지었다.',
            '순서를 틀리면 처음부터 다시 울리면 돼. 숲은 화를 안 내지만 나는 설명을 다시 해야 해서 조금 운다.',
          ],
          progress: ['숲 해설가 모리: 뿌리, 햇살, 물결 순서야. 표지 앞에서 조사 버튼을 눌러. 바람만 기다리면 엔딩까지 안 울릴걸.'],
          complete: [
            '숲 해설가 모리: 세 울림이 이어졌구나! 새들이 박자를 맞춘 걸 보니 내 임기응변이 전통이 되어 버렸어.',
            '숲을 꼼꼼히 돌아본 보상으로 포획 도구와 스캐너를 줄게. 관찰은 발품과 가방 칸을 먹고 자라거든.',
          ],
          after: ['숲 해설가 모리: 바람종은 계속 울릴 수 있지만 보상은 한 번이야. 전통에도 예산은 있단다.'],
          requirement: { type: 'flags', flags: ['sprout_chime_solved'] },
          reward: { items: { pokeball: 5, scanner: 1 } },
          rewardText: '몬스터볼 5개와 스캐너 1개를 받았다!',
        } },
      { id: 'ecology_ara', x: 7, y: 24, kind: 'picnic', facing: 'right', special: 'ecology' },
      { id: 'mist_rookie', x: 18, y: 19, kind: 'scout', facing: 'left',
        trainer: {
          flag: 'tr_mist_rookie', name: '흰안개단 견습 루프', range: 2,
          party: [['zigzagoon', 7], ['pawmi', 7]], prize: 220,
          intro: ['거기서 멈춰! 이 관측 기록은 우리 흰안개단이 먼저... 빌린 거야. 영구적으로.',
                  '희귀 포켓몬을 먼저 알아내면 부자가... 아니, 숲의 흐름을 지킬 수 있지!'],
          loseText: '잠깐, 악당 첫 등장 보정 같은 건 없어?',
          after: ['알았어, 기록 장치는 돌려줄게. 반납 기한을 조금 넘겼을 뿐이야.',
                  '북쪽 관측소엔 다른 대원이 있을걸. 다음엔 안개도 깔고 더 그럴듯하게 등장하겠어.'],
        } },
    ],
  },

  // ------------------------------------------------ STONEGATE (gym town)
  stonegate: {
    bgm: 'city',
    name: '스톤게이트',
    outdoor: true,
    battleBg: 'rocky',
    rows: [
      'CCCCCCCCCCCCCCCCCCCC==CCCCCCCCCCCCCCCCCCCC',
      'Cqqqqqqqqqqqqqqqqqqq==qqqqqqqqqqqqqqqqqqqC',
      'Cqqqqqqqqqqqqqqqqqqq==qqqqqqqqqqqqqqqqqqqC',
      'CqqCCCCCCCCCqqqqqqqq==qqqqqqqqCCCCCCCCCqqC',
      'CqqCCCCCCCCCqqqqqqqq==qqqqqqqqCCCCCCCCCqqC',
      'CqqqqqqqqqqqqqFqqqqq==qqqqqFqqqqqqqqqqqqqC',
      'Cqqqrrrrrrrqqqqqqqqq==qqqqqqqqqrrrrrqqqqqC',
      'Cqqqrrrrrrrqqqqqqqqq==qqqqqqqqqrrrrrqqqqqC',
      'CqqqwwwDwwwqsqqqqqqq==qqqqqqqqqwwwwwqqsqqC',
      'Cqqqqqq=qqqqqqqqqqqq==qqqqqqqqqqq=qqqqqqqC',
      'Cqq====================================qqC',
      'Cqq====================================qqC',
      'Cqqqqqqqqqqqqqqqqqqq==qqqqqqqqqqqqqqqqqqqC',
      'CqqOqqqqqqqq==================qqqqqqqqOqqC',
      'Cqqqqqqqqqqq==================qqqqqqqqqqqC',
      'CqqqqqqqqOqq=======WvvW=======qqOqqqqqqqqC',
      'Cqqqqqqqqqqq=======WvvW=======qqqqqqqqqqqC',
      'Cqqqqqqqqqqq=======WvvW=======qqqqqqqqqqqC',
      'Cqqqqqqqqqqq==================qqqqqqqqqqqC',
      'CqqqRRRRRqqq==================qqqMMMMMqqqC',
      'CqqqRRRRRqqq==================qqqMMMMMqqqC',
      'CqqqwcDwwqqqqqqqqqqq==qqqqqqqqqqqwDgwwqqqC',
      'Cqsqqq=qqqqqqqqqqqqq==qqqqqqqqqqqq=qqqqsqC',
      'Cqq====================================qqC',
      'Cqq====================================qqC',
      'Cqqqqqqqqqqqqqqqqqqq==qqqqqqqqqqqqqqqqqqqC',
      'CqqqqqFqqqqsqqqqqqqq==qqqqqqqqqqqqqFqqqqqC',
      'CqCCCCCCCCqqqqqqqqqq==qqqqqqqqqqCCCCCCCCqC',
      'CqCCCCCCCCqqqqqqqqqq==qqqqqqqqqqCCCCCCCCqC',
      'Cqqqqqqqqqqqqqqqqqqq==qqqqqqqqqqqqqqqqqqqC',
      'Cqqqqqqqqqqqqqqqqqqq==qqqqqqqqqqqqqqqqqqqC',
      'CCCCCCCCCCCCCCCCCCCC==CCCCCCCCCCCCCCCCCCCC',
    ],
    links: { up: 'route2', down: 'sproutwood' },
    warps: {
      '6,21':  { map: 'healstone', x: 6, y: 5, facing: 'up' },
      '34,21': { map: 'shop1',     x: 5, y: 4, facing: 'up' },
      '7,8':   { map: 'gym',       x: 6, y: 9, facing: 'up' },
    },
    signs: {
      '12,8': '스톤게이트 체육관\n관장 메이슨, 걸어 다니는 벽.',
      '38,8': '회색바람 석공소\n광장과 고개의 돌길을 관리합니다.',
      '2,22': '포켓몬센터\n동료를 무료로 치료해 줍니다.',
      '39,22': '포켓몬마트\n트레이너에게 필요한 모든 것.',
      '11,26': '스톤게이트\n"바위 위에 세우고, 투지로 운영한다."',
    },
    npcs: [
      { id: 'cast_yuno', x: 15, y: 18, kind: 'villager2', facing: 'down', special: 'sidequest',
        quest: {
          id: 'road_recap', title: '초보 해설자의 경기 자료', giver: '해설자 윤초',
          intro: [
            '해설자 윤초: 잠깐! 나는 승률 100% 이론 방송을 하는 윤초야. 실전 횟수는 묻지 마, 이론 방송이라니까.',
            '펀웨이의 칼과 미라를 이긴 기록이 필요해. 둘 다 상대하고 돌아오면 메이슨 공략용 좋은상처약을 줄게.',
            '내가 직접 싸우면 자료가 편향되니까 안 가는 거야. 절대 무서워서가 아니고 표본 설계 문제야.',
          ],
          progress: ['해설자 윤초: 칼과 미라의 배틀 기록이 모두 필요해. 한 명만 이기면 하이라이트 길이가 안 나와.'],
          complete: [
            '해설자 윤초: 기록 확인! 네 판단은 좋았고 내 사전 예측은... 결과를 본 뒤 수정하면 정확도 100%지.',
            '메이슨은 장기전이 강하니 이 약을 챙겨. 방송 제목은 「내 조언으로 관장전 날먹」으로 올릴게.',
          ],
          after: ['해설자 윤초: 관장전에서는 공격만 보지 말고 상태 이상과 방어 저하도 써. 이건 결과 보기 전에도 맞는 말이야.'],
          requirement: { type: 'flags', flags: ['tr_cal', 'tr_mira'] },
          reward: { items: { superpotion: 3 } },
          rewardText: '좋은상처약 3개를 받았다!',
        } },
      { id: 'sv2', x: 27, y: 18, kind: 'villager', facing: 'left',
        dialog: [
          '센터 기계가 내 구구를 몇 초 만에 고쳤어. 내 허리도 올려 봤는데 간호사님이 내려오래.',
          '체육관 전에 동료를 쉬게 해. 지친 채 들어가면 울면서 나와. 구구 말고 네가.',
        ] },
      { id: 'stone_mason', x: 10, y: 24, kind: 'hiker', facing: 'right',
        dialog: [
          '광장의 돌은 전부 회색바람 고개에서 가져왔어. 돌길은 단단하지만 발밑은 잘 보고 걸어야 해.',
          '분수 양쪽 길은 모두 이어져 있어. 길을 잃었다면 맵 탓보다 방향키부터 의심해 봐.',
        ] },
      { id: 'stone_child', x: 30, y: 10, kind: 'scout', facing: 'left',
        dialog: [
          '북문부터 남문까지 달리기 시합 중이야! 아직 참가자는 나뿐이라 현재 1등이자 꼴등이지!',
        ] },
    ],
  },

  // ------------------------------------------------ Interiors (Stonegate)
  healstone: {
    bgm: 'center',
    name: '포켓몬센터',
    rows: [
      'wwwwwwwwwwww',
      'w__H_____P_w',
      'w__kkkkkk__w',
      'w__________w',
      'w_n______n_w',
      'w__________w',
      'w_____m____w',
      'wwwwwwwwwwww',
    ],
    warps: { '6,6': { map: 'stonegate', x: 6, y: 22, facing: 'down' } },
    pcs: { '9,1': true },
    signs: {},
    npcs: [
      { id: 'nurse1', x: 5, y: 1, kind: 'nurse', facing: 'down', special: 'nurse' },
    ],
  },

  shop1: {
    bgm: 'mart',
    name: '포켓몬마트',
    rows: [
      'wwwwwwwwww',
      'w___G_GG_w',
      'w_kkkk___w',
      'w________w',
      'w______G_w',
      'w____m___w',
      'wwwwwwwwww',
    ],
    warps: { '5,5': { map: 'stonegate', x: 34, y: 22, facing: 'down' } },
    signs: {},
    npcs: [
      { id: 'clerk1', x: 3, y: 1, kind: 'clerk', facing: 'down', special: 'shop' },
    ],
  },

  gym: {
    bgm: 'gym',
    name: '스톤게이트 체육관',
    battleBg: 'indoor1',
    rows: [
      'wwwwwwwwwwww',
      'w__________w',
      'w__________w',
      'w__O____O__w',
      'w__________w',
      'w____O_____w',
      'w__________w',
      'w__________w',
      'w__O____O__w',
      'w__________w',
      'w_____m____w',
      'wwwwwwwwwwww',
    ],
    warps: { '6,10': { map: 'stonegate', x: 7, y: 9, facing: 'down' } },
    signs: {},
    npcs: [
      { id: 'rocco', x: 3, y: 6, kind: 'hiker', facing: 'right',
        trainer: {
          flag: 'tr_rocco', name: '수련생 록코', range: 3,
          party: [['grubbin', 9], ['rookidee', 9]], prize: 220,
          intro: ['메이슨님은 포켓몬 이름보다 역할부터 읽으라고 하셨다.',
                  '나는 이름도 역할도 외웠고 도시락도 먹었다. 완벽하니 덤벼!'],
          loseText: '도시락 버프가 벌써 끝났다고?',
          after: ['내 방어를 깨다니 제법이네. 나는 지금 멘탈도 같이 깨졌고.',
                  '메이슨님은 버티기만 하는 분이 아니야. 맞는 건 네 쪽이 더 아플 테니 체력부터 확인해.'],
        } },
      { id: 'mason', x: 5, y: 1, kind: 'leader_mason', facing: 'down', special: 'leader',
        trainer: {
          flag: 'tr_mason', name: '관장 메이슨', range: 0, trainerVisual: 'mason',
          party: [['charjabug', 11], ['herdier', 12], ['raticate', 13]], prize: 1300,
          badge: {
            name: '화강암 배지',
            received: '메이슨에게서 화강암 배지를 받았다!',
            description: '화강암 배지는 움직이지 않는 것도 움직일 수 있다는 증거다.',
          },
          intro: ['록코를 이겼군. 나는 메이슨, 돌을 다듬는 사람이다. 도전자 멘탈도 종종 다듬지.',
                  '여긴 한 세대 지식만으로 못 버틴다. 네 판단이 단단한지, 그냥 목소리만 큰지 확인해 보마!'],
          loseText: '좋은 일격이다... 벽도 무너지고 내 체면도 무너졌군.',
          after: ['배지를 들 자격은 충분하다. 운이라고 하기엔 내가 너무 제대로 졌어.',
                  '북문을 지나 회색바람 고개로 가라. 메아리동굴과 숲 너머의 세이라가 네 멘탈을 한 번 더 흔들 거다.'],
        } },
    ],
  },

  // ------------------------------------------------ GREYWIND PASS (post-Stonegate route)
  route2: {
    bgm: 'route2',
    name: '회색바람 고개',
    outdoor: true,
    battleBg: 'rocky',
    rows: [
      'CCCCCCCCCCC::CCCCCCCCCCC',
      'Cqtttttqqqq::qqqqqqqqqqC',
      'Cqtttttqqqq::qqqqqqqqqqC',
      'Cqtttttqqqq::qqqqqqqqqqC',
      'CqqOqqqqqqq::::::::qOqqC',
      'CCCCCCCCCCCCCCCCC::CCCCC',
      'Cqqqqqqqtttttqqqq::qqqqC',
      'Cqqqqqqqtttttqqqq::qqqqC',
      'CqqqqqqqttttFqqqq::qqqqC',
      'CqOqqqqqtttttqqqq::qqqqC',
      'Cqqqq::::::::::::::qqqqC',
      'CCCCC::CCCCCCCCCCCCCCCCC',
      'Cqqqq::qqqqqqqqqqqttttqC',
      'Cqqqq::qqqqqqqqqqqttttqC',
      'Cqqqq::qqqqqqqqqqqttttqC',
      'Cqqqq::qqqqqqqqqqqttOtqC',
      'Cqqqq::::::::::::qqqqqqC',
      'CCCCCCCCCCCCCCC::CCCCCCC',
      'Cqtttttqqqqqqqq::qqqqqqC',
      'Cqtttttqqqqqqqq::qqqsqqC',
      'CqtttttqqqqqqOq::qqqqqqC',
      'Cqtttttqqqqqqqq::qqqqqqC',
      'Cqqqqqqqq::::::::qqqqqqC',
      'CCCCCCCCC::CCCCCCCCCCCCC',
      'Cqqqqqqqq::::qqttttttqqC',
      'CqqqqOqqqqq::qqttttttqqC',
      'Cqqsqqqqqqq::qqttttttqqC',
      'Cqqqqqqqqqq::qqttttttqqC',
      'Cqqqqqqqqqq::qqqqqqqqqqC',
      'CCCCCCCCCCC::CCCCCCCCCCC',
    ],
    links: { up: 'echocave', down: 'stonegate' },
    warps: {},
    signs: {
      '3,26': '회색바람 고개\n절벽의 틈을 번갈아 오르는 오래된 지그재그 산길.',
      '20,19': '북쪽: 메아리동굴\n네 개의 암벽 단을 지나면 동굴 입구가 나옵니다.',
    },
    encounters: {
      rate: 0.15,
      levels: [8, 11],
      table: [
        ['spearow', 12], ['sandshrew', 15], ['mankey', 15],
        ['rattata', 7], ['sentret', 5], ['zigzagoon', 8],
        ['pidgey', 5], ['starly', 5], ['lillipup', 8],
        ['rookidee', 8], ['pawmi', 7], ['grubbin', 3],
        ['zubat', 5], ['rockruff', 12], ['roggenrola', 10],
        ['tinkatink', 3], ['charmander', 1],
        ['houndour', 7], ['drilbur', 9], ['shinx', 5],
        ['swablu', 5], ['fidough', 4], ['wooper', 4],
      ],
    },
    npcs: [
      { id: 'oren', x: 13, y: 4, kind: 'scout', facing: 'right',
        trainer: {
          flag: 'tr_oren', name: '탐험가 오렌', range: 3,
          party: [['starly', 9], ['pawmi', 9]], prize: 260,
          intro: ['고갯길에서는 바람, 풀, 상대 움직임을 전부 읽어야 해.',
                  '나는 방금 네 표정까지 읽었다. "NPC 피해 갈까"라는 표정이었지? 실패다!'],
          loseText: '바람은 잘 읽었는데 데미지 계산을 못 읽었어!',
          after: ['좋아. 실루엣만 보고 단정하지 않고 차분하게 정보를 모으는군.',
                  '북쪽 동굴에선 날갯소리가 커지면 배틀 준비를 해. 아니면 그냥 아주 큰 날개일 수도 있고.'],
        } },
      { id: 'rex2', x: 17, y: 8, kind: 'rival', facing: 'left',
        trainer: {
          flag: 'tr_rex2', name: '라이벌 렉스', range: 3,
          rivalStarter: { level: 11 },
          party: [['fletchling', 10]], prize: 480,
          intro: ['렉스: 드디어 왔네. 배지 하나 달았다고 걷는 속도까지 챔피언이냐?',
                  '렉스: 난 네 팀을 이기는 시뮬레이션을 백 번 돌렸어. 아흔아홉 번은 이겼고 한 번은 프로그램 오류야!'],
          loseText: '렉스: 이건 백한 번째 프로그램 오류야. 내 계산은 잘못 없어!',
          after: ['렉스: 난 먼저 레이크글라스로 간다. 길을 잃는 게 아니라 숨은 아이템을 확인하는 거야.',
                  '렉스: 다음엔 실루엣만 보고 네 팀을 다 맞힐 거다. 틀리면 네 실루엣이 이상한 거고!'],
        } },
      { id: 'bori', x: 7, y: 16, kind: 'hiker', facing: 'right',
        trainer: {
          flag: 'tr_bori', name: '등산가 보리', range: 3,
          party: [['sentret', 10], ['zigzagoon', 10], ['lillipup', 11]], prize: 330,
          intro: ['이 오르막은 다리로 넘고 마지막 한 걸음은 끈기로 넘는 법이지!',
                  '잠깐만, 숨 좀 고르고... 좋아, 이제 배틀하자! 방금 건 전술적 호흡이야!'],
          loseText: '포켓몬보다 내가 먼저 지쳤군!',
          after: ['단단해지기만 하는 상대에겐 방어를 낮추거나 특수공격을 써.',
                  '계속 같은 기술을 누르는 건 끈기가 아니라 자동 재생이야.'],
        } },
      { id: 'pass_watcher', x: 14, y: 22, kind: 'villager2', facing: 'left',
        dialog: [
          '여기서부터 바위가 햇빛을 가려. 동굴에선 같은 길도 다르게 보여. 나는 같은 바위를 세 번 구경했지.',
          '포켓몬도 겉모습 대신 싸우는 방식과 상성을 기억해 둬. 길 찾기보다 그쪽이 쉬울 수도 있어.',
        ] },
    ],
  },

  // ------------------------------------------------ ECHO CAVE (between the two gyms)
  echocave: {
    bgm: 'cave',
    name: '메아리동굴',
    tileset: 'cave',
    battleBg: 'cave1',
    rows: [
      'wwwwwwwwwww__wwwwwwwwwww',
      'w______________________w',
      'w__OO__w____________w__w',
      'w______w________OO__w__w',
      'w______w____________w__w',
      'w_________O_________O__w',
      'wwww__wwwwwwwwwww__wwwww',
      'w______________________w',
      'w__w___OO_____w________w',
      'w__w__________w____O___w',
      'w__w__________w________w',
      'w__w_O________w________w',
      'w________________O_____w',
      'wwwwwwwwwwOOwwwwwwwwwwww',
      'w______________________w',
      'w_______w__________w___w',
      'w__OO___w__________w___w',
      'w_______w____OO____w___w',
      'w_______w__________w_O_w',
      'w______________________w',
      'wwwwww__wwwwwwww__wwwwww',
      'w______________________w',
      'w___w____OO___w________w',
      'w___w_________w____O___w',
      'w___w_________w________w',
      'w_s_w_O_______w__O_____w',
      'w______________________w',
      'wwwwwwwwwww__wwwwwwwwwww',
    ],
    links: { up: 'murmurwood', down: 'route2' },
    warps: {},
    signs: {
      '2,25': '낡은 도르래\n밀기바위가 구석에 끼었을 때 조사하면 원래 자리로 되돌립니다.',
    },
    puzzle: {
      gateTile: 'O',
      gates: { '10,13': 'echo_weight_solved', '11,13': 'echo_weight_solved' },
      push: {
        stateFlag: 'echo_push_blocks', solvedFlag: 'echo_weight_solved', resetAt: '2,25',
        blocks: [{ id: 'echo_stone', x: 12, y: 23 }],
        goals: [{ x: 12, y: 21 }],
        solvedText: '밀기바위가 둥근 홈에 내려앉았다! 멀리서 맞물린 석문이 열리는 소리가 메아리친다.',
        resetText: '도르래가 덜컹거리며 밀기바위를 처음 자리로 되돌렸다. 바위는 아무 일도 없었다는 표정이다.',
      },
    },
    encounters: {
      rate: 0.16,
      tiles: ['_'],
      levels: [10, 13],
      table: [
        ['zubat', 22], ['sandshrew', 15], ['mankey', 12],
        ['grubbin', 12], ['pawmi', 8], ['rattata', 7],
        ['zigzagoon', 5], ['sentret', 3], ['rookidee', 4],
        ['metapod', 4], ['kakuna', 4], ['pikachu', 2],
        ['roggenrola', 14], ['gastly', 9], ['noibat', 7],
        ['rockruff', 6], ['tinkatink', 4], ['charmander', 2], ['squirtle', 2],
        ['drilbur', 11], ['glimmet', 8], ['houndour', 5],
        ['goomy', 2], ['frigibax', 1],
      ],
    },
    npcs: [
      { id: 'cave_haru', x: 14, y: 3, kind: 'hiker', facing: 'right',
        trainer: {
          flag: 'tr_haru', name: '등산가 하루', range: 3,
          party: [['sandshrew', 11], ['mankey', 11]], prize: 390,
          intro: ['메아리는 거짓말을 안 해. 네 발소리만 들어도 실력을 알 수 있지!',
                  '어... 방금 내 배에서 난 소리는 무시하고 배틀하자!'],
          loseText: '동굴 전체가 내 패배를 재방송하잖아!',
          after: ['전기 기술은 땅 타입에게 통하지 않아. 0배도 훌륭한 힌트지.',
                  '실수로 한 번 더 눌렀다면 그건 힌트 확인이다. 세 번 누르면 고집이고.'],
        } },
      { id: 'cave_sena', x: 8, y: 10, kind: 'scout', facing: 'left',
        trainer: {
          flag: 'tr_sena', name: '동굴탐사대 세나', range: 3,
          party: [['zubat', 12], ['noibat', 12], ['roggenrola', 12]], prize: 430,
          intro: ['빛이 적을수록 감보다 기록을 믿어야 해.',
                  '내 동굴 데이터는 완벽해. 저장 버튼만 안 눌렀다는 사소한 문제가 있지만!'],
          loseText: '저장 안 한 데이터처럼 내 승리도 사라졌어!',
          after: ['북쪽 출구 뒤에는 속삭임숲이 나와.',
                  '센터까지는 더 가야 하니 체력과 PP를 확인해. 1 남은 걸 용기라고 부르진 말고.'],
        } },
      { id: 'cave_rest', x: 16, y: 24, kind: 'villager', facing: 'right', special: 'sidequest',
        quest: {
          id: 'echo_counterweight', title: '메아리의 무게', giver: '동굴 방송인 에코',
          intro: [
            '동굴 방송인 에코: 북쪽 석문은 소리로 안 열려. 나도 세 시간 외쳤다가 목만 열렸거든.',
            '이 방의 밀기바위를 위쪽 둥근 홈까지 밀어 줘. 바위 뒤에서 방향키를 누르면 움직여. 구석에 끼면 남서쪽 도르래를 조사하면 초기화된다.',
            '홈에 무게가 실리면 석문이 열린대. 아주 오래된 체중계인데 숫자 대신 길을 보여 주는 셈이지.',
          ],
          progress: ['동굴 방송인 에코: 밀기바위를 위쪽 빛나는 홈에 올려 줘. 막히면 남서쪽 도르래로 되돌리고. 내 목소리로는 정말 안 된다니까.'],
          complete: [
            '동굴 방송인 에코: 석문 소리가 여기까지 울렸어! 좋아, 방송 제목은 「돌 하나로 동굴 전체 열기」다.',
            '네가 민 장면은 편집하지 않을게. 대신 내가 옆에서 지휘한 것처럼 자막만 살짝 넣자.',
          ],
          after: ['동굴 방송인 에코: 벽의 그림자를 포켓몬으로 착각하지 마. 결론은 키 큼, 몸무게 비밀, 타입은 피곤이더라.'],
          requirement: { type: 'flags', flags: ['echo_weight_solved'] },
          reward: { items: { greatball: 3, potion: 2 } },
          rewardText: '슈퍼볼 3개와 상처약 2개를 받았다!',
        } },
    ],
  },

  // ------------------------------------------------ MURMURWOOD (forest dungeon)
  murmurwood: {
    bgm: 'forest',
    name: '속삭임숲',
    outdoor: true,
    tileset: 'forest',
    battleBg: 'forest',
    rows: [
      'TTTTTTTTTTT::TTTTTTTTTTT',
      'T,,,,,,,,,,::,,,,,,,,,,T',
      'T,ttttt,,,,::,,,,ttttt,T',
      'T,ttttt,,,,::,,,,ttttt,T',
      'T,ttttt,,,,::,,,,ttttt,T',
      'T,AAAAAAAA,::,AAAAAAAA,T',
      'T,,,,,,A,,,::,,,A,,,,,,T',
      'T,,T,,,A,,,::,,,A,,,T,,T',
      'T,,,:::::::::::::::::,,T',
      'T,,,::AAAAA::AAAAAA::,,T',
      'T,,,::FA,tt::t,,A,,::,,T',
      'T,,,::,A,tt::t,,A,F::,,T',
      'T,T,::,A,tt::t,,A,,::s,T',
      'T,,,::,,,tt::t,,,,,::,,T',
      'TWWWvvWWWWWvvWWWWWWvvWWT',
      'TWWWvvWWWWWvvWWWWWWvvWWT',
      'TWWWvvWWWWWvvWWWWWWvvWWT',
      'T,,,::,,,,,::,,,ttt::t,T',
      'T,,,::,T,,,::,,,Ttt::t,T',
      'T,,,::,,,,,::,,,ttt::t,T',
      'T,AA::AAA,,::,,AAAA::A,T',
      'T,,,::,,,A,::,A,,,,::,,T',
      'T,T,::,,,A,::::::::::,,T',
      'T,,,:::::::::,A,,,,::,,T',
      'T,tt::t,,A,::,A,,T,::,,T',
      'T,tt::AAAAA::AAAAA,::,,T',
      'T,tt:::::::::::::::::,,T',
      'T,ttttt,,A,::,A,,,,,,,,T',
      'T,ttttt,,A,::,A,,,,,,,,T',
      'T,AAAAAA,,,::,,,AAAAAA,T',
      'T,,,,,,,,,,::,,,,,,,,,,T',
      'T,,s,,,,,,,::,,,,,,T,,,T',
      'T,,,,,,,,,,::,,,,,,,,,,T',
      'TTTTTTTTTTT::TTTTTTTTTTT',
    ],
    links: { up: 'lakeglass', down: 'echocave' },
    warps: {},
    signs: {
      '3,31': '속삭임숲\n세 갈래 다리는 서로 다른 숲길을 지나 북쪽에서 합쳐집니다.',
      '21,12': '물소리 갈림길\n서쪽, 중앙, 동쪽 다리 중 어느 쪽으로도 건널 수 있습니다.',
    },
    encounters: {
      rate: 0.17,
      levels: [14, 17],
      table: [
        ['metapod', 9], ['kakuna', 9], ['butterfree', 2], ['beedrill', 2],
        ['grubbin', 12], ['charjabug', 4], ['bulbasaur', 3], ['ivysaur', 1],
        ['pidgeotto', 4], ['furret', 6], ['staravia', 7],
        ['fletchinder', 7], ['corvisquire', 6], ['herdier', 5],
        ['pikachu', 4], ['pawmi', 5], ['rookidee', 5], ['zubat', 4],
        ['oddish', 10], ['gloom', 3], ['ralts', 5], ['kirlia', 1],
        ['noibat', 4], ['mareep', 4],
        ['goomy', 8], ['rowlet', 7], ['dartrix', 2],
        ['houndour', 6], ['swablu', 5], ['fidough', 4],
      ],
    },
    npcs: [
      { id: 'lumi', x: 11, y: 13, kind: 'picnic', facing: 'right',
        trainer: {
          flag: 'tr_lumi', name: '곤충연구가 루미', range: 3,
          party: [['grubbin', 14], ['oddish', 14], ['butterfree', 15]], prize: 420,
          intro: ['이 숲의 벌레들은 작지만 기술 구성이 아주 지저분해. 칭찬이야!',
                  '가루, 실, 독침 풀코스를 직접 체험해 볼래? 환불은 안 돼!'],
          loseText: '연구 대상이 나였다는 결론은 예상 못 했는데!',
          after: ['두 번 공격해 얻는 힌트도 좋지만 기술 상성으로 채운 기록은 더 확실해.',
                  '여러 타입을 시험해 봐. 같은 기술만 누르다 이기면 실력이고, 지면 고집이니까.'],
        } },
      { id: 'silva', x: 19, y: 19, kind: 'scout', facing: 'left',
        trainer: {
          flag: 'tr_silva', name: '숲지기 실바', range: 3,
          party: [['beedrill', 15], ['staravia', 16]], prize: 520,
          reward: {
            item: 'scanner', amount: 1,
            text: '실바가 "아끼다 엔딩 보지 마"라는 메모와 함께 스캐너를 건넸다!',
          },
          intro: ['멈춰! 이 앞은 숲의 중심부야. 길 잃은 사람을 그냥 보내면 내 근무평가가 내려가.',
                  '내 파트너들을 읽고 이기면 통과! 지면 내가 길 안내부터 다시 해 줄게. 아주 길게.'],
          loseText: '좋아, 넌 길을 잃어도 우기면서 출구를 찾을 타입이네.',
          after: ['레이크글라스는 바로 북쪽이야. 체육관은 공격과 방어 순서를 계속 바꿔.',
                  '이 스캐너는 정말 모르겠을 때 써. 아끼다 엔딩 보는 건 절약이 아니라 미사용이야.'],
        } },
      { id: 'doran', x: 4, y: 24, kind: 'hiker', facing: 'right',
        trainer: {
          flag: 'tr_doran', name: '나무꾼 도란', range: 3,
          party: [['furret', 16], ['charjabug', 16]], prize: 500,
          intro: ['도끼질도 배틀도 힘만 세다고 되는 게 아니야. 빈틈에 정확히 쳐야지!',
                  '참고로 나무에는 도끼, 포켓몬에는 기술이다. 이건 꼭 구분해!'],
          loseText: '내 자존심 옹이까지 정확히 쪼갰군!',
          after: ['북쪽 출구는 멀지 않아. 체력이 부족하면 풀숲을 피해 큰길로 가.',
                  '무작정 풀숲에 들어가는 건 훈련이고, 체력 1로 들어가는 건 뉴스거리야.'],
        } },
      { id: 'lost_artist', x: 14, y: 30, kind: 'villager', facing: 'right',
        dialog: [
          '나무를 그리러 왔는데 길이 다 똑같아서 사흘째 같은 자리야. 작품명은 「강제 체류」로 정했어.',
          '매일 다른 포켓몬 발자국을 발견하니 소재는 풍부해. 식량만 부족하고.',
          '북쪽 출구는 물소리가 들리는 방향이래. 내가 말한 쪽으로 가서 또 만나면 서로 모르는 척하자.',
        ] },
    ],
  },

  // ------------------------------------------------ LAKEGLASS (second gym town)
  lakeglass: {
    bgm: 'lake',
    name: '레이크글라스',
    outdoor: true,
    battleBg: 'water',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT==TTTTTT',
      'T,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,==,,,,,T',
      'T,WWWWWWWWWWWWW,,,,,,,,,,,,WWWWWWW==WWWW,T',
      'T,WWWWWWWWWWWWW,,,,,,,,,,,,WWWWWWW==WWWW,T',
      'T,WWWWWWWWWWTWW,,,,,,,,,,,,WWTWWWW==WWWW,T',
      'T,WWWWWWWWWWWWW,,rrrrrrr,,,WWWWWWW==WWWW,T',
      'T,WWWWWWWWWWWWW,,rrrrrrr,,,WWWWWWW==WWWW,T',
      'T,WWWWWWWWWWWWW,,wwwDwww,s,WWWWWWW==WWWW,T',
      'T,WWWWWWWWWWWWW,,,,,==,,,,,WWWWWWW==WWWW,T',
      'T,WWWWWWWWWWWWW,,,,,==,,,,,WWWWWWW==WWWW,T',
      'T,qqqqqqqqqqqqq,,,,,==,,,,,qqqqqqq==qqqq,T',
      'T,qqqqqqqqqqqqq,,,,,==,,,,,qqqqqqq==qqqq,T',
      'TWWWWWvvWWWWWWWWWWWWvvWWWWWWWWWWWWvvWWWWWT',
      'TWWWWWvvWWWWWWWWWWWWvvWWWWWWWWWWWWvvWWWWWT',
      'TWWWWWvvWWWWWWWWWWWWvvWWWWWWWWWWWWvvWWWWWT',
      'T,,,,,=,,,,,,,,,,,,,==,,,,,,,,,,,,=,,,,,,T',
      'T,,====================================,,T',
      'T,,====================================,,T',
      'T,,F,,=,,,,,==================,,,,=,,,F,,T',
      'T,,,,,=,,,,,==================,,,,=,,,,,,T',
      'T,,,RRRRR,,,==================,,,MMMMM,,,T',
      'T,,,RRRRR,,F==================F,,MMMMM,,,T',
      'T,,,wcDww,,,==================,,,wDgww,,,T',
      'T,s,,,=,,,,,==================,,,,=,,,,s,T',
      'T,,,,,=,,,,,==================,,,,=,,,,,,T',
      'T,,====================================,,T',
      'T,,====================================,,T',
      'T,,,,,,,,,,,,,,,,,,,==,,,,,,,,,,,,,,,,,,,T',
      'T,,,,,,,,,s,,,,,,,,,==,,,,,,,,,,,,,,,,,,,T',
      'T,,,T,,,,,,,,,,,,,,,==,,,,,,,,,,,,,,,T,,,T',
      'T,,,,,,,,,,,,,T,,,,,==,,,,,T,,,,,,,,,,,,,T',
      'T,,,,,,,,,,,,,,,,,,,==,,,,,,,,,,,,,,,,,,,T',
      'T,,,,,,,,,,,,,,,,,,,==,,,,,,,,,,,,,,,,,,,T',
      'TTTTTTTTTTTTTTTTTTTT==TTTTTTTTTTTTTTTTTTTT',
    ],
    links: { up: 'thunderway', down: 'murmurwood' },
    warps: {
      '20,7': { map: 'tidegym',   x: 10, y: 16, facing: 'up' },
      '6,22': { map: 'healglass', x: 6, y: 5, facing: 'up' },
      '34,22':{ map: 'shop2',     x: 5, y: 4, facing: 'up' },
    },
    signs: {
      '25,7': '레이크글라스 체육관\n관장 세이라 — 흐름을 읽는 사람.',
      '2,23': '포켓몬센터\n숲을 지나온 동료에게 휴식을!',
      '39,23': '포켓몬마트\n긴 여행을 위한 물품을 판매합니다.',
      '10,28': '레이크글라스\n세 개의 나무다리가 북쪽 호수와 남쪽 광장을 잇습니다.',
    },
    encounters: {
      // Waterfront flower beds: Water partners and small town-edge visitors.
      tiles: ['F'], rate: 0.13, levels: [17, 20],
      table: [
        ['squirtle', 8], ['wartortle', 1], ['bulbasaur', 2],
        ['butterfree', 6], ['pidgeotto', 8], ['furret', 8],
        ['staravia', 8], ['fletchling', 7], ['rookidee', 7],
        ['pikachu', 7], ['pawmi', 7], ['sentret', 5],
        ['zigzagoon', 5], ['herdier', 4], ['oddish', 7],
        ['ralts', 4], ['mareep', 4],
        ['wooper', 15], ['quagsire', 4], ['goomy', 8],
        ['sliggoo', 1], ['swablu', 6], ['fidough', 5],
      ],
    },
    npcs: [
      { id: 'glass_child', x: 20, y: 15, kind: 'villager', facing: 'right',
        dialog: [
          '바람이 없으면 호수가 유리처럼 보여서 레이크글라스래. 나는 그냥 물 많은 마을이라고 불렀다가 혼났어.',
          '세이라 관장님은 잔잔할 때와 거칠 때 싸움법이 완전히 달라. 기분 변화가 아니라 전술이야.',
          '상대가 방어를 올리면 같이 기다리지 말고 약점이나 상태 이상을 노려. 장기전은 관장님만 신나!',
        ] },
      { id: 'glass_elder', x: 26, y: 23, kind: 'villager2', facing: 'left',
        dialog: [
          '속삭임숲을 빠져나왔나? 길을 안 물어본 척하는 표정을 보니 제법 성장했군.',
          '이 체육관은 강한 한 방보다 변화에 적응하는 힘을 본다네.',
          '센터에서 쉬고 가방을 정리하게. 준비 없이 들어가는 걸 낭만이라 부르는 건 패배 직전뿐이야.',
        ] },
      { id: 'glass_boatman', x: 7, y: 15, kind: 'hiker', facing: 'down',
        dialog: [
          '서쪽 다리는 부두, 중앙은 체육관, 동쪽은 산책로로 이어져.',
          '다리를 잘못 골라도 결국 이어지니 당당하게 걸어. 관광객은 길 잃은 게 아니라 구경 중인 거야.',
        ] },
      { id: 'analyst_sulnun', x: 34, y: 28, kind: 'picnic', facing: 'left', special: 'sidequest',
        quest: {
          id: 'identity_board', title: '정체 둘, 오답은 스물둘', giver: '분석가 설눈',
          intro: [
            '분석가 설눈: 나는 실루엣만 보고 종을 맞히는 방송을 해. 편집본에서는 정답률이 높고 생방송에서는 채팅창이 높지.',
            '잡은 동료 중 둘의 정체를 스캐너로 확인해 와. 확인 전 추측과 실제 결과를 비교해서 관찰표를 만들 거야.',
            '틀려도 괜찮아. 큰 목소리로 틀리면 분석, 작은 목소리로 틀리면 실수라는 업계 규칙이 있거든.',
          ],
          progress: ['분석가 설눈: 정체가 확인된 동료가 둘 필요해. 파티와 보관함 모두 세니까 이미 맡겼어도 괜찮아.'],
          complete: [
            '분석가 설눈: 좋아, 두 기록 모두 확보! 실루엣보다 힌트를 조합한 쪽이 훨씬 정확하다는 결론이네.',
            '쓴 스캐너 하나는 돌려주고 슈퍼볼도 얹어 줄게. 다음 오답은 더 경제적으로 내자.',
          ],
          after: ['분석가 설눈: 스캔된 동료는 실제 이름과 모습이 같이 보여야 해. 둘이 다르면 추리가 아니라 장비 신고 대상이야.'],
          requirement: { type: 'identified', count: 2 },
          reward: { items: { scanner: 1, greatball: 2 } },
          rewardText: '스캐너 1개와 슈퍼볼 2개를 받았다!',
        } },
    ],
  },

  healglass: {
    bgm: 'center',
    name: '레이크글라스 포켓몬센터',
    rows: [
      'wwwwwwwwwwww',
      'w__H_____P_w',
      'w__kkkkkk__w',
      'w__________w',
      'w_n______n_w',
      'w__________w',
      'w_____m____w',
      'wwwwwwwwwwww',
    ],
    warps: { '6,6': { map: 'lakeglass', x: 6, y: 23, facing: 'down' } },
    pcs: { '9,1': true },
    signs: {},
    npcs: [
      { id: 'nurse2', x: 5, y: 1, kind: 'nurse', facing: 'down', special: 'nurse' },
      { id: 'center_guest', x: 8, y: 4, kind: 'villager', facing: 'left',
        dialog: [
          '숲에서 중독을 세 번 당했어. 해독제를 아끼면 뿌듯할 줄 알았는데 센터 천장만 오래 봤지.',
          '도구는 쓰라고 있는 거더라. 이 위대한 사실을 치료비와 함께 배웠어.',
        ] },
    ],
  },

  shop2: {
    bgm: 'mart',
    name: '레이크글라스 포켓몬마트',
    rows: [
      'wwwwwwwwww',
      'w___G_GG_w',
      'w_kkkk___w',
      'w________w',
      'w______G_w',
      'w____m___w',
      'wwwwwwwwww',
    ],
    warps: { '5,5': { map: 'lakeglass', x: 34, y: 23, facing: 'down' } },
    signs: {},
    npcs: [
      { id: 'clerk2', x: 3, y: 1, kind: 'clerk', facing: 'down', special: 'shop' },
    ],
  },

  tidegym: {
    bgm: 'gym',
    name: '레이크글라스 체육관',
    battleBg: 'water',
    rows: [
      'wwwwwwwwwwwwwwwwwwww',
      'w__________________w',
      'w__________________w',
      'w__WWWW______WWWW__w',
      'w__WWWW______WWWW__w',
      'w__WWWW______WWWW__w',
      'w__WWWWW____WWWWW__w',
      'wWWWWWWWWjjWWWWWWWWw',
      'w__________________w',
      'w__WW__________WW__w',
      'w__WW________l_WW__w',
      'w__________________w',
      'wWWWWWWWWjjWWWWWWWWw',
      'w__________________w',
      'w___l______________w',
      'w_WWWW________WWWW_w',
      'w_________m________w',
      'wwwwwwwwwwwwwwwwwwww',
    ],
    warps: { '10,16': { map: 'lakeglass', x: 20, y: 8, facing: 'down' } },
    puzzle: {
      gates: {
        '9,12': 'tide_valve_1', '10,12': 'tide_valve_1',
        '9,7': 'tide_valve_2', '10,7': 'tide_valve_2',
      },
      plates: {
        '4,14': {
          flag: 'tide_valve_1',
          text: '첫 번째 밸브가 눌렸다! 아래쪽 물막이가 내려갔다. 누가 봐도 다음 밸브가 남았다.',
        },
        '13,10': {
          flag: 'tide_valve_2',
          text: '두 번째 밸브가 눌렸다! 위쪽 물막이가 열렸다. 퍼즐 제작자의 의도를 완벽히 간파했다!',
        },
      },
    },
    signs: {},
    npcs: [
      { id: 'nari', x: 14, y: 14, kind: 'picnic', facing: 'left',
        trainer: {
          flag: 'tr_nari', name: '수련생 나리', range: 4,
          party: [['pawmi', 16], ['fletchling', 16]], prize: 600,
          intro: ['잔잔한 물도 잘못 디디면 균형을 빼앗아. 방금 내가 미끄러진 건 시범이고!',
                  '기술 순서를 바꾸는 순간까지 따라올 수 있을까?'],
          loseText: '흐름도 끊기고 시범의 권위도 사라졌어!',
          after: ['서쪽 파란 밸브부터 밟으면 첫 번째 물막이가 내려가.',
                  '세이라 관장님은 공격과 방어를 번갈아 써. 같은 기술 연타는 손가락만 편하지.'],
        } },
      { id: 'jun', x: 6, y: 9, kind: 'scout', facing: 'right',
        trainer: {
          flag: 'tr_jun', name: '수련생 준', range: 4,
          party: [['staravia', 17], ['charjabug', 17]], prize: 680,
          intro: ['힌트를 많이 안다고 자동으로 이기는 건 아니야. 시험 범위 알아도 공부 안 하면 틀리잖아!',
                  '정보를 공격으로 바꾸는 타이밍을 보여 줘!'],
          loseText: '공부한 사람이 이기는 보기 드문 광경이군!',
          after: ['중간 구역 오른쪽 밸브가 마지막 물막이를 열어.',
                  '체력이 부족하면 센터에 다녀와. 밸브는 유지되니까 자존심만 두고 갔다 오면 돼.'],
        } },
      { id: 'seira', x: 9, y: 2, kind: 'leader_seira', facing: 'down', special: 'leader',
        trainer: {
          flag: 'tr_seira', name: '관장 세이라', range: 0, trainerVisual: 'seira',
          party: [['corvisquire', 18], ['wartortle', 20]], prize: 2200,
          badge: {
            name: '유리물결 배지',
            received: '세이라에게서 유리물결 배지를 받았다!',
            description: '유리물결 배지는 보이지 않는 흐름까지 읽어 냈다는 증거다.',
          },
          intro: ['어서 와. 밸브 두 개를 밟고도 길을 잃지 않았네. 벌써 상위권 도전자야.',
                  '나는 세이라. 잔잔한 수면 아래의 흐름을 읽지. 가끔 도전자 표정도 읽고.',
                  '지금 네 표정은 "물 타입만 나오겠지"인데... 그 확신부터 흔들어 볼까?'],
          loseText: '훌륭해. 흐름도 읽고 내 낚시성 발언에도 안 걸렸어.',
          after: ['힘이 아니라 판단으로 얻은 승리야. 물론 급소가 떴다면 그것도 네 판단으로 치자.',
                  '모르는 상대를 겁내지 말고 계속 관찰해. 틀려도 당당하면 적어도 방송 분량은 나오니까.'],
        } },
    ],
  },

  // ------------------------------------------------ THUNDERWAY (to the third gym)
  thunderway: {
    bgm: 'route3',
    name: '천둥갈대길',
    outdoor: true,
    battleBg: 'field',
    rows: [
      'TTTTTTTTTTTTTT::TTTTTTTTTTTTTT',
      'T,,,,,,,,,,,,,::,,,,,,,,,,,,,T',
      'T,,,,,,,C,,,,,::,,,,,,,,T,T,,T',
      'T,CCC,,,,C,,,,::,,,,,WWWWWWWWT',
      'T,,,,CC,,,,,,,::,,,,WWWWWWWW,T',
      'T,,,,,,,,,,,::::,,,,WWWWWWWWWT',
      'T,,,,,,F,,,,::::,,,,,WWWWWWWWT',
      'T,T,T,,,,,F,::::,,,,WWWWWWWWWT',
      'T,,,,,T,,,,,::::,F,,WWWWWWWW,T',
      'T,ttttt,,,,,::::,,,,,WWWWWWWWT',
      'T,ttttt,::::::::,,,,WWWWWWWWWT',
      'T,ttttt,::::::::,,vvvvvvWWWWWT',
      'T,ttttt,::::::::,,,,,WWWWWWW,T',
      'T,,,,,,,::::::::,,,,WWWWWWWWWT',
      'T,,T,,,,::::,,,,,,,,WWWWWWWWWT',
      'T,,,,T,,::::,,,,,,,,,WWWWWWWWT',
      'T,,,,,,,::::,,,,,,qqFqqqsqqqqT',
      'T,CC,,,,::::,,,,,,qqqqqqqqqTqT',
      'T,,,C,,,:::::::::::::,ttttt,,T',
      'T,,,,,F,:::::::::::::,tttttC,T',
      'T,,,F,,,:::::::::::::,ttttt,,T',
      'Tqqqqqqqqqqqq::::::::,ttttt,,T',
      'Tqqqqqqqqqqqq,,,,::::,,,,,T,,T',
      'TWWWWWWWWWW,tttt,::::,,,,,,,,T',
      'T,WWWWWWWW,,tttt,::::,F,,,,,,T',
      'TWWWWWWWWWW,tttt,::::,,,,,,,,T',
      'TWWWWWWWWWW,tttt,::::,,,,,,,,T',
      'TWWWWWWWWW,,,,:::::::,,,,,,,,T',
      'T,WWWWWvvvvvv,:::::::,,,,,,,,T',
      'TWWWWWWWWWW,,,:::::::tttttt,,T',
      'TWWWWWWWWW,,,F:::::::tttttt,,T',
      'TWWWWWWWWWW,,,:::::::tttttt,,T',
      'T,WWWWWWWWW,,,:::::::tttttt,,T',
      'TWWWWWWWWW,,,,::,,,,,,,,,,CC,T',
      'TWWWWWWWWWW,T,::,,,,,T,,CC,,,T',
      'T,,,,,,,,,,s,,::,,T,,,,,,,,,,T',
      'T,,,,T,,,,,,,,::,,,,,,,,,,,,,T',
      'TTTTTTTTTTTTTT::TTTTTTTTTTTTTT',
    ],
    links: { up: 'brightgear', down: 'lakeglass' },
    warps: {},
    signs: {
      '24,16': '천둥갈대길\n젖은 갈대밭에서는 전기 기술 흉내를 내지 마시오.',
      '11,35': '북쪽: 브라이트기어\n남쪽: 레이크글라스',
    },
    encounters: {
      rate: 0.12, levels: [20, 23],
      table: [
        ['pikachu', 15], ['raichu', 1], ['pawmi', 14], ['pawmo', 5],
        ['grubbin', 6], ['charjabug', 9], ['fletchinder', 10],
        ['staravia', 9], ['pidgeotto', 7], ['fearow', 6],
        ['herdier', 7], ['sandshrew', 5], ['linoone', 5],
        ['furret', 5], ['mareep', 12], ['flaaffy', 5],
        ['ampharos', 1], ['noibat', 5], ['squirtle', 3], ['wartortle', 1],
        ['shinx', 12], ['luxio', 5], ['houndour', 7],
        ['drilbur', 6], ['glimmet', 4],
      ],
    },
    npcs: [
      { id: 'storm_sera', x: 10, y: 7, kind: 'scout', facing: 'down',
        trainer: {
          flag: 'tr_storm_sera', name: '조류 관측가 세라', range: 3,
          party: [['shinx', 21], ['luxio', 22], ['fletchinder', 21]], prize: 900,
          intro: ['내 풍속계가 네 모자를 위험물로 판정했어. 바람에 날아가기 전에 배틀로 고정하자!',
                  '참고로 내가 지면 측정 오차, 네가 지면 실력 오차야.'],
          loseText: '측정 결과: 내 자신감만 초속 30미터로 날아갔어.',
          after: ['다리 건너 풀숲에는 여러 지방 포켓몬이 섞여 있어. 실루엣만 외우면 바로 함정이지.',
                  '기술 상성 기록을 먼저 모아. 눈보다 계산기가 정직할 때가 많거든.'],
        } },
      { id: 'storm_mino', x: 19, y: 18, kind: 'hiker', facing: 'left',
        trainer: {
          flag: 'tr_storm_mino', name: '전선 기사 미노', range: 4,
          party: [['sandshrew', 22], ['herdier', 22]], prize: 900,
          intro: ['전선은 땅에 묻었고 승부욕은 못 묻었다! 안전모 썼으니 공격력도 안전할 거라 생각했나?',
                  '그건 방어구가 아니라 회사 지급품이다!'],
          loseText: '퇴근 시간보다 빠르게 밀렸군. 이건 산업재해야.',
          after: ['브라이트기어 체육관은 차단기를 순서대로 켜야 해.',
                  '아무거나 누르면 되냐고? 된다. 다만 벽 앞에서 다시 생각할 시간이 생기지.'],
        } },
      { id: 'storm_han', x: 18, y: 27, kind: 'picnic', facing: 'right',
        trainer: {
          flag: 'tr_storm_han', name: '갈대 캠퍼 한', range: 3,
          party: [['charjabug', 22], ['flaaffy', 23]], prize: 940,
          intro: ['텐트는 방수인데 내 연승 기록은 방수가 아니야. 오늘 비 오기 전에 네 기록부터 적셔 주지!',
                  '야영의 핵심은 준비, 배틀의 핵심도 준비. 내 도시락 핵심은 계란말이.'],
          loseText: '연승 기록이 침수됐다! 도시락만은 지켜 냈어.',
          after: ['북쪽 도시는 넓으니까 큰길만 보지 마. 골목마다 회복 정보나 수상한 농담이 있어.',
                  '관장 토렌은 전기만 믿는 척하면서 교체 타이밍을 노려. 표정이 너무 솔직해서 문제지만.'],
        } },
      { id: 'reed_guide', x: 23, y: 16, kind: 'villager2', facing: 'right',
        dialog: ['물이 보여도 전부 막힌 길은 아니야. 나무다리 모양을 찾으면 건널 수 있어.',
                 '여기서 길을 잃으면 갈대 탓을 하는데, 갈대는 가만히 있었다는 게 늘 반박 포인트지.'] },
    ],
  },

  // ------------------------------------------------ BRIGHTGEAR (third gym city)
  brightgear: {
    bgm: 'city',
    name: '브라이트기어',
    outdoor: true,
    battleBg: 'city',
    rows: [
      'CCCCCCCCCCCCCCCCCCCCCCC==CCCCCCCCCCCCCCCCCCCCCCC',
      'C,,,,,,,,,,,,,,,,,,,,,,==,,,,,,,,,,,,,,,,,,,,,,C',
      'C,,,,,,,,,,,,,,,,,,,,,,==,,,,,,,,,,,,,,,,,,,,,,C',
      'C,T,T,,T,,,,WWWWW,,,,,,==,,,,,,WWWW,,,,,,,,T,,,C',
      'C,,,,,,,,T,OWWWWWO,,,,,==,,,,O,WWWW,O,,,,,,,,T,C',
      'C,,,,,,,,,,,WWWWW,,,,,,==,,,,,,WWWW,,,,,,,,,,,,C',
      'C,,,,,,,,,O,WWWWW,O,rrrrrrr,,,,WWWW,,,,,,,,,,,,C',
      'C,,,,rrrrr,,WWWWW,,,rrrrrrr,,,,WWWW,,rrrrr,,,,,C',
      'C,,,,rrrrr,,WWWWW,s,wwwDwwws,O,WWWW,Orrrrr,,,,,C',
      'C,,,,wwwww,,WWWWW,,,,,===,,,,,,WWWW,,wwwww,,,,,C',
      'C,,,,,,,,,,OWWWWWO,==========,,WWWW,,,,,,,,,,,,C',
      'C,,,,,,,,,,,WWWWW,,==========,,WWWW,,,,,,,,,,,,C',
      'C,T,,,,,,,,,WWWWW,,==========,OWWWWO,,,,,,,,,,,C',
      'C,,,,,,,,,qqqqqqqqq==========qqqqqqqq,,,,,,,,T,C',
      'C,,F,,,,,,,,,O,O,,,==========,,,,,,,,,,,,,,,F,,C',
      'C,,,,======================================,,,,C',
      'C,,,,======================================,,,,C',
      'C,,,,======================================,,,,C',
      'C,,,,======================================,,,,C',
      'C,,,,====,,,,,,,,,,==========,,,,,,,,,,====,,,,C',
      'C,,,,====,,,,,,F,,,==========,,,F,,,,,,====,,,,C',
      'C,,,,====,,,,,,,,,,==========,,,,,,,,,,====,,,,C',
      'C,,,RRRRR,,,,,,,,,,==========,,,,,,,,,,MMMMM,,,C',
      'C,,,RRRRR,,,,,,,,,,==========,,,,,,,,,,MMMMM,,,C',
      'C,s,wwDww,,,,,,,,,,==========,,,,,,,,,,wwDww,s,C',
      'C,,,,====,,,,,,,,,,==========,,,,,,,,,,====,,,,C',
      'C,,,,======================================,,,,C',
      'C,,,,=====s==========================s=====,,,,C',
      'C,,,,======================================,,,,C',
      'C,,,,,,,================================,,,,,,,C',
      'C,,,,,,,,,,,,,,,,,,,,,,==,,,,,,,,,,,,,,,,,,,,,,C',
      'C,,T,,,,,,,ffffffff,,,,==,,,,ffffffff,,,,,,,,T,C',
      'C,,,,,,T,,,fFfFfFfF,,,,==,,,,fFfFfFfF,,,,T,,,,,C',
      'C,,,,,,,,,,fff,,fff,,,,==,,,,fff,,fff,,,,,,,,,,C',
      'C,,,,,,,,,,,,,,,,,,,,,,==,,,,,,,,,,,,,,,,,,,,,,C',
      'CCCCCCCCCCCCCCCCCCCCCCC==CCCCCCCCCCCCCCCCCCCCCCC',
    ],
    links: { up: 'highrail', down: 'thunderway' },
    warps: {
      '23,8': { map: 'circuitgym', x: 11, y: 20, facing: 'up' },
      '6,24': { map: 'healgear', x: 6, y: 5, facing: 'up' },
      '41,24': { map: 'shopgear', x: 5, y: 4, facing: 'up' },
    },
    signs: {
      '18,8': '브라이트기어 체육관\n관장 토렌 — 과부하도 전술이라고 주장하는 남자.',
      '27,8': '회로광장\n정전 시 비명을 지르기 전에 차단기를 확인하세요.',
      '2,24': '포켓몬센터',
      '45,24': '포켓몬마트',
      '10,27': '서부 정비 구역',
      '37,27': '동부 발전 구역',
    },
    encounters: {
      // Generator gardens attract Electric/Bug species and urban scavengers.
      tiles: ['F'], rate: 0.13, levels: [23, 26],
      table: [
        ['pikachu', 14], ['raichu', 2], ['pawmi', 12], ['pawmo', 7],
        ['grubbin', 8], ['charjabug', 12], ['zigzagoon', 7],
        ['linoone', 7], ['rattata', 7], ['raticate', 4],
        ['fletchinder', 7], ['corvisquire', 7], ['herdier', 6],
        ['mareep', 10], ['flaaffy', 6], ['tinkatink', 8], ['tinkatuff', 2],
        ['shinx', 10], ['luxio', 6], ['fidough', 9],
        ['dachsbun', 2], ['drilbur', 7],
      ],
    },
    npcs: [
      { id: 'gear_mechanic', x: 12, y: 17, kind: 'hiker', facing: 'right',
        dialog: ['이 도시는 톱니바퀴와 전기로 움직여. 시민은 카페인으로 움직이고.',
                 '체육관 차단기는 아래부터 켜. 위부터 만지면 손만 바쁘고 길은 그대로야.'] },
      { id: 'gear_child', x: 34, y: 16, kind: 'scout', facing: 'left',
        dialog: ['토렌 관장님 머리는 정전 나도 혼자 빛날 것 같아. 이 말 했다가 체육관 청소 세 번 했어.',
                 '전기 포켓몬만 생각하다 땅 타입 하나에 전부 맡기면 다른 기술에 맞을 수도 있어. 관장도 그건 알아.'] },
      { id: 'gear_cyclist', x: 23, y: 28, kind: 'picnic', facing: 'up',
        dialog: ['남북 대로는 걷기 좋지만 사람 앞에서는 천천히 가. 교통법보다 NPC 충돌 판정이 더 무섭거든.',
                 '세 번째 배지를 얻으면 북쪽 고원길 검문소가 열려. 문지기가 배지 숫자에 진심이야.'] },
      { id: 'gear_oldtech', x: 10, y: 23, kind: 'villager2', facing: 'down', special: 'story', story: 'signal' },
      { id: 'reactor_ddabong', x: 37, y: 23, kind: 'villager', facing: 'down', special: 'sidequest',
        quest: {
          id: 'full_party_show', title: '여섯 자리 합방', giver: '리액션 방송인 따봉',
          intro: [
            '리액션 방송인 따봉: 오, 도전자 등장! 나는 놀랄 일이 없어도 일단 놀라고 보는 따봉이야. 화면이 심심하면 내가 커지거든.',
            '동료 여섯을 모아 와 줘. 파티와 보관함을 합쳐 여섯이면 합동 방송 섭외가 완성돼.',
            '누가 누군지 몰라도 괜찮아. 출연자 이름이 전부 ???면 오히려 제목이 세 보이잖아.',
          ],
          progress: ['리액션 방송인 따봉: 동료 여섯이 필요해. 빈자리를 리액션으로 채우려 했는데 화면에는 안 잡히더라.'],
          complete: [
            '리액션 방송인 따봉: 여섯 자리 꽉 찼다! 이 정도면 합방이 아니라 단체 채팅방이네!',
            '포획 방송에 쓸 슈퍼볼 다섯 개와 출연료 일부를 줄게. 나머지는 편집비라고 생각해.',
          ],
          after: ['리액션 방송인 따봉: 멤버가 많으면 상성에 맞춰 교체할 수 있어. 여섯을 모아 놓고 선두만 쓰면 합방이 아니라 독방이야.'],
          requirement: { type: 'caught', count: 6 },
          reward: { items: { greatball: 5 }, money: 600 },
          rewardText: '슈퍼볼 5개와 600원을 받았다!',
        } },
    ],
  },

  healgear: {
    bgm: 'center', name: '브라이트기어 포켓몬센터',
    rows: ['wwwwwwwwwwww','w__H_____P_w','w__kkkkkk__w','w__________w','w_n______n_w','w__________w','w_____m____w','wwwwwwwwwwww'],
    warps: { '6,6': { map: 'brightgear', x: 6, y: 25, facing: 'down' } },
    pcs: { '9,1': true }, signs: {},
    npcs: [
      { id: 'nurse3', x: 5, y: 1, kind: 'nurse', facing: 'down', special: 'nurse' },
      { id: 'gear_guest', x: 8, y: 4, kind: 'villager', facing: 'left',
        dialog: ['차단기 퍼즐에서 세 번 돌아왔어. 포켓몬은 회복됐는데 내 방향 감각은 서비스 대상이 아니래.'] },
    ],
  },

  shopgear: {
    bgm: 'mart', name: '브라이트기어 포켓몬마트',
    rows: ['wwwwwwwwww','w___G_GG_w','w_kkkk___w','w________w','w______G_w','w____m___w','wwwwwwwwww'],
    warps: { '5,5': { map: 'brightgear', x: 41, y: 25, facing: 'down' } },
    signs: {}, npcs: [{ id: 'clerk3', x: 3, y: 1, kind: 'clerk', facing: 'down', special: 'shop' }],
  },

  circuitgym: {
    bgm: 'gym',
    name: '브라이트기어 체육관',
    battleBg: 'indoor2',
    rows: [
      'wwwwwwwwwwwwwwwwwwwwww',
      'w____________________w',
      'w____________________w',
      'w__O______________O__w',
      'w____________________w',
      'wOOOOOOOOOzzOOOOOOOOOw',
      'w____________________w',
      'w___e_O________O_____w',
      'w____________________w',
      'wOOOOOOOOOzzOOOOOOOOOw',
      'w____________________w',
      'w____________________w',
      'w___O____________e___w',
      'w____________________w',
      'w____________________w',
      'wOOOOOOOOOzzOOOOOOOOOw',
      'w____________________w',
      'w____________________w',
      'w___e_O________O_____w',
      'w__O______________O__w',
      'w__________m_________w',
      'wwwwwwwwwwwwwwwwwwwwww',
    ],
    warps: { '11,20': { map: 'brightgear', x: 23, y: 9, facing: 'down' } },
    puzzle: {
      gateTile: 'z', plateTile: 'e',
      gates: {
        '10,15': 'circuit_breaker_1', '11,15': 'circuit_breaker_1',
        '10,9': 'circuit_breaker_2', '11,9': 'circuit_breaker_2',
        '10,5': 'circuit_breaker_3', '11,5': 'circuit_breaker_3',
      },
      plates: {
        '4,18': { flag: 'circuit_breaker_1', text: '첫 번째 차단기가 켜졌다! 아래쪽 전기 장벽이 꺼졌다. 전기요금은 그대로다.' },
        '17,12': { flag: 'circuit_breaker_2', text: '두 번째 차단기가 켜졌다! 가운데 장벽이 사라졌다. 이제 절반 넘게 속았다.' },
        '4,7': { flag: 'circuit_breaker_3', text: '마지막 차단기가 켜졌다! 관장실 전원이 들어왔다. 토렌의 머리도 더 빛난다!' },
      },
    },
    signs: {},
    npcs: [
      { id: 'coil_arin', x: 16, y: 18, kind: 'scout', facing: 'left',
        trainer: {
          flag: 'tr_coil_arin', name: '회로 수련생 아린', range: 4,
          party: [['mareep', 22], ['staravia', 22]], prize: 960,
          intro: ['첫 차단기는 보이는데 내가 앞에 있지. 이게 바로 저예산 보안 시스템이야!',
                  '통과하려면 내 전압보다 높은 집중력을 보여 줘.'],
          loseText: '퓨즈보다 내 멘탈이 먼저 나갔어.',
          after: ['왼쪽 아래 차단기를 밟으면 첫 장벽이 열려.', '나를 다시 이길 필요는 없어. 그건 내 자존심 보호 규정이야.'],
        } },
      { id: 'coil_dan', x: 8, y: 12, kind: 'hiker', facing: 'right',
        trainer: {
          flag: 'tr_coil_dan', name: '배선 기사 단', range: 4,
          party: [['charjabug', 23], ['primeape', 24]], prize: 1080,
          intro: ['배선은 색깔대로, 기술은 상성대로! 둘 다 틀리면 연기가 난다!',
                  '네 작전에서 연기가 나는지 점검해 주지. 출장비는 상금으로 받는다!'],
          loseText: '합선 원인은 내 판단력이었군. 보증 기간도 끝났어.',
          after: ['가운데 구역 오른쪽 차단기가 두 번째야.', '전기 장벽은 만지지 마. 게임 판정 이전에 상식 판정에서 탈락해.'],
        } },
      { id: 'coil_sol', x: 17, y: 7, kind: 'picnic', facing: 'left',
        trainer: {
          flag: 'tr_coil_sol', name: '발전 연구원 솔', range: 4,
          party: [['flaaffy', 24], ['pawmo', 25]], prize: 1200,
          intro: ['마지막 차단기를 앞에 두고 긴장했지? 난 월요일마다 이 긴장감을 느껴.',
                  '토렌 관장에게 가기 전에 네 배터리 잔량부터 검사한다!'],
          loseText: '검사 결과 내 쪽이 방전이네. 충전기는 휴게실에 있는데.',
          after: ['왼쪽 위 차단기가 마지막이야.', '토렌은 선두만 보고 땅 타입을 냈다간 교체로 흔들어. 한 수는 더 생각해.'],
        } },
      { id: 'toren', x: 10, y: 2, kind: 'leader_toren', facing: 'down', special: 'leader',
        trainer: {
          flag: 'tr_toren', name: '관장 토렌', range: 0, trainerVisual: 'toren',
          party: [['pikachu', 24], ['charjabug', 25], ['flaaffy', 26], ['ampharos', 27]], prize: 3000,
          badge: {
            name: '스파크기어 배지',
            received: '토렌에게서 스파크기어 배지를 받았다!',
            description: '스파크기어 배지는 세 개의 차단기와 네 번의 과부하를 견딘 증거다.',
          },
          intro: ['좋아! 차단기를 전부 켰군! 사실 두 번째 것은 조명 스위치였지만 기세가 중요하지!',
                  '나는 토렌. 전기는 빠르고, 내 판단은 가끔 그보다 빠르게 틀린다!',
                  '그래도 배틀만큼은 접지 없이 정면승부다. 네 작전을 통째로 과부하시켜 주지!'],
          loseText: '완전 방전이다! 그런데 이상하게 기분은 충전됐군!',
          after: ['북쪽 별바람 고원은 상대가 더 단단해져. 공격만 누르다간 네 손가락만 레벨업해.',
                  '방어를 낮추고 상태 이상과 교체를 섞어. 그리고 배지는 문지기 얼굴 가까이 들이밀지 말고 적당히 보여 줘.'],
        } },
    ],
  },

  // ------------------------------------------------ STARGALE HIGHLANDS
  highrail: {
    bgm: 'route3',
    name: '별바람 고원',
    outdoor: true,
    battleBg: 'rocky',
    rows: [
      'CCCCCCCCCCCCCC::CCCCCCCCCCCCCC',
      'CqqqqqqqqqqqqqOOqqqqqqqqqqqqqC',
      'CqCCCCCCCqqqqq::qqqqqqqqqqqqqC',
      'CqCCCCCCCqqqqq::qqqqqCCCCCCCqC',
      'CqCCCCCCCqqq::::qqqqqCCCCCCCqC',
      'CqCCCCCCCqqq::::qqqqqCCCCCCCqC',
      'CqCCCCCCCqqs::::qqqqqCCCCCCCqC',
      'Cqqqqqqqqqqq::::qqTqqCCCCCCCqC',
      'Cqqqqqq:::::::::qqqqqCCCCCCCqC',
      'CqqTqTq:::::::::sqqqqqqqqqqqqC',
      'Cqqqqqq:::::::::qqqqqqqqTqqqqC',
      'Cqqqqsq:::::::::qqqqqqqqsqqqqC',
      'Cqqqqqq::::qqqqqqqqqqqqqqqqqqC',
      'CWWWWWWWvvWWWWWWWWWWWWWWWWWWWC',
      'CWWWWWWWvvWWWWWWWWWWWWWWttttWC',
      'Cqttttq::::qqqqqqqqqqqqqttttqC',
      'Cqttttq::::::::::::::::qttttqC',
      'Cqttttq::::::F:::::::::qttttqC',
      'Cqttttq::::::::::::::::qttttqC',
      'Cqqqqqq::::::::::::::::qFqqqqC',
      'CqqTqqqqqqqqqqqqqqq::::qqqqTqC',
      'CqqqqTqqqqqqqqqqqqq::::qqTqqqC',
      'Cqqqqqqqqqqqqqqqqqq::::qqqqqqC',
      'CWWWWWWWWWWWWWWWWWWWvvWWWWWWWC',
      'CWWWWWWWWWWWWWWWWWWWvvWWWWWWWC',
      'Cqqtttttqqq::::::::::::tttttqC',
      'Cqqtttttqqq::::::F:::::tttttqC',
      'CqCCCCCCqqq::::::::::::tttttqC',
      'CqCCCCCCqqq:::::::::F::qqqqqqC',
      'CqCCCCCCqqq::::qqqqqqqCCCCCCqC',
      'CqCCCCCCqqF::::tttttqqCCCCCCqC',
      'CqCCCCCCsqq::::tttttqqCCCCCCqC',
      'CqCCCCCCqqq::::tttttqqCCCCCCqC',
      'CqCCCCCCqqq:::::ttttqqCCCCCCqC',
      'CqCCCCCCqqq:::::qqqqTqCCCCCCqC',
      'Cqqqqqqqqqqqqq::qqqqqqCCCCCCqC',
      'CqqqTqqqqqqqqq::qqqqqqqqqqqqqC',
      'CCCCCCCCCCCCCC::CCCCCCCCCCCCCC',
    ],
    links: { up: 'mistworks', down: 'brightgear' },
    warps: {},
    signs: {
      '24,11': '별바람 풍향 시험\n푸른 날개는 북쪽, 붉은 꽃은 동쪽, 회색 바위는 서쪽을 바라볼 때 석문이 잠잠해집니다.',
      '8,31': '북쪽: 흰안개 관측기지\n남쪽: 브라이트기어',
    },
    puzzle: {
      gateTile: 'O',
      gates: {
        '14,1': 'highrail_vanes_solved', '15,1': 'highrail_vanes_solved',
      },
      rotors: {
        stateFlag: 'highrail_vane_dirs', solvedFlag: 'highrail_vanes_solved',
        devices: {
          '11,6': { id: 'wing', label: '푸른 날개 풍향계', start: 2, target: 0 },
          '16,9': { id: 'flower', label: '붉은 꽃 풍향계', start: 3, target: 1 },
          '5,11': { id: 'stone', label: '회색 바위 풍향계', start: 1, target: 3 },
        },
        solvedText: '세 풍향계가 동시에 빛났다! 북쪽을 막던 바위 잠금이 땅속으로 내려간다.',
      },
    },
    encounters: {
      rate: 0.12, levels: [25, 29],
      table: [
        ['fearow', 10], ['golbat', 10], ['linoone', 8],
        ['staravia', 8], ['fletchinder', 7], ['pawmo', 7],
        ['primeape', 7], ['sandslash', 7], ['pidgeotto', 5],
        ['furret', 5], ['herdier', 5], ['corvisquire', 5],
        ['charjabug', 4], ['raticate', 4], ['charmeleon', 2],
        ['wartortle', 2], ['ivysaur', 2], ['raichu', 2],
        ['butterfree', 2], ['beedrill', 2], ['rockruff', 10],
        ['lycanroc', 3], ['roggenrola', 8], ['boldore', 4],
        ['gigalith', 1], ['noibat', 7], ['noivern', 1],
        ['snom', 8], ['frosmoth', 2], ['tinkatuff', 4],
        ['swablu', 9], ['altaria', 2], ['houndoom', 2],
        ['excadrill', 2], ['frigibax', 8], ['arctibax', 2],
        ['glimmet', 6], ['glimmora', 1],
      ],
    },
    npcs: [
      { id: 'high_birdman', x: 13, y: 10, kind: 'scout', facing: 'down',
        trainer: {
          flag: 'tr_high_birdman', name: '조류 연구가 류', range: 4,
          party: [['swablu', 26], ['altaria', 28]], prize: 1200,
          intro: ['높이 날면 세상이 작아 보인다지. 난 계단만 올라와도 체육관이 작아 보여.',
                  '고도 적응이 끝났다면 속도전 적응을 시작하자!'],
          loseText: '세상이 아니라 내 승률이 작아 보이는군.',
          after: ['북쪽 기지에 회색 외투 무리가 들어갔어. 날씨 관측치고는 몬스터볼을 너무 많이 들고 있더라.'],
        } },
      { id: 'high_rex', x: 17, y: 18, kind: 'rival', facing: 'left',
        trainer: {
          flag: 'tr_rex_high', name: '라이벌 렉스', range: 4,
          rivalStarter: { level: 28 },
          party: [['talonflame', 27]], prize: 1450,
          intro: ['렉스: 드디어 왔냐? 난 길을 잃은 게 아니라 고원 전체의 지형을 선행 조사한 거야.',
                  '렉스: 배지도 셋이네. 숫자는 같으니 이제 누가 더 있어 보이는지 배틀로 정하자!'],
          loseText: '렉스: 바람 때문에 명령이 반대로 들렸어. 실내였으면 내가 이겼다.',
          after: ['렉스: 북쪽 관측기지는 흰안개단이 차지했어. 내가 먼저 갈 수도 있지만 네 분량을 남겨 주는 거야.',
                  '렉스: 다음에는 변명도 새 버전으로 준비한다. 같은 대사 재탕은 라이벌의 수치니까.'],
        } },
      { id: 'high_climber', x: 22, y: 28, kind: 'hiker', facing: 'left',
        trainer: {
          flag: 'tr_high_climber', name: '등반가 오름', range: 4,
          party: [['boldore', 27], ['excadrill', 28], ['arctibax', 28]], prize: 1420,
          intro: ['정상에 오르면 강해진다! 내려갈 때 무릎이 약해지는 건 별도 계산이고!',
                  '네 팀의 체력과 내 무릎 중 누가 먼저 꺾이나 보자!'],
          loseText: '내 자존심도 하산을 시작했군.',
          after: ['흰안개단은 정체를 감추면 존재까지 강해진다고 믿어.', '틀린 말은 아니지만 회색 외투 단체 주문은 너무 티 나지.'],
        } },
      { id: 'vane_keeper', x: 7, y: 35, kind: 'villager', facing: 'right', special: 'sidequest',
        quest: {
          id: 'three_winds', title: '세 바람의 방향', giver: '풍향계 관리인 바람',
          intro: [
            '풍향계 관리인 바람: 북쪽 관측기지 석문은 세 풍향계가 약속된 방향을 볼 때만 열려. 강풍보다 규정에 더 꽉 막힌 문이지.',
            '표지의 문장을 읽고 푸른 날개, 붉은 꽃, 회색 바위 풍향계를 조사해 돌려 줘. 한 번 조사할 때마다 시계 방향으로 돈다.',
            '정답은 북쪽, 동쪽, 서쪽. 내가 바로 말해도 퍼즐은 퍼즐이야. 실제로 찾아가 돌리는 노동이 남았거든.',
          ],
          progress: ['풍향계 관리인 바람: 푸른 날개는 북쪽, 붉은 꽃은 동쪽, 회색 바위는 서쪽. 앞에서 조사하면 시계 방향으로 돌아가.'],
          complete: [
            '풍향계 관리인 바람: 세 방향이 맞았어! 석문이 내려갔으니 이제 내 업무는 네가 해결했고 내 보고서는 내가 쓴다.',
            '관측기지 안은 실험체가 뒤섞여 있어. 스캐너와 회복약을 챙겨 가. 모르는 게 많을수록 가방은 현실적이어야 해.',
          ],
          after: ['풍향계 관리인 바람: 방향은 맞았고 문도 열렸어. 이제 바람이 다시 돌려도 게임 진행상 고정이라고 생각하자.'],
          requirement: { type: 'flags', flags: ['highrail_vanes_solved'] },
          reward: { items: { scanner: 1, superpotion: 2 } },
          rewardText: '스캐너 1개와 좋은상처약 2개를 받았다!',
        } },
      { id: 'marathon_lookchan', x: 24, y: 22, kind: 'villager2', facing: 'left', special: 'sidequest',
        quest: {
          id: 'late_night_level', title: '새벽 고원 버티기', giver: '밤샘 방송인 룩찬',
          intro: [
            '밤샘 방송인 룩찬: 나는 고원 정상까지 안 쉬고 가는 방송 중이야. 지금 쉬고 있는 건 광고 구간이고.',
            '파티에서 한 명이라도 레벨 28을 찍으면 내 페이스 조절이 틀리지 않았다는 증거가 돼. 보여 주면 회복 도구를 나눠 줄게.',
            '이상한사탕을 썼냐고는 안 물어봐. 성장 과정까지 묻기 시작하면 방송이 아침을 넘어가거든.',
          ],
          progress: ['밤샘 방송인 룩찬: 최고 레벨 28이 목표야. 천천히 해도 돼. 내가 여기서 천천히 쉬고 있을 테니까.'],
          complete: [
            '밤샘 방송인 룩찬: 레벨 확인. 역시 무리하지 않고 오래 하는 게 중요하지. 내가 방금까지 누워 있던 건 장기 운영이야.',
            '기지 안은 상태 이상과 장기전이 많아. 좋은상처약과 만병통치제를 챙겨 가.',
          ],
          after: ['밤샘 방송인 룩찬: 레벨만 높아도 기술 상성이 안 맞으면 힘들어. 숫자와 생각을 같이 키워야 방송 분량이 줄어.'],
          requirement: { type: 'level', level: 28 },
          reward: { items: { superpotion: 3, fullheal: 3 } },
          rewardText: '좋은상처약 3개와 만병통치제 3개를 받았다!',
        } },
    ],
  },

  // ------------------------------------------------ WHITE MIST OBSERVATORY
  mistworks: {
    bgm: 'cave',
    name: '흰안개 관측기지',
    tileset: 'cave',
    battleBg: 'cave1',
    rows: [
      'wwwwwwwwwwwwww__wwwwwwwwwwwwww',
      'wwwwwwwwwwwwww__wwwwwwwwwwwwww',
      'wwwwwwwwwwwwww__wwwwwwwwwwwwww',
      'wwwwww__________wwwwwwwwwwwwww',
      'wwwwww__________wwwwwwwwwwwwww',
      'wwwwww__O___O___wwwwwwwwwwwwww',
      'wwwwww_s________wwwwwwWWWWWwww',
      'wwwwww__________wwwwwwWWWWWwww',
      'wwwwww_O_____________wWWWWWwww',
      'wwwwww_______________wWWWWWwww',
      'wwwwwwwwww_______O___wwwwwwwww',
      'wwwwwwwwww___________wwwwwwwww',
      'wwwWWWWWww__O________wwwwwwwww',
      'wwwWWWWWww___________wwwwwwwww',
      'wwwWWWWWww________O_________ww',
      'wwwwwwwwww__________________ww',
      'wwwwwwwwww_O_________O______ww',
      'ww_______________________O__ww',
      'ww__________________________ww',
      'ww__O___O___________________ww',
      'ww____________________O_____ww',
      'ww__________ww__www_______s_ww',
      'ww___O______ww__www_________ww',
      'ww________O____________wwwwwww',
      'ww_____________________wwwwwww',
      'wwwwwwwww_________O___wwwwwwww',
      'wwwwwwwww_____________wwwwwwww',
      'wwwwwwwww___O_________wwwwwwww',
      'wwwwwwwww__________O__wwwwwwww',
      'wwwwwwwww_____________wwwwwwww',
      'wwwwwwwww_____________wwwwwwww',
      'wwwwwwwwwwwwww__wwwwwwwwwwwwww',
    ],
    links: { up: 'everbloom', down: 'highrail' },
    warps: {},
    signs: {
      '7,6': '관측실 A\n현재 관측 대상: 수상하게 똑같은 회색 외투 3명.',
      '26,21': '비상 출구는 북쪽.\n장비보다 사람부터 대피시키십시오. 정말로.',
    },
    encounters: {
      // Escaped tagged specimens make the occupied observatory unusually varied.
      tiles: ['_'], rate: 0.075, levels: [27, 31],
      table: [
        ['golbat', 14], ['raticate', 10], ['sandslash', 9],
        ['primeape', 9], ['charjabug', 9], ['corvisquire', 8],
        ['linoone', 7], ['pawmo', 7], ['butterfree', 4],
        ['beedrill', 4], ['raichu', 3], ['charmeleon', 3],
        ['wartortle', 3], ['ivysaur', 3], ['pidgeot', 1],
        ['gastly', 10], ['haunter', 5], ['gengar', 1],
        ['kirlia', 5], ['gardevoir', 1], ['boldore', 5], ['gigalith', 1],
        ['noibat', 7], ['noivern', 1], ['snom', 6], ['frosmoth', 2],
        ['tinkatuff', 5], ['tinkaton', 1], ['flaaffy', 4], ['ampharos', 1],
        ['venusaur', 1], ['charizard', 1], ['blastoise', 1],
        ['staraptor', 1], ['stoutland', 1], ['talonflame', 1],
        ['vikavolt', 1], ['corviknight', 1], ['pawmot', 1],
        ['luxio', 5], ['luxray', 2], ['houndoom', 3],
        ['excadrill', 3], ['sliggoo', 3], ['goodra', 1],
        ['dartrix', 3], ['decidueye', 1], ['dachsbun', 3],
        ['arctibax', 2], ['baxcalibur', 1], ['glimmora', 2],
      ],
    },
    npcs: [
      { id: 'mist_grunt_a', x: 14, y: 9, kind: 'villager2', facing: 'down',
        trainer: {
          flag: 'tr_mist_a', name: '흰안개단 단원 포그', range: 4,
          party: [['houndoom', 28], ['haunter', 28]], prize: 1280,
          intro: ['흰안개단의 계획은 이름처럼 안 보인다! 우리도 아직 설명을 못 들었거든!',
                  '그러니 캐묻지 말고 배틀이나 해. 나도 대사 분량이 여기까지야!'],
          loseText: '계획도 승리도 안 보인다. 조직 이름 하나는 잘 지었어.',
          after: ['1번 주파수 조각은 가져가. 위쪽 연구실 보호 신호의 첫 부분이야.',
                  '우리는 관측 데이터를 훔쳐 포켓몬 정체를 더 감추려 했어. 듣고 보니 왜 했지?'],
        } },
      { id: 'mist_grunt_b', x: 19, y: 17, kind: 'villager', facing: 'left',
        trainer: {
          flag: 'tr_mist_b', name: '흰안개단 단원 미스트', range: 4,
          party: [['tinkatuff', 29], ['glimmora', 29]], prize: 1360,
          intro: ['우리는 정체를 감추는 전문가다. 명찰에 조직명을 크게 쓴 건 홍보팀 실수고!',
                  '스캐너 같은 건 압수다. 네 가방 검사 전에 먼저 기절시켜 주지!'],
          loseText: '내 실력까지 완벽하게 감춰졌군.',
          after: ['2번 주파수 조각을 받았으니 이제 절반보다 많이 모았네. 수학적으로 굉장히 억울하다.',
                  '포켓몬을 안 보이게 하는 것과 우리가 일을 못한 건 관련 없어. 아마도.'],
        } },
      { id: 'mist_grunt_c', x: 12, y: 26, kind: 'scout', facing: 'right',
        trainer: {
          flag: 'tr_mist_c', name: '흰안개단 보급원 헤이즈', range: 4,
          party: [['frosmoth', 29], ['luxray', 30], ['golbat', 30]], prize: 1500,
          reward: { item: 'scanner', amount: 1, text: '헤이즈가 떨어뜨린 보급 상자에서 스캐너를 하나 찾았다!' },
          intro: ['뒤로 물러나! 이 상자에는 조직의 최고 기밀이 들어 있다!',
                  '내용물이 스캐너라고 말한 적은 없다. 방금 말한 건 예시다. 잊어!'],
          loseText: '최고 기밀이 바닥에 굴러갔다. 못 본 걸로 해 주면 안 되냐?',
          after: ['3번 주파수 조각까지 가져가. 보고서에는 원래 빈 상자였다고 쓸 거야.',
                  '셋을 모았으니 북쪽 현장책임자의 보호 신호가 풀렸어. 그 사실은 내가 말한 게 아니라 전파가 말한 거다.'],
        } },
      { id: 'mist_director', x: 14, y: 4, kind: 'leader', facing: 'down',
        trainer: {
          flag: 'tr_mist_director', name: '흰안개단 현장책임자 베일', range: 0,
          requiresFlags: ['tr_mist_a', 'tr_mist_b', 'tr_mist_c'],
          locked: [
            '현장책임자 베일: 내 보호 신호가 켜져 있는 동안은 상대하지 않겠다. 악당도 근무 규정은 지켜야 하거든.',
            '기지의 송신 담당자 셋에게서 주파수 조각을 모아 와라. 친절한 설명이 아니라 네가 못 알아듣고 계속 서 있을까 봐 말한 거다.',
          ],
          party: [['gengar', 30], ['excadrill', 30], ['glimmora', 31], ['noivern', 32]], prize: 2600,
          intro: [
            '현장책임자 베일: 주파수 조각 셋을 모았군. 단원 선발 기준을 다시 써야겠어. 이름 크게 말하는 항목부터 빼고.',
            '우리는 포켓몬의 모습을 숨기는 게 아니다. 사람들이 관측한 이름을 서로 다르게 만들어 모든 기록을 못 믿게 하지.',
            '그리고 우리가 인증한 스캐너만 정답이라고 팔면 된다. 진실을 독점하면 구독료가 붙는 법이거든.',
            '여기서 널 틀린 이름으로 저장해 주마. 분류는 「지나치게 호기심 많은 패배자」다!',
          ],
          loseText: '내 사업계획서가 전투력 항목에서 부적격 판정을 받다니!',
          after: [
            '베일이 떨어뜨린 마스터 코드를 얻었다. 북쪽 에버블룸 기록망의 위조 신호를 지울 수 있을 것 같다.',
            '현장책임자 베일: 계획은 끝나지 않았다. 상위 송신지는 이미 다음 지역으로 옮겼어. 내가 정확히 어딘지는 모르지만 위협은 된다!',
          ],
        } },
    ],
  },

  // ------------------------------------------------ EVERBLOOM (fourth gym city)
  everbloom: {
    bgm: 'city',
    name: '에버블룸',
    outdoor: true,
    battleBg: 'field',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,T',
      'T,T,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,T,T',
      'T,,,,,,,,,,,,,,,T,,,,,,,,,,,,,T,,,,,,,,,,,,,,,,,,T',
      'T,,WWWWWWWWWWWW,,,T,,,,,,,,,,,,,T,,WWWWWWWWWWW,,,T',
      'T,,WWWWWWWWWWWW,,,,,,,,,,,,,,,,,,,,WWWWWWWWWWWW,,T',
      'T,,,WWWWWWWWWWW,,,,,,rrrrrrr,,,,,,,WWWWWWWWWWWW,,T',
      'T,,WWWWWWWWWWWW,,,,,,rrrrrrr,,,,,,,WWWWWWWWWWWW,,T',
      'T,,WWWWWWWWWWWW,,,,s,wwwDwwws,,,,,,WWWWWWWWWWW,,,T',
      'T,,,WWWWWWWWWWW,,,,,,,======,,,,,,,WWWWWWWWWWWW,,T',
      'T,,WWWWWWWWWffffffff,,======,,ffffffffWWWWWWWWW,,T',
      'T,,WWWWWWWWWffffffff,,======,,ffffffffWWWWWWWWW,,T',
      'T,,,WWWWWWWWfWF,F,Ff,,======,,fF,F,FWfWWWWWWWW,,,T',
      'T,,WWWWWWWWWfWW,,,,f,,======,,f,,,,WWfWWWWWWWWW,,T',
      'T,,WWWWWWWWWfFWF,F,f,,======,,f,F,FWFfWWWWWWWWW,,T',
      'T,qqqqqqqqqqfqqq,,,f,,======,,f,,,qqqfqqqqqqqqqq,T',
      'T,,,,,,,,,,,fff,,fff,,======,,fff,,fff,,,,,,,,,,,T',
      'T,,,,rrrrr,,,,,,,,,,,,======,,,,,,,,,,,,rrrrr,,,,T',
      'T,T,,rrrrr==============================rrrrr,,T,T',
      'T,,,,wwwww==============================wwwww,,,,T',
      'T,,,,,,,=============s======s==============,,,,,,T',
      'T,,,,,,,===================================,,,,,,T',
      'T,,,,,,,====,,,,,,,,,,======,,,,,,,,,,,====,,,T,,T',
      'T,,T,,,,====,,,,,,,,,,======,,,,,,,,,,,====,,,,,,T',
      'T,,,,RRRRR==,,,,,,,,,,======,,,,,,,,,,,=MMMMM,,,,T',
      'T,,,,RRRRR==,,rrrrr,,,======,,,rrrrr,,,=MMMMM,,,,T',
      'T,,s,wwDww==,,rrrrr,,,======,,,rrrrr,,,=wwDww,s,,T',
      'T,,,,,,=====,,wwwww,,,======,,,wwwww,,,====,,,,,,T',
      'T,,,,,======================================,,,,,T',
      'T,,,,,======s========================s======,,,,,T',
      'T,T,,,======================================,,,T,T',
      'T,,,,,======================================,,,,,T',
      'T,,,,,,,,,,,,,,,,,,,,,==::==,,,,,,,,,,,,,,,,,,,,,T',
      'T,,ffffffffffffffff,,,==::==,,,ffffffffffffffff,,T',
      'T,,ffFfFfffFffFffff,,,==::==,,,ffFffffFfffFffff,,T',
      'T,,ffffffffffffffFf,T,,,::,,,T,ffffFfffffffffFf,,T',
      'T,,ffffff::ffffffff,,,,,::,,,,,ffffffff::ffffff,,T',
      'T,,,,,,,,,,,,,,,,,,,,,,,::,,,,,,,,,,,,,,,,,,,,,,,T',
      'T,,,,,,,,,,,,,,,,,T,,,,,::,,,,,T,,,,,,,,,,,,,,,,,T',
      'TTTTTTTTTTTTTTTTTTTTTTTT::TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    links: { down: 'mistworks' },
    warps: {
      '24,8': { map: 'mirrorgym', x: 13, y: 20, facing: 'up' },
      '7,26': { map: 'healbloom', x: 6, y: 5, facing: 'up' },
      '42,26': { map: 'shopbloom', x: 5, y: 4, facing: 'up' },
    },
    signs: {
      '19,8': '에버블룸 체육관\n관장 엘로아 — 향기보다 길 찾기가 더 강한 시험.',
      '28,8': '쌍둥이 온실\n왼쪽 꽃과 오른쪽 꽃은 서로 자기가 원조라고 주장합니다.',
      '21,20': '에버블룸 중앙정원',
      '28,20': '발판 안내\n반짝인다고 전부 정답은 아닙니다. 인생도 그렇습니다.',
      '3,26': '포켓몬센터',
      '46,26': '포켓몬마트',
      '12,29': '서향 온실 거리',
      '37,29': '동향 온실 거리',
    },
    encounters: {
      // Walkable flower patches are the city's optional late-game garden hunt.
      tiles: ['F'], rate: 0.14, levels: [30, 34],
      table: [
        ['ivysaur', 12], ['venusaur', 2], ['butterfree', 10],
        ['beedrill', 10], ['pidgeotto', 8], ['pidgeot', 2],
        ['staravia', 8], ['staraptor', 2], ['fletchinder', 8],
        ['talonflame', 2], ['charjabug', 8], ['vikavolt', 2],
        ['corvisquire', 8], ['corviknight', 2], ['bulbasaur', 6],
        ['caterpie', 4], ['weedle', 4], ['pikachu', 4],
        ['pawmo', 4], ['herdier', 4], ['oddish', 12],
        ['gloom', 7], ['vileplume', 2], ['ralts', 6],
        ['kirlia', 4], ['gardevoir', 1],
        ['rowlet', 10], ['dartrix', 4], ['decidueye', 1],
        ['fidough', 8], ['dachsbun', 3], ['goomy', 7],
        ['sliggoo', 2], ['goodra', 1], ['swablu', 6], ['altaria', 2],
      ],
    },
    npcs: [
      { id: 'bloom_gardener', x: 15, y: 20, kind: 'villager2', facing: 'right',
        dialog: ['온실 발판은 꽃향기 흐름을 따라 만든 거래. 나는 코가 막혀서 지도를 들고 다녀.',
                 '틀린 발판도 완전 실패는 아니야. 어디가 아닌지 알았으니 정보가 하나 늘었지. 정신승리지만.'] },
      { id: 'bloom_student', x: 34, y: 20, kind: 'picnic', facing: 'left',
        dialog: ['엘로아 관장님은 풀만 쓰는 척하면서 벌레와 독을 섞어. 타입 하나만 맞추면 된다는 사람을 특히 좋아하지.',
                 '좋아한다는 건 환영한다는 뜻이 아니라 교육한다는 뜻이야. 꽤 아프게.'] },
      { id: 'bloom_scientist', x: 24, y: 30, kind: 'scout', facing: 'up', special: 'story', story: 'archive' },
      { id: 'bloom_cyclist', x: 12, y: 31, kind: 'villager', facing: 'right',
        dialog: ['꽃밭 안에는 들어가지 마. 발자국보다 정원사 눈빛이 더 오래 남아.',
                 '도시는 넓지만 중앙 대로와 가로길이 이어져 있어. 횡스크롤처럼 한 줄만 달릴 필요 없어.'] },
      { id: 'bloom_elder', x: 38, y: 31, kind: 'hiker', facing: 'left',
        dialog: ['네 번째 배지는 팀 역할을 제대로 나눠야 얻을 수 있다네.',
                 '선두 하나만 키웠다면 지금 이상한사탕 가방이 왜 무거운지 생각해 보게. 테스트용 백 개도 전략은 아니야.'] },
    ],
  },

  healbloom: {
    bgm: 'center', name: '에버블룸 포켓몬센터',
    rows: ['wwwwwwwwwwww','w__H_____P_w','w__kkkkkk__w','w__________w','w_n______n_w','w__________w','w_____m____w','wwwwwwwwwwww'],
    warps: { '6,6': { map: 'everbloom', x: 7, y: 27, facing: 'down' } },
    pcs: { '9,1': true }, signs: {},
    npcs: [
      { id: 'nurse4', x: 5, y: 1, kind: 'nurse', facing: 'down', special: 'nurse' },
      { id: 'bloom_guest', x: 8, y: 4, kind: 'villager', facing: 'left',
        dialog: ['순간이동 발판을 일곱 번 밟고 여기 왔어. 체육관보다 센터 위치를 더 완벽히 외웠지.'] },
    ],
  },

  shopbloom: {
    bgm: 'mart', name: '에버블룸 포켓몬마트',
    rows: ['wwwwwwwwww','w___G_GG_w','w_kkkk___w','w________w','w______G_w','w____m___w','wwwwwwwwww'],
    warps: { '5,5': { map: 'everbloom', x: 42, y: 27, facing: 'down' } },
    signs: {}, npcs: [{ id: 'clerk4', x: 3, y: 1, kind: 'clerk', facing: 'down', special: 'shop' }],
  },

  mirrorgym: {
    bgm: 'gym',
    name: '에버블룸 체육관',
    battleBg: 'indoor3',
    rows: [
      'wwwwwwwwwwwwwwwwwwwwwwwwww',
      'w________________________w',
      'w______O___________O_____w',
      'w____F____F_____F____F___w',
      'w___m____________________w',
      'w_______O_________O______w',
      'w________________________w',
      'w________________________w',
      'wwwwwwwwwwwwwwwwwwwwwwwwww',
      'w________________________w',
      'w__O_____O_____F____m____w',
      'w____m___________________w',
      'w_______________O_____O__w',
      'w_____F____F________F____w',
      'w________________________w',
      'wwwwwwwwwwwwwwwwwwwwwwwwww',
      'w________________________w',
      'w____m__O________O_______w',
      'w____F____F_____F___mF___w',
      'w__O__________________O__w',
      'w____________m___________w',
      'wwwwwwwwwwwwwwwwwwwwwwwwww',
    ],
    warps: {
      '13,20': { map: 'everbloom', x: 24, y: 9, facing: 'down' },
      '5,17': { map: 'mirrorgym', x: 4, y: 13, facing: 'up' },
      '20,18': { map: 'mirrorgym', x: 13, y: 19, facing: 'up' },
      '20,10': { map: 'mirrorgym', x: 20, y: 5, facing: 'up' },
      '5,11': { map: 'mirrorgym', x: 13, y: 19, facing: 'up' },
      '4,4': { map: 'mirrorgym', x: 4, y: 13, facing: 'down' },
    },
    signs: {},
    npcs: [
      { id: 'petal_rin', x: 13, y: 18, kind: 'picnic', facing: 'down',
        trainer: {
          flag: 'tr_petal_rin', name: '향기 수련생 린', range: 3,
          party: [['kirlia', 29], ['ivysaur', 30]], prize: 1420,
          intro: ['꽃향기를 따라가면 정답이라는데 나는 향수를 뿌려서 이제 아무것도 모르겠어!',
                  '길 안내는 포기했지만 배틀 안내는 정확히 해 주지! 시작!'],
          loseText: '배틀 안내도 정확하지 않았네. 환불은 꽃잎으로 해 줄게.',
          after: ['아래 방에서는 왼쪽 발판이 다음 방으로 이어져.', '오른쪽은 입구 근처로 돌아가. 내 향수보다 확실한 정보야.'],
        } },
      { id: 'petal_maru', x: 13, y: 11, kind: 'scout', facing: 'down',
        trainer: {
          flag: 'tr_petal_maru', name: '온실지기 마루', range: 3,
          party: [['gloom', 30], ['golbat', 31]], prize: 1540,
          intro: ['두 번째 방까지 왔네. 운이 좋았든 기억력이 좋았든 이기면 실력으로 기록해 줄게!',
                  '기록지는 내가 쓰니까 역사도 내가 정한다!'],
          loseText: '좋아, 역사책에 네 이름을 아주 작게 적어 주지.',
          after: ['가운데 방에서는 오른쪽 위 발판이 정답이야.', '왼쪽 발판은 아래로 돌아간다. 일부러 확인할 필요는 없어, 정말로.'],
        } },
      { id: 'petal_somi', x: 13, y: 5, kind: 'villager', facing: 'left',
        trainer: {
          flag: 'tr_petal_somi', name: '화원 연구원 소미', range: 3,
          party: [['dartrix', 31], ['dachsbun', 32], ['goodra', 33]], prize: 1780,
          intro: ['마지막 방이야. 저 뒤의 엘로아 관장님은 조용하지만 생각보다 대사가 세.',
                  '먼저 내 혼합 타입 시험을 통과해. 풀만 대비한 팀이면 여기서 표정이 피거든!'],
          loseText: '네 팀 구성이 꽃다발보다 균형 잡혔네.',
          after: ['엘로아 관장님은 바로 북쪽이야.', '왼쪽 발판은 이전 방으로 돌아가니 이제 밟으면 모험이 아니라 실수야.'],
        } },
      { id: 'eloa', x: 13, y: 2, kind: 'leader_eloa', facing: 'down', special: 'leader',
        trainer: {
          flag: 'tr_eloa', name: '관장 엘로아', range: 0, trainerVisual: 'eloa',
          party: [['dartrix', 31], ['gloom', 31], ['decidueye', 34], ['venusaur', 35]], prize: 4200,
          badge: {
            name: '청록향기 배지',
            received: '엘로아에게서 청록향기 배지를 받았다!',
            description: '청록향기 배지는 미로의 흐름과 네 번째 관문의 변화를 읽어 낸 증거다.',
          },
          intro: ['어서 와. 틀린 발판을 밟았어도 아무 말 하지 않을게. 관측 기록에는 다 남아 있지만.',
                  '나는 엘로아. 꽃은 조용히 피지만 배틀 로그는 꽤 시끄럽지.',
                  '풀 하나만 베면 끝이라고 생각했다면, 오늘은 벌레와 독이 그 자신감을 가지치기할 거야.'],
          loseText: '훌륭해. 네 판단은 햇빛을 좇는 잎처럼 흔들리지 않았어. 급소가 두 번 떴지만 그것도 햇빛이지.',
          after: ['네 번째 배지까지 왔다면 이제 실루엣을 무서워하기보다 정보를 조합할 줄 안다는 뜻이야.',
                  '정체를 모르는 건 약점이 아니라 질문의 시작이야. 다만 틀린 추측을 확신으로 저장하는 건 그냥 약점이고.'],
        } },
    ],
  },
};

// The original village layout is kept above as design history, but the live
// opening uses this compact route so the first story beats are always nearby.
MAPS.hometown.rows = [
  'TTTTTTTTTTTTT::::TTTTTTTTTTTTTTTTT',
  'T,,,,,,,,,,,,::::,,,,,,,,,,,,,,,,T',
  'T,,,,,,,,,,,,::::,,,,,,,,,,,,,,,,T',
  'T,,,,,,,,,,,,::::,,,,,,,,,,,,,,,,T',
  'T,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,T',
  'T,,,rrrrr,,,,,,,,,,,,,,,,rrrrr,,,T',
  'T,,,rrrrr,,,,,,,,,,,,,,,,rrrrr,,,T',
  'T,,,rrDrr,,,,,,,,,,,,,,,,rrDrr,,,T',
  'T,,============================,,T',
  'T,,=======s====================,,T',
  'T,,============================,,T',
  'T,,,,,,,,,,,WWWWWWWWW,,,,,,,,,,,,T',
  'T,,,FF,,,,,,WWWWWWWWW,,,,,,,,,,,,T',
  'T,,,,,,,,,,,WWWvvvWWW,,,,,,,,,,,,T',
  'T,,,,,,,,,,,WWWWWWWWW,,,,,,,,,,,,T',
  'T,,,,,,,,,,,WWWWWWWWW,,,,rrrrr,,,T',
  'T,,,,,,,,,,,,,,,,,,,,,,,,rrrrr,,,T',
  'T,,,,,,,,,,,,,,,,,s,,,,,,rrDrr,,,T',
  'T,,F,,,,,,,,,,,,,,,,,,,,,,,,,,,,,T',
  'T,,============================,,T',
  'T,,,,,,,,,,,,,,,,,,,,,,,,,,,,,F,,T',
  'T,,,rrrrr,F,rrrrr,,,rrrrr,,,,,,,,T',
  'T,,,rrrrr,F,rrrrr,,,rrrrr,,,,,,,,T',
  'T,,,rrDrr,,,rrDrr,,,rrDrr,,,,,,,,T',
  'T,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,T',
  'T,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,T',
  'T,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,T',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
];
MAPS.hometown.tileset = 'village';
MAPS.hometown.warps = {};
MAPS.hometown.signs = {
  '10,9': '윌로우브룩 중앙길\n북쪽은 펀웨이 트레일, 남쪽은 메이플 연구소다.',
  '18,17': '물빛 연못\n마을의 물길은 연구소 관찰 수로와 이어진다.',
};
MAPS.hometown.npcs = [
  { id: 'hv1', x: 17, y: 9, kind: 'villager', facing: 'down', dialog: [
    '윌로우브룩은 길을 잃기 전에 물소리가 먼저 안내하는 마을이야.',
    '북쪽 트레일의 포켓몬은 여러 지방에서 모여 왔어. 실루엣만 보고 아는 척하면 꽤 민망하지.',
    '메이플 박사님은 그 공존을 조사 중이야. 남쪽 연구소에서 네 첫 임무를 받아 봐.',
  ] },
  { id: 'hv2', x: 10, y: 19, kind: 'villager2', facing: 'right', dialog: [
    '물은 불꽃에 강하고, 불꽃은 풀에 강하고, 풀은 물에 강해. 실전에서는 꼭 반대로 누르지만.',
    '상태 이상도 얕보지 말게. 포획 전에 상대를 약하게 만드는 건 예의 바른 관찰이야.',
  ] },
  { id: 'hv3', x: 22, y: 4, kind: 'villager', facing: 'left', dialog: [
    '아침마다 연못 수로에서 이상한 금속음이 들려. 물고기 소리는 아닌 것 같아.',
    '회색 외투를 입은 사람이 북쪽 길을 서성였다는 말도 있어. 더운 날 외투면 거의 자백이지.',
  ] },
  { id: 'willow_kid', x: 11, y: 10, kind: 'scout', facing: 'right', dialog: [
    '광장 한 바퀴, 연못 한 바퀴! 걸어서도 금방이야. 예전 길은 너무 길어서 내가 중간에 간식을 먹었거든.',
    '다리 아래 물길은 연구소까지 이어져. 박사님이 비밀 통로라고 부르지만 그냥 수로야.',
  ] },
  { id: 'willow_gardener', x: 29, y: 20, kind: 'villager2', facing: 'left', dialog: [
    '남쪽 세 집은 연구원과 정원사가 함께 쓰는 구역이란다.',
    '꽃밭은 눈으로만 살펴보렴. 기록은 남기되 꽃은 남겨 두는 게 좋은 연구야.',
  ] },
  { id: 'willow_fisher', x: 2, y: 14, kind: 'hiker', facing: 'right', dialog: [
    '연못 한가운데 다리는 목공소에서 놓았어. 물 위를 걷지만 실제로 젖지는 않지.',
    '금속음이 들리면 낚싯대를 거둬. 물고기보다 큰 사건이 걸릴 때가 있거든.',
  ] },
  { id: 'willow_aide', x: 18, y: 20, kind: 'picnic', facing: 'right', dialog: [
    '메이플 박사님 연구소는 남동쪽 건물이야. 문 앞 서류도 엄연한 현장 업무지.',
    '연못 수로에서 채집된 금속 조각을 박사님이 조사 중이야. 너도 곧 알게 될 거야.',
  ] },
  { id: 'willow_runner', x: 17, y: 4, kind: 'scout', facing: 'down', dialog: [
    '북문에서 광장까지 달리고, 연못을 돌아 남쪽 연구소까지! 이게 윌로우브룩 한 바퀴야.',
    '길이 짧아졌냐고? 응. 이제 나도 결승선을 볼 수 있어.',
  ] },
  { id: 'willow_keeper', x: 17, y: 17, kind: 'villager2', facing: 'right', special: 'townstory' },
];

// Keep the old shared room as a save-compatible fallback for players who
// saved inside it before ordinary buildings received individual interiors.
// No reviewed exterior below routes new visits here.
MAPS.guesthouse = {
  bgm: 'home', name: '여행자 쉼터',
  rows: [
    'wwwwwwwwww', 'w_b______w', 'w________w', 'w________w',
    'w____n___w', 'w________w', 'w____D___w', 'wwwwwwwwww',
  ],
  warps: { '5,6': { map: 'hometown', x: 6, y: 24, facing: 'down', returnWarp: true } },
  signs: {},
  npcs: [{ id: 'guest_resident', x: 6, y: 4, kind: 'villager', facing: 'left', dialog: [
    '어서 와. 윌로우브룩의 집은 문을 열어 두는 게 손님을 맞는 첫 인사란다.',
    '밖의 건물마다 사는 사람과 일이 달라. 어느 문이든 직접 확인해 봐.',
  ] }],
};

// Ordinary buildings are real places, not seven doors into one cloned room.
// Each resident and line of dialogue establishes what the building is for;
// the matching floor plan and furniture are applied after setInteriorRoom is
// declared below.
const ORDINARY_INTERIOR_SPECS = {
  willowworkshop: {
    name: '윌로우브룩 목공소', tileset: 'willow_craft',
    resident: { id: 'willow_carpenter', x: 8, y: 5, kind: 'hiker', facing: 'left', wander: true, wanderRadius: 1, dialog: [
      '연못의 두 줄 다리는 여기서 잘라 맞췄어. 물을 건너는 폭과 사람이 비켜설 폭을 따로 계산했지.',
      '침대나 텔레비전 대신 작업대가 많은 이유? 여긴 집처럼 생겼어도 목공소니까.',
    ] },
  },
  willowhall: {
    name: '윌로우브룩 기록회관', tileset: 'willow_civic',
    resident: { id: 'willow_archivist', x: 10, y: 6, kind: 'villager2', facing: 'down', wander: true, wanderRadius: 1, dialog: [
      '연못 수위와 북문 통행 기록을 정리하는 회관이야. 양쪽 서가는 오래된 장부와 새 보고서를 나눠 둔 거고.',
      '가운데 열람석은 비워 뒀어. 기록을 찾는 사람이 책장 사이에 갇히면 회관 설계부터 틀린 거잖아.',
    ] },
  },
  stoneworkshop: {
    name: '스톤게이트 석공 작업실', tileset: 'stone_workshop',
    resident: { id: 'stone_forewoman', x: 12, y: 7, kind: 'hiker', facing: 'left', wander: true, wanderRadius: 1, dialog: [
      '왼쪽 원석은 다듬기 전, 오른쪽 도면대는 납품 전이야. 가운데 장비 통로에는 아무것도 쌓지 않아.',
      '바위가 많다고 아무 데나 놓으면 작업실이 아니라 장애물 코스가 되거든.',
    ] },
  },
  gearworkshop: {
    name: '브라이트기어 수리 공방', tileset: 'gear_workshop',
    resident: { id: 'gear_repairer', x: 16, y: 6, kind: 'villager', facing: 'left', wander: true, wanderRadius: 1, dialog: [
      '북쪽은 진단 장비, 서쪽은 부품 선반, 남쪽은 상담 벤치야. 수리 동선이 서로 겹치지 않게 나눴지.',
      '자전거가 빨라도 정비가 엉망이면 결국 걷게 돼. 체인 소리가 거칠면 여기로 가져와.',
    ] },
  },
  gearhome: {
    name: '브라이트기어 기술자 주택', tileset: 'gear_residence',
    resident: { id: 'gear_tenant', x: 12, y: 7, kind: 'villager2', facing: 'left', wander: true, wanderRadius: 1, dialog: [
      '작은 집이라 부엌, 침실, 거실을 세 구역으로 딱 나눴어. 넓기만 한 방보다 훨씬 편해.',
      '공방에서 돌아오면 여기서는 기계를 안 만져. 텔레비전 소리만큼은 고칠 필요가 없거든.',
    ] },
  },
  bloomnursery: {
    name: '에버블룸 서쪽 온실', tileset: 'bloom_nursery',
    resident: { id: 'bloom_nursery_keeper', x: 10, y: 6, kind: 'picnic', facing: 'down', wander: true, wanderRadius: 1, dialog: [
      '북쪽은 묘목, 양쪽 작업대는 분갈이 구역이야. 출입구까지 이어지는 가운데 길에는 화분을 두지 않아.',
      '식물이 많아도 정돈되어야 온실이지. 햇빛과 사람 동선을 같이 살펴야 해.',
    ] },
  },
  bloomstudy: {
    name: '에버블룸 식물 연구가의 집', tileset: 'bloom_study',
    resident: { id: 'bloom_reader', x: 14, y: 7, kind: 'villager', facing: 'left', wander: true, wanderRadius: 1, dialog: [
      '여긴 온실이 아니라 연구자의 집이야. 표본 책상과 서재는 위쪽, 침실과 휴식 공간은 아래쪽에 뒀어.',
      '같은 꽃 마을 건물이어도 사는 곳과 기르는 곳은 구조가 달라야 편하지.',
    ] },
  },
};
for (const [id, spec] of Object.entries(ORDINARY_INTERIOR_SPECS)) {
  MAPS[id] = {
    bgm: 'home', name: spec.name, tileset: spec.tileset,
    rows: ['wwwwww', 'w____w', 'w____w', 'w_m__w', 'wwwwww'],
    warps: {}, signs: {}, npcs: [spec.resident],
  };
}

const ORDINARY_BUILDING_DOORS = [
  ['hometown', 5, 6, 'willowworkshop'], ['hometown', 20, 6, 'willowhall'],
  ['stonegate', 27, 7, 'stoneworkshop'],
  ['brightgear', 6, 8, 'gearworkshop'], ['brightgear', 30, 8, 'gearhome'],
  ['everbloom', 7, 14, 'bloomnursery'], ['everbloom', 30, 14, 'bloomstudy'],
];
for (const [mapId, x, y, interiorId] of ORDINARY_BUILDING_DOORS) {
  const m = MAPS[mapId];
  const key = `${x},${y}`;
  if (!m || !m.rows[y] || x < 0 || x >= m.rows[y].length) continue;
  m.rows[y] = m.rows[y].slice(0, x) + 'D' + m.rows[y].slice(x + 1);
  if (!m.warps[key]) m.warps[key] = { map: interiorId, x: 3, y: 2, facing: 'up' };
}
MAPS.hometown.rows[23] = MAPS.hometown.rows[23].slice(0, 6) + 'D' + MAPS.hometown.rows[23].slice(7);
MAPS.hometown.rows[23] = MAPS.hometown.rows[23].slice(0, 22) + 'D' + MAPS.hometown.rows[23].slice(23);
MAPS.hometown.warps['6,23'] = { map: 'house', x: 4, y: 5, facing: 'up' };
MAPS.hometown.warps['27,17'] = { map: 'rexhouse', x: 5, y: 4, facing: 'up' };
MAPS.hometown.warps['22,23'] = { map: 'lab', x: 5, y: 6, facing: 'up' };

// Add small, walkable set pieces to the larger towns. These are deliberately
// placed only on open floor so the established roads, doors, NPCs, and puzzle
// spaces keep their original routes while each town gets a distinct visual
// rhythm instead of a huge uninterrupted rectangle.
function paintTownDecor(mapId, placements) {
  const m = MAPS[mapId];
  if (!m) return;
  const occupied = new Set([
    ...Object.keys(m.warps || {}),
    ...(m.npcs || []).map(npc => `${npc.x},${npc.y}`),
  ]);
  for (const [x, y, ch] of placements) {
    if (!m.rows[y] || occupied.has(`${x},${y}`)) continue;
    const old = m.rows[y][x];
    if (!['.', ',', ':', '=', 'q'].includes(old)) continue;
    if (ch === 'T' && occupied.has(`${x},${y - 1}`)) continue;
    const row = m.rows[y].split('');
    row[x] = ch;
    m.rows[y] = row.join('');
  }
}

paintTownDecor('stonegate', [
  [3, 5, 'F'], [11, 5, 'F'], [38, 5, 'F'],
  [3, 12, 'A'], [38, 12, 'A'], [3, 15, 'O'], [38, 15, 'O'],
  [14, 16, 'F'], [27, 16, 'F'], [4, 25, 'A'], [37, 25, 'A'],
]);
paintTownDecor('lakeglass', [
  [3, 1, 'F'], [25, 1, 'F'], [37, 1, 'F'],
  [3, 27, 'F'], [37, 27, 'F'], [12, 31, 'F'], [29, 31, 'F'],
  [10, 30, 'T'], [31, 30, 'T'],
]);
paintTownDecor('brightgear', [
  [3, 1, 'F'], [43, 1, 'F'], [3, 12, 'A'], [44, 12, 'A'],
  [11, 29, 'F'], [36, 29, 'F'], [4, 2, 'T'], [43, 2, 'T'],
]);
paintTownDecor('everbloom', [
  [3, 2, 'F'], [46, 2, 'F'], [12, 16, 'F'], [37, 16, 'F'],
  [11, 29, 'F'], [37, 29, 'F'], [12, 3, 'T'], [37, 3, 'T'],
  [12, 32, 'T'], [37, 32, 'T'],
]);

// Give each interior family a coherent floor. Gyms deliberately use distinct
// supplied floor sets so a rock arena, pool course, machine room, and greenhouse
// no longer look like the same house with different obstacles.
MAPS.bedroom.tileset = 'bedroom_home';
MAPS.house.tileset = 'family_home';
MAPS.rexhouse.tileset = 'rival_home';
MAPS.guesthouse.tileset = 'interior';
MAPS.lab.tileset = 'lab';
MAPS.gym.tileset = 'stone_gym';
MAPS.tidegym.tileset = 'tide_gym';
MAPS.circuitgym.tileset = 'circuit_gym';
MAPS.mirrorgym.tileset = 'garden_gym';
for (const id of ['healstone', 'healglass', 'healgear', 'healbloom']) {
  MAPS[id].tileset = 'pokemon_center';
}
for (const id of ['shop1', 'shop2', 'shopgear', 'shopbloom']) {
  MAPS[id].tileset = 'mart';
}

// Interior layouts are built from explicit anchors instead of hand-counted
// strings. That keeps every room the same readable shape: a solid wall frame,
// a clear central aisle, and furniture grouped along the edges. The footprint
// list is also consumed by mapTileIsSolid so tall supplied art is not
// walk-through decoration.
function setInteriorRoom(id, width, height, placements) {
  const m = MAPS[id];
  const cells = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) =>
      x === 0 || y === 0 || x === width - 1 || y === height - 1 ? 'w' : '_'));
  for (const [x, y, ch] of placements) {
    if (x <= 0 || y <= 0 || x >= width - 1 || y >= height - 1) {
      throw new Error(`${id} interior furniture ${ch} is outside the room`);
    }
    cells[y][x] = ch;
  }
  m.rows = cells.map(row => row.join(''));
  m.furniture = placements
    .filter(([, , ch]) => INTERIOR_FURNITURE_FOOTPRINTS[ch])
    .map(([x, y, ch]) => ({ x, y, ch }));
}

// Every home now has a readable purpose. The bedroom is for sleeping/studying;
// downstairs is a living/dining/kitchen floor (no random bed), and Rex's home
// keeps a private sleep corner and a separate social area.
setInteriorRoom('bedroom', 14, 10, [
  [12, 2, 'h'], [1, 1, 'B'], [4, 1, 'b'], [7, 1, 'V'],
  [1, 5, 'd'], [5, 5, 'p'],
]);
setInteriorRoom('house', 14, 10, [
  [12, 2, 'h'], [1, 1, 'K'], [6, 1, 'V'], [1, 4, 'b'],
  [5, 4, 'n'], [9, 6, 'd'], [3, 7, 'p'], [7, 8, 'm'],
]);
setInteriorRoom('rexhouse', 18, 12, [
  [2, 2, 'b'], [6, 2, 'V'], [10, 2, 'K'], [15, 2, 'p'],
  [2, 6, 'B'], [6, 6, 'n'], [11, 6, 'd'], [9, 10, 'm'],
]);

// The laboratory has a central briefing lane, two complete research consoles,
// reference shelves, three evenly spaced ball pedestals, and a clear inspection
// tile below every candidate. Each pedestal maps to exactly one starter.
setInteriorRoom('lab', 22, 16, [
  [2, 2, 'b'], [5, 2, 'J'], [8, 2, 'V'], [11, 2, 'V'],
  [15, 2, 'J'], [18, 2, 'b'], [20, 2, 'p'],
  [7, 9, '1'], [11, 9, '2'], [15, 9, '3'],
  [3, 11, 'd'], [18, 10, 'J'], [2, 12, 'p'],
  [7, 12, 'n'], [12, 12, 's'], [19, 13, 'P'], [11, 14, 'm'],
]);
setInteriorRoom('guesthouse', 18, 12, [
  [2, 2, 'B'], [5, 2, 'b'], [9, 2, 'V'], [15, 2, 'p'],
  [11, 5, 'd'], [5, 7, 'n'], [10, 8, 's'], [9, 10, 'm'],
]);

// Seven ordinary exteriors receive seven purpose-built rooms. Sizes, palette,
// furniture zones, residents, and exits are intentionally different; only the
// common doorway mat is shared as part of the game's architectural language.
const ORDINARY_INTERIOR_LAYOUTS = {
  willowworkshop: {
    size: [16, 11], outside: ['hometown', 5, 7], exit: [8, 9], resident: [13, 7],
    purpose: 'pond-bridge carpenter workshop', required: ['b', 'J', 'd', 'n', 's', 'p', 'm'],
    placements: [
      [2, 2, 'b'], [5, 2, 'd'], [10, 2, 'J'], [13, 2, 'p'],
      [2, 6, 's'], [8, 6, 'n'], [8, 9, 'm'],
    ],
  },
  willowhall: {
    size: [20, 13], outside: ['hometown', 20, 7], exit: [10, 11], resident: [10, 6],
    purpose: 'village archive and public reading hall', required: ['b', 'V', 'd', 'n', 's', 'p', 'm'],
    placements: [
      [2, 2, 'b'], [5, 2, 'd'], [9, 2, 'V'], [15, 2, 'b'], [18, 2, 'p'],
      [3, 7, 'n'], [12, 7, 's'], [10, 11, 'm'],
    ],
  },
  stoneworkshop: {
    size: [18, 12], outside: ['stonegate', 27, 8], exit: [9, 10], resident: [12, 7],
    purpose: 'stonecutting floor with raw-material and drafting zones', required: ['O', 'b', 'J', 'd', 's', 'p', 'm'],
    placements: [
      [2, 2, 'O'], [4, 2, 'O'], [7, 2, 'J'], [11, 2, 'd'], [15, 2, 'b'],
      [2, 7, 's'], [7, 7, 'O'], [14, 7, 'p'], [9, 10, 'm'],
    ],
  },
  gearworkshop: {
    size: [20, 13], outside: ['brightgear', 6, 9], exit: [10, 11], resident: [16, 6],
    purpose: 'bicycle diagnostics and repair workshop', required: ['b', 'G', 'J', 'Y', 'V', 'd', 's', 'p', 'm'],
    placements: [
      [2, 2, 'J'], [6, 2, 'G'], [11, 2, 'd'], [17, 2, 'p'],
      [2, 7, 'b'], [6, 7, 's'], [12, 7, 'V'], [15, 7, 'Y'], [10, 11, 'm'],
    ],
  },
  gearhome: {
    size: [16, 12], outside: ['brightgear', 30, 9], exit: [8, 10], resident: [12, 7],
    purpose: 'compact technician studio residence', required: ['B', 'b', 'K', 'V', 'n', 'p', 'm'],
    placements: [
      [1, 2, 'K'], [6, 2, 'V'], [10, 2, 'b'], [13, 2, 'p'],
      [2, 7, 'B'], [6, 7, 'n'], [8, 10, 'm'],
    ],
  },
  bloomnursery: {
    size: [22, 14], outside: ['everbloom', 7, 15], exit: [11, 12], resident: [10, 6],
    purpose: 'seedling nursery and repotting greenhouse', required: ['b', 'K', 'd', 'p', 'm'],
    placements: [
      [2, 2, 'p'], [4, 2, 'p'], [6, 2, 'p'], [9, 2, 'K'], [17, 2, 'b'],
      [2, 8, 'd'], [7, 8, 'p'], [11, 8, 'p'], [15, 8, 'd'], [11, 12, 'm'],
    ],
  },
  bloomstudy: {
    size: [18, 12], outside: ['everbloom', 30, 15], exit: [9, 10], resident: [14, 7],
    purpose: 'botanist residence with separated study and sleep zones', required: ['B', 'b', 'V', 'd', 'n', 'p', 'm'],
    placements: [
      [2, 2, 'b'], [5, 2, 'd'], [10, 2, 'V'], [14, 2, 'p'],
      [2, 7, 'B'], [6, 7, 'n'], [13, 7, 'p'], [9, 10, 'm'],
    ],
  },
};
for (const [id, layout] of Object.entries(ORDINARY_INTERIOR_LAYOUTS)) {
  setInteriorRoom(id, layout.size[0], layout.size[1], layout.placements);
  const [exitX, exitY] = layout.exit;
  const [outside, outsideX, outsideY] = layout.outside;
  MAPS[id].warps = {
    [`${exitX},${exitY}`]: { map: outside, x: outsideX, y: outsideY, facing: 'down' },
  };
  const resident = MAPS[id].npcs[0];
  resident.x = layout.resident[0]; resident.y = layout.resident[1];
}

// Keep both home transitions against architectural edges. The supplied flight
// is entered at its lower-right step; the complete threshold mat is below.
MAPS.bedroom.warps = { '12,2': { map: 'house', x: 12, y: 3, facing: 'down' } };
MAPS.house.warps = {
  '12,2': { map: 'bedroom', x: 12, y: 3, facing: 'down' },
  '7,8': { map: 'hometown', x: 6, y: 24, facing: 'down' },
};
MAPS.rexhouse.warps = { '9,10': { map: 'hometown', x: 27, y: 18, facing: 'down' } };
MAPS.lab.warps = { '11,14': { map: 'hometown', x: 22, y: 24, facing: 'down' } };
MAPS.guesthouse.warps = {
  '9,10': { map: 'hometown', x: 6, y: 24, facing: 'down', returnWarp: true },
};

// Service buildings share their recognizable machine/shelf language, but not
// a cloned room. Each town has a deliberate identity and a clear front aisle:
// stone = orderly symmetry, lake = broad lounge, gear = technical equipment,
// bloom = plant-lined waiting room.
const CENTER_LAYOUTS = {
  healstone: {
    size: [20, 14], outside: ['stonegate', 6, 22], exit: [10, 12], pc: [17, 4],
    nurse: [10, 4], guest: [14, 5],
    placements: [
      [8, 1, 'H'], [2, 2, 'p'], [17, 4, 'P'],
      [3, 7, 'n'], [12, 7, 'n'], [7, 9, 's'], [17, 8, 'p'], [10, 12, 'm'],
    ],
  },
  healglass: {
    size: [22, 15], outside: ['lakeglass', 6, 23], exit: [11, 13], pc: [19, 4],
    nurse: [11, 4], guest: [17, 9],
    placements: [
      [9, 1, 'H'], [2, 2, 'p'], [19, 4, 'P'],
      [3, 6, 'n'], [7, 6, 's'], [13, 6, 'n'], [17, 7, 'V'],
      [3, 10, 'p'], [8, 10, 's'], [13, 10, 'n'], [11, 13, 'm'],
    ],
  },
  healgear: {
    size: [18, 15], outside: ['brightgear', 6, 25], exit: [9, 13], pc: [15, 4],
    nurse: [9, 4], guest: [13, 9],
    placements: [
      [7, 1, 'H'], [2, 2, 'J'], [15, 4, 'P'], [2, 6, 'J'],
      [6, 7, 'n'], [12, 7, 'V'], [5, 10, 's'], [15, 10, 'p'], [9, 13, 'm'],
    ],
  },
  healbloom: {
    size: [22, 15], outside: ['everbloom', 7, 27], exit: [11, 13], pc: [19, 4],
    nurse: [11, 4], guest: [17, 9],
    placements: [
      [9, 1, 'H'], [2, 2, 'p'], [19, 4, 'P'], [19, 6, 'p'],
      [3, 6, 'n'], [8, 6, 's'], [13, 6, 'n'],
      [3, 10, 'p'], [5, 10, 's'], [11, 10, 'n'], [19, 10, 'p'], [11, 13, 'm'],
    ],
  },
};
for (const [id, layout] of Object.entries(CENTER_LAYOUTS)) {
  setInteriorRoom(id, layout.size[0], layout.size[1], layout.placements);
  const [outside, outsideX, outsideY] = layout.outside;
  const [exitX, exitY] = layout.exit;
  MAPS[id].warps = { [`${exitX},${exitY}`]: { map: outside, x: outsideX, y: outsideY, facing: 'down' } };
  MAPS[id].pcs = { [`${layout.pc[0]},${layout.pc[1]}`]: true };
  const nurse = MAPS[id].npcs.find(npc => npc.special === 'nurse');
  if (nurse) {
    nurse.x = layout.nurse[0]; nurse.y = layout.nurse[1];
    nurse.facing = 'down'; nurse.wander = false;
  }
  for (const npc of MAPS[id].npcs) {
    if (npc.special !== 'nurse') { npc.x = layout.guest[0]; npc.y = layout.guest[1]; npc.facing = 'left'; }
  }
}

// The four shops likewise use distinct retail plans: parallel general aisles,
// an open lakeside browsing floor, a compact machine-parts counter, and a
// plant boutique with a social bench. Checkout geometry stays consistent so
// the clerk is always behind the counter and the player approaches from below.
const SHOP_LAYOUTS = {
  shop1: {
    size: [20, 13], outside: ['stonegate', 34, 22], exit: [10, 11], counter: [16, 5],
    placements: [
      [2, 2, 'G'], [6, 2, 'G'], [10, 2, 'G'], [16, 5, 'k'],
      [2, 6, 'G'], [6, 6, 'G'], [5, 9, 's'], [17, 8, 'p'], [10, 11, 'm'],
    ],
  },
  shop2: {
    size: [22, 14], outside: ['lakeglass', 34, 23], exit: [11, 12], counter: [18, 6],
    placements: [
      [2, 2, 'G'], [6, 2, 'G'], [2, 6, 'G'], [6, 6, 'G'], [18, 6, 'k'],
      [11, 3, 'V'], [12, 8, 'n'], [5, 10, 's'], [19, 9, 'p'], [11, 12, 'm'],
    ],
  },
  shopgear: {
    size: [18, 14], outside: ['brightgear', 41, 25], exit: [9, 12], counter: [14, 7],
    placements: [
      [2, 2, 'G'], [6, 2, 'G'], [10, 2, 'G'], [2, 6, 'J'], [6, 7, 'G'],
      [14, 7, 'k'], [10, 10, 'V'], [2, 10, 'p'], [5, 10, 's'], [9, 12, 'm'],
    ],
  },
  shopbloom: {
    size: [22, 15], outside: ['everbloom', 42, 27], exit: [11, 13], counter: [18, 7],
    placements: [
      [2, 2, 'G'], [6, 2, 'G'], [10, 2, 'p'], [19, 2, 'p'],
      [2, 6, 'G'], [6, 6, 'G'], [18, 7, 'k'], [13, 8, 'p'],
      [5, 11, 's'], [10, 10, 'n'], [19, 10, 'p'], [11, 13, 'm'],
    ],
  },
};
for (const [id, layout] of Object.entries(SHOP_LAYOUTS)) {
  setInteriorRoom(id, layout.size[0], layout.size[1], layout.placements);
  const [outside, outsideX, outsideY] = layout.outside;
  const [exitX, exitY] = layout.exit;
  MAPS[id].warps = { [`${exitX},${exitY}`]: { map: outside, x: outsideX, y: outsideY, facing: 'down' } };
  const clerk = MAPS[id].npcs.find(npc => npc.special === 'shop');
  if (clerk) {
    clerk.x = layout.counter[0]; clerk.y = layout.counter[1] - 1;
    clerk.facing = 'down'; clerk.wander = false;
  }
}

// Update the matching exterior doors to the new lower entrance landings.
const CENTER_EXTERIORS = [
  ['healstone', 'stonegate', '6,21', 10, 11], ['healglass', 'lakeglass', '6,21', 11, 12],
  ['healgear', 'brightgear', '6,23', 9, 12], ['healbloom', 'everbloom', '7,23', 11, 12],
];
for (const [inside, outside, key, x, y] of CENTER_EXTERIORS) {
  MAPS[outside].warps[key] = { map: inside, x, y, facing: 'up' };
}
const SHOP_EXTERIORS = [
  ['shop1', 'stonegate', '27,21', 10, 10], ['shop2', 'lakeglass', '27,21', 11, 11],
  ['shopgear', 'brightgear', '30,23', 9, 11], ['shopbloom', 'everbloom', '31,23', 11, 12],
];
for (const [inside, outside, key, x, y] of SHOP_EXTERIORS) {
  MAPS[outside].warps[key] = { map: inside, x, y, facing: 'up' };
}

const labProfessor = MAPS.lab.npcs.find(npc => npc.id === 'prof');
if (labProfessor) { labProfessor.x = 11; labProfessor.y = 5; labProfessor.wander = false; }
const labRival = MAPS.lab.npcs.find(npc => npc.id === 'rex');
if (labRival) { labRival.x = 17; labRival.y = 6; labRival.wander = false; }
const rexAunt = MAPS.rexhouse.npcs.find(npc => npc.id === 'aunt');
if (rexAunt) { rexAunt.x = 15; rexAunt.y = 6; }
const playerMother = MAPS.house.npcs.find(npc => npc.id === 'mom');
if (playerMother) { playerMother.x = 9; playerMother.y = 3; playerMother.facing = 'right'; }
const guestResident = MAPS.guesthouse.npcs.find(npc => npc.id === 'guest_resident');
if (guestResident) { guestResident.x = 15; guestResident.y = 7; guestResident.facing = 'left'; }

// Exterior doors land one step inside their matching exit mat. Keep these
// destinations next to the door instead of dropping the player in an arbitrary
// corner of the room.
MAPS.hometown.warps['6,23'] = { map: 'house', x: 7, y: 7, facing: 'up' };
MAPS.hometown.warps['27,17'] = { map: 'rexhouse', x: 9, y: 9, facing: 'up' };
MAPS.hometown.warps['22,23'] = { map: 'lab', x: 11, y: 13, facing: 'up' };
for (const [mapId, x, y, interiorId] of ORDINARY_BUILDING_DOORS) {
  const warp = MAPS[mapId].warps[`${x},${y}`];
  const layout = ORDINARY_INTERIOR_LAYOUTS[interiorId];
  if (warp && layout && warp.map === interiorId) {
    warp.x = layout.exit[0]; warp.y = layout.exit[1] - 1; warp.facing = 'up';
  }
}

// A room plan makes the intended use of every non-outdoor map explicit. The
// validator checks these required set pieces after all overrides, preventing a
// future visual pass from turning a bedroom into a shelf warehouse or deleting
// the laboratory's starter area while rearranging furniture.
const INTERIOR_ROOM_PLANS = {
  bedroom: { purpose: 'sleep and study', required: ['B', 'b', 'V', 'd', 'h'] },
  house: { purpose: 'compact family living, dining, and kitchen', required: ['V', 'b', 'K', 'd', 'n', 'p', 'h', 'm'] },
  rexhouse: { purpose: 'rival family home', required: ['B', 'b', 'V', 'K', 'd', 'n', 'p', 'm'] },
  lab: { purpose: 'research and starter selection', required: ['b', 'J', 'V', '1', '2', '3', 'P', 'd', 'n', 's', 'p', 'm'] },
  healstone: { purpose: 'symmetrical stone-town healing hall', required: ['H', 'P', 'n', 's', 'p', 'm'] },
  healglass: { purpose: 'wide lakeside healing lounge', required: ['H', 'P', 'V', 'n', 's', 'p', 'm'] },
  healgear: { purpose: 'technical healing and diagnostics bay', required: ['H', 'P', 'J', 'V', 'n', 's', 'p', 'm'] },
  healbloom: { purpose: 'plant-lined healing lounge', required: ['H', 'P', 'n', 's', 'p', 'm'] },
  shop1: { purpose: 'parallel general-goods aisles and checkout', required: ['G', 'k', 's', 'p', 'm'] },
  shop2: { purpose: 'open lakeside browsing floor', required: ['G', 'k', 'V', 'n', 's', 'p', 'm'] },
  shopgear: { purpose: 'compact machine-parts retail floor', required: ['G', 'J', 'k', 'V', 's', 'p', 'm'] },
  shopbloom: { purpose: 'plant boutique and social bench', required: ['G', 'k', 'n', 's', 'p', 'm'] },
  gym: { purpose: 'rock obstacle arena', required: ['O', 'm'] },
  echocave: { purpose: 'push-block cave route', required: ['O', 's'] },
  tidegym: { purpose: 'water-flow valve arena', required: ['W', 'j', 'l', 'm'] },
  circuitgym: { purpose: 'breaker and barrier arena', required: ['O', 'z', 'e', 'm'] },
  mistworks: { purpose: 'waterside observation base', required: ['O', 's', 'W'] },
  mirrorgym: { purpose: 'greenhouse warp arena', required: ['O', 'F', 'm'] },
  guesthouse: { purpose: 'legacy traveller room for save compatibility', required: ['B', 'b', 'V', 'd', 'n', 's', 'p', 'm'] },
};
for (const [id, layout] of Object.entries(ORDINARY_INTERIOR_LAYOUTS)) {
  INTERIOR_ROOM_PLANS[id] = { purpose: layout.purpose, required: layout.required };
}
for (const [id, plan] of Object.entries(INTERIOR_ROOM_PLANS)) MAPS[id].roomPlan = plan;
for (const m of Object.values(MAPS)) {
  if (m.outdoor) continue;
  const objects = [];
  for (let y = 0; y < m.rows.length; y++) {
    for (let x = 0; x < m.rows[y].length; x++) {
      const ch = m.rows[y][x];
      if (TILE_SRC_IN[ch] && TILE_SRC_IN[ch].object) objects.push({ x, y, ch });
    }
  }
  m.objects = objects;
}

// Every actor was matched to an inspected front frame. Do not hash a role into
// a numbered NPC pool: that previously turned nurses into elderly men, the
// professor into a chef, and hikers into unrelated residents. Explicit map/id
// assignments also keep recurring cast members visually stable.
const NPC_VISUAL_ASSIGNMENTS = {
  house: {
    mom: 'parent',
  },
  hometown: {
    hv1: 'npc03', hv2: 'npc17', hv3: 'npc08', willow_kid: 'npc02',
    willow_gardener: 'trainer_aromalady', willow_fisher: 'trainer_fisherman',
    willow_aide: 'trainer_scientist', willow_runner: 'trainer_youngster',
    willow_keeper: 'npc21',
  },
  rexhouse: {
    aunt: 'npc23',
  },
  lab: {
    prof: 'prof', rex: 'rival',
  },
  route1: {
    cal: 'trainer_youngster', mira: 'trainer_lass', route_chronicler: 'npc21',
  },
  sproutwood: {
    tami: 'picnic', ian: 'trainer_bugcatcher', sprout_guide: 'trainer_ranger_m',
    ecology_ara: 'trainer_ranger_f', mist_rookie: 'trainer_teamrocket_m',
  },
  stonegate: {
    cast_yuno: 'trainer_beauty', sv2: 'npc17', stone_mason: 'hiker', stone_child: 'npc02',
  },
  healstone: { nurse1: 'nurse' },
  shop1: { clerk1: 'clerk' },
  gym: { rocco: 'hiker', mason: 'leader_mason' },
  route2: {
    oren: 'scout', rex2: 'rival', bori: 'hiker', pass_watcher: 'npc21',
  },
  echocave: {
    cave_haru: 'hiker', cave_sena: 'trainer_ruinmaniac', cave_rest: 'trainer_ranger_m',
  },
  murmurwood: {
    lumi: 'picnic', silva: 'trainer_ranger_m', doran: 'hiker', lost_artist: 'trainer_painter',
  },
  lakeglass: {
    glass_child: 'npc08', glass_elder: 'npc11', glass_boatman: 'trainer_sailor',
    analyst_sulnun: 'trainer_scientist',
  },
  healglass: { nurse2: 'nurse', center_guest: 'npc13' },
  shop2: { clerk2: 'npc17' },
  tidegym: {
    nari: 'trainer_swimmer_f', jun: 'trainer_swimmer_m', seira: 'leader_seira',
  },
  thunderway: {
    storm_sera: 'trainer_cooltrainer_f', storm_mino: 'trainer_engineer',
    storm_han: 'trainer_cooltrainer_m', reed_guide: 'npc14',
  },
  brightgear: {
    gear_mechanic: 'trainer_engineer', gear_child: 'npc02', gear_cyclist: 'trainer_biker',
    gear_oldtech: 'npc10', reactor_ddabong: 'trainer_supernerd',
  },
  healgear: { nurse3: 'nurse', gear_guest: 'npc24' },
  shopgear: { clerk3: 'npc20' },
  circuitgym: {
    coil_arin: 'trainer_engineer', coil_dan: 'trainer_supernerd',
    coil_sol: 'trainer_scientist', toren: 'leader_toren',
  },
  highrail: {
    high_birdman: 'trainer_birdkeeper', high_rex: 'rival', high_climber: 'hiker',
    vane_keeper: 'trainer_gentleman', marathon_lookchan: 'trainer_ranger_m',
  },
  mistworks: {
    mist_grunt_a: 'trainer_teamrocket_f', mist_grunt_b: 'trainer_teamrocket_m',
    mist_grunt_c: 'trainer_teamrocket_m', mist_director: 'trainer_rocketboss',
  },
  everbloom: {
    bloom_gardener: 'trainer_aromalady', bloom_student: 'trainer_lass',
    bloom_scientist: 'trainer_scientist', bloom_cyclist: 'trainer_biker',
    bloom_elder: 'npc10',
  },
  healbloom: { nurse4: 'nurse', bloom_guest: 'npc25' },
  shopbloom: { clerk4: 'npc23' },
  mirrorgym: {
    petal_rin: 'trainer_aromalady', petal_maru: 'trainer_ranger_m',
    petal_somi: 'trainer_beauty', eloa: 'leader_eloa',
  },
  willowworkshop: { willow_carpenter: 'npc05' },
  willowhall: { willow_archivist: 'npc18' },
  stoneworkshop: { stone_forewoman: 'trainer_ruinmaniac' },
  gearworkshop: { gear_repairer: 'trainer_engineer' },
  gearhome: { gear_tenant: 'npc24' },
  bloomnursery: { bloom_nursery_keeper: 'trainer_aromalady' },
  bloomstudy: { bloom_reader: 'npc06' },
  guesthouse: { guest_resident: 'npc03' },
};
for (const [mapId, m] of Object.entries(MAPS)) {
  for (const npc of (m.npcs || [])) {
    const visual = NPC_VISUAL_ASSIGNMENTS[mapId] && NPC_VISUAL_ASSIGNMENTS[mapId][npc.id];
    if (visual) npc.visual = visual;
    if (npc.trainer || npc.quest || npc.kind === 'rival' || NPC_FIXED_SPECIALS.has(npc.special)) {
      npc.wander = false;
    }
  }
}

// ---------------------------------------------------------------------------
// Reviewed town plans
//
// Earlier city maps grew from 42x32 to 50x40 while keeping only four or five
// residents. That produced large rectangular road fields and made NPCs look
// hash-scattered. These plans keep every required service and story door, but
// build compact districts around a distinct landmark. NPC coordinates below
// are tied to those districts and to the content of their dialogue.
function makeTownCanvas(width, height, ground, border) {
  const cells = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) =>
      x === 0 || y === 0 || x === width - 1 || y === height - 1 ? border : ground));
  const set = (x, y, ch) => {
    if (cells[y] && cells[y][x] !== undefined) cells[y][x] = ch;
  };
  const rect = (x0, y0, x1, y1, ch) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, ch);
  };
  const hline = (y, x0, x1, ch) => rect(x0, y, x1, y, ch);
  const vline = (x, y0, y1, ch) => rect(x, y0, x, y1, ch);
  return { cells, set, rect, hline, vline, rows: () => cells.map(row => row.join('')) };
}

function stampTownBuilding(canvas, type, doorX, doorY) {
  const width = type === 'gym' ? 7 : 5;
  const x0 = doorX - Math.floor(width / 2);
  const roof = type === 'center' ? 'R' : type === 'mart' ? 'M' : 'r';
  for (let y = doorY - 2; y < doorY; y++) canvas.hline(y, x0, x0 + width - 1, roof);
  canvas.hline(doorY, x0, x0 + width - 1, type === 'house' ? 'r' : 'w');
  if (type === 'center') canvas.set(doorX - 1, doorY, 'c');
  if (type === 'mart') canvas.set(doorX + 1, doorY, 'g');
  canvas.set(doorX, doorY, 'D');
}

function ordinaryInteriorWarp(interiorId) {
  const layout = ORDINARY_INTERIOR_LAYOUTS[interiorId];
  return { map: interiorId, x: layout.exit[0], y: layout.exit[1] - 1, facing: 'up' };
}

function retargetInteriorExit(interiorId, outsideId, x, y) {
  for (const warp of Object.values(MAPS[interiorId].warps || {})) {
    if (warp.map === outsideId) {
      warp.x = x; warp.y = y; warp.facing = 'down';
    }
  }
}

const TOWN_LAYOUT_PLANS = {
  hometown: {
    size: [26, 22], theme: 'pond village',
    districts: ['north craft lane', 'central pond bridge', 'south family and research lane'],
  },
  stonegate: {
    size: [34, 28], theme: 'terraced quarry plaza',
    districts: ['gym and masonry lane', 'quarry practice court', 'south service street'],
  },
  lakeglass: {
    size: [34, 28], theme: 'three-bridge canal town',
    districts: ['north gym shore', 'three bridge canal', 'south promenade'],
  },
  brightgear: {
    size: [36, 30], theme: 'cooling-basin machine city',
    districts: ['upper workshop row', 'twin cooling basins', 'south service and cycle lane'],
  },
  everbloom: {
    size: [38, 30], theme: 'cross-path greenhouse garden',
    districts: ['north gym terrace', 'twin greenhouse garden', 'south service promenade'],
  },
};

// Willowbrook: five useful doors around one short loop. The pond separates the
// craft lane from the family/research lane without forcing a long detour.
{
  const c = makeTownCanvas(26, 22, ',', 'T');
  c.rect(12, 0, 13, 8, ':');
  c.hline(7, 2, 23, '=');
  c.hline(14, 2, 23, '=');
  c.vline(5, 6, 19, '=');
  c.vline(12, 12, 19, '=');
  c.vline(13, 12, 19, '=');
  c.vline(20, 6, 19, '=');
  c.rect(9, 9, 16, 12, 'W');
  c.rect(12, 9, 13, 12, 'v');
  c.hline(8, 8, 17, '=');
  c.hline(13, 8, 17, '=');
  for (const [x, y] of [[2,10],[3,10],[5,10],[2,12],[4,12],[22,10],[23,11]]) c.set(x, y, 'F');
  stampTownBuilding(c, 'house', 5, 6);
  stampTownBuilding(c, 'house', 20, 6);
  stampTownBuilding(c, 'house', 5, 18);
  stampTownBuilding(c, 'house', 12, 18);
  stampTownBuilding(c, 'center', 20, 18);
  c.set(2, 8, 's');
  c.set(17, 13, 's');
  MAPS.hometown.rows = c.rows();
  MAPS.hometown.warps = {
    '5,6': ordinaryInteriorWarp('willowworkshop'),
    '20,6': ordinaryInteriorWarp('willowhall'),
    '5,18': { map: 'house', x: 7, y: 7, facing: 'up' },
    '12,18': { map: 'rexhouse', x: 9, y: 9, facing: 'up' },
    '20,18': { map: 'lab', x: 11, y: 13, facing: 'up' },
  };
  MAPS.hometown.signs = {
    '2,8': '윌로우브룩 안내\n북쪽은 목공 거리, 남쪽은 가족 주택과 메이플 연구소다.',
    '17,13': '물빛 연못\n두 줄 나무다리가 생활 구역과 연구 구역을 잇습니다.',
  };
  MAP_DECALS.hometown = [
    { img: 'house', x0: 3, y0: 4, x1: 7, y1: 6, hue: -18 },
    { img: 'house', x0: 18, y0: 4, x1: 22, y1: 6, hue: 105 },
    { img: 'house', x0: 3, y0: 16, x1: 7, y1: 18 },
    { img: 'house', x0: 10, y0: 16, x1: 14, y1: 18, hue: 155 },
    { img: 'center', x0: 18, y0: 16, x1: 22, y1: 18 },
  ];
  MAPS.house.warps['7,8'] = { map: 'hometown', x: 5, y: 19, facing: 'down' };
  MAPS.rexhouse.warps['9,10'] = { map: 'hometown', x: 12, y: 19, facing: 'down' };
  MAPS.lab.warps['11,14'] = { map: 'hometown', x: 20, y: 19, facing: 'down' };
  MAPS.guesthouse.warps['9,10'] = { map: 'hometown', x: 5, y: 19, facing: 'down', returnWarp: true };
}

// Stonegate: a compact quarry court replaces the former full-width road slab.
{
  const c = makeTownCanvas(34, 28, 'q', 'C');
  c.rect(16, 0, 17, 27, '=');
  c.rect(2, 10, 31, 11, '=');
  c.rect(2, 22, 31, 23, '=');
  c.vline(6, 7, 23, '=');
  c.vline(27, 7, 23, '=');
  c.rect(10, 13, 23, 20, '=');
  c.rect(13, 15, 20, 18, 'q');
  for (const [x, y] of [[12,14],[21,14],[12,19],[21,19],[15,16],[19,17]]) c.set(x, y, 'O');
  for (const [x, y] of [[3,13],[30,13],[4,25],[29,25],[14,12],[20,12]]) c.set(x, y, 'F');
  stampTownBuilding(c, 'gym', 6, 7);
  stampTownBuilding(c, 'house', 27, 7);
  stampTownBuilding(c, 'center', 6, 21);
  stampTownBuilding(c, 'mart', 27, 21);
  for (const [x, y] of [[10,8],[29,8],[2,21],[31,21],[16,20]]) c.set(x, y, 's');
  MAPS.stonegate.rows = c.rows();
  MAPS.stonegate.warps = {
    '6,7': { map: 'gym', x: 6, y: 9, facing: 'up' },
    '27,7': ordinaryInteriorWarp('stoneworkshop'),
    '6,21': { map: 'healstone', x: 10, y: 11, facing: 'up' },
    '27,21': { map: 'shop1', x: 10, y: 10, facing: 'up' },
  };
  MAPS.stonegate.signs = {
    '10,8': '스톤게이트 체육관\n관장 메이슨 — 채석장 전술을 고집하는 단단한 관장.',
    '29,8': '회색바람 석공소\n중앙 채석장의 바위와 북문을 관리합니다.',
    '2,21': '포켓몬센터', '31,21': '포켓몬마트',
    '16,20': '채석 연습장\n안쪽은 견습 석공의 타격 시험 구역입니다.',
  };
  MAP_DECALS.stonegate = [
    { img: 'house', x0: 3, y0: 5, x1: 9, y1: 7 },
    { img: 'house', x0: 25, y0: 5, x1: 29, y1: 7 },
    { img: 'center', x0: 4, y0: 19, x1: 8, y1: 21 },
    { img: 'mart', x0: 25, y0: 19, x1: 29, y1: 21 },
  ];
  retargetInteriorExit('gym', 'stonegate', 6, 8);
  retargetInteriorExit('healstone', 'stonegate', 6, 22);
  retargetInteriorExit('shop1', 'stonegate', 27, 22);
}

// Lakeglass: the water is a traversable town feature with three deliberate
// bridges, not a huge blue rectangle surrounding an empty road grid.
{
  const c = makeTownCanvas(34, 28, ',', 'T');
  c.rect(16, 0, 17, 27, '=');
  c.rect(1, 10, 32, 13, 'W');
  for (const x of [6,16,17,27]) c.vline(x, 10, 13, 'v');
  c.rect(1, 8, 32, 9, 'q');
  c.rect(1, 14, 32, 15, 'q');
  c.rect(2, 16, 31, 17, '=');
  c.rect(2, 22, 31, 23, '=');
  c.vline(6, 14, 23, '=');
  c.vline(27, 14, 23, '=');
  for (const [x, y] of [[3,18],[4,18],[29,18],[30,18],[3,25],[9,24],[24,24],[30,25]]) c.set(x, y, 'F');
  for (const [x, y] of [[3,4],[30,4],[10,6],[24,6]]) c.set(x, y, 'T');
  stampTownBuilding(c, 'gym', 17, 6);
  stampTownBuilding(c, 'center', 6, 21);
  stampTownBuilding(c, 'mart', 27, 21);
  for (const [x, y] of [[12,7],[2,21],[31,21],[22,18]]) c.set(x, y, 's');
  MAPS.lakeglass.rows = c.rows();
  MAPS.lakeglass.warps = {
    '17,6': { map: 'tidegym', x: 10, y: 16, facing: 'up' },
    '6,21': { map: 'healglass', x: 11, y: 12, facing: 'up' },
    '27,21': { map: 'shop2', x: 11, y: 11, facing: 'up' },
  };
  MAPS.lakeglass.signs = {
    '12,7': '레이크글라스 체육관\n관장 세이라 — 세 다리의 물길을 읽는 사람.',
    '2,21': '포켓몬센터', '31,21': '포켓몬마트',
    '22,18': '유리물결 산책로\n서쪽 선착장·중앙광장·동쪽 상가를 세 다리가 잇습니다.',
  };
  MAP_DECALS.lakeglass = [
    { img: 'house', x0: 14, y0: 4, x1: 20, y1: 6 },
    { img: 'center', x0: 4, y0: 19, x1: 8, y1: 21 },
    { img: 'mart', x0: 25, y0: 19, x1: 29, y1: 21 },
  ];
  retargetInteriorExit('tidegym', 'lakeglass', 17, 7);
  retargetInteriorExit('healglass', 'lakeglass', 6, 22);
  retargetInteriorExit('shop2', 'lakeglass', 27, 22);
}

// Brightgear: two cooling basins and workshop lanes split the city into
// readable mechanical districts while preserving a fast north-south route.
{
  const c = makeTownCanvas(36, 30, ',', 'C');
  c.rect(17, 0, 18, 29, '=');
  c.rect(2, 10, 33, 11, '=');
  c.rect(2, 21, 33, 22, '=');
  c.vline(6, 8, 24, '=');
  c.vline(30, 8, 24, '=');
  c.rect(11, 13, 14, 18, 'W');
  c.rect(21, 13, 24, 18, 'W');
  c.hline(16, 11, 14, 'v');
  c.hline(16, 21, 24, 'v');
  for (const [x, y] of [[10,13],[15,13],[10,18],[15,18],[20,13],[25,13],[20,18],[25,18]]) c.set(x, y, 'O');
  c.hline(26, 8, 14, 'f'); c.hline(26, 22, 28, 'f');
  for (const [x, y] of [[9,27],[11,27],[13,27],[23,27],[25,27],[27,27]]) c.set(x, y, 'F');
  stampTownBuilding(c, 'gym', 18, 7);
  stampTownBuilding(c, 'house', 6, 8);
  stampTownBuilding(c, 'house', 30, 8);
  stampTownBuilding(c, 'center', 6, 23);
  stampTownBuilding(c, 'mart', 30, 23);
  for (const [x, y] of [[13,9],[22,9],[2,23],[33,23],[16,19],[26,19]]) c.set(x, y, 's');
  MAPS.brightgear.rows = c.rows();
  MAPS.brightgear.warps = {
    '18,7': { map: 'circuitgym', x: 11, y: 20, facing: 'up' },
    '6,8': ordinaryInteriorWarp('gearworkshop'),
    '30,8': ordinaryInteriorWarp('gearhome'),
    '6,23': { map: 'healgear', x: 9, y: 12, facing: 'up' },
    '30,23': { map: 'shopgear', x: 9, y: 11, facing: 'up' },
  };
  MAPS.brightgear.signs = {
    '13,9': '서부 정비소\n냉각 수로와 자전거를 수리합니다.',
    '22,9': '브라이트기어 체육관\n관장 토렌 — 중앙 전력로 북쪽.',
    '2,23': '포켓몬센터', '33,23': '포켓몬마트',
    '16,19': '제1 냉각조', '26,19': '제2 냉각조·반응기 점검 구역',
  };
  MAP_DECALS.brightgear = [
    { img: 'house', x0: 15, y0: 5, x1: 21, y1: 7, hue: 48 },
    { img: 'house', x0: 4, y0: 6, x1: 8, y1: 8, hue: -18 },
    { img: 'house', x0: 28, y0: 6, x1: 32, y1: 8, hue: 135 },
    { img: 'center', x0: 4, y0: 21, x1: 8, y1: 23 },
    { img: 'mart', x0: 28, y0: 21, x1: 32, y1: 23 },
  ];
  retargetInteriorExit('circuitgym', 'brightgear', 18, 8);
  retargetInteriorExit('healgear', 'brightgear', 6, 24);
  retargetInteriorExit('shopgear', 'brightgear', 30, 24);
}

// Everbloom: two greenhouses face a fenced cross garden. The final city is
// still the broadest town, but every open tile belongs to a visible district.
{
  const c = makeTownCanvas(38, 30, ',', 'T');
  c.rect(18, 0, 19, 29, '=');
  c.rect(5, 8, 32, 9, '=');
  c.rect(5, 14, 32, 15, '=');
  c.rect(3, 24, 34, 25, '=');
  c.vline(7, 14, 25, '=');
  c.vline(30, 14, 25, '=');
  c.rect(11, 10, 26, 19, ',');
  c.hline(10, 11, 26, 'f'); c.hline(19, 11, 26, 'f');
  c.vline(11, 10, 19, 'f'); c.vline(26, 10, 19, 'f');
  c.rect(18, 10, 19, 19, '=');
  c.rect(11, 14, 26, 15, '=');
  c.rect(15, 12, 22, 17, 'W');
  c.rect(18, 12, 19, 17, 'v');
  for (const [x, y] of [[13,12],[13,14],[13,17],[24,12],[24,15],[24,17],[9,11],[28,11],[4,27],[33,27]]) c.set(x, y, 'F');
  stampTownBuilding(c, 'gym', 19, 6);
  stampTownBuilding(c, 'house', 7, 14);
  stampTownBuilding(c, 'house', 30, 14);
  stampTownBuilding(c, 'center', 7, 23);
  stampTownBuilding(c, 'mart', 31, 23);
  for (const [x, y] of [[14,7],[23,7],[3,23],[35,23],[27,17]]) c.set(x, y, 's');
  // The southern connection uses the softer garden path texture.
  c.rect(18, 26, 19, 29, ':');
  MAPS.everbloom.rows = c.rows();
  MAPS.everbloom.warps = {
    '19,6': { map: 'mirrorgym', x: 13, y: 20, facing: 'up' },
    '7,14': ordinaryInteriorWarp('bloomnursery'),
    '30,14': ordinaryInteriorWarp('bloomstudy'),
    '7,23': { map: 'healbloom', x: 11, y: 12, facing: 'up' },
    '31,23': { map: 'shopbloom', x: 11, y: 12, facing: 'up' },
  };
  MAPS.everbloom.signs = {
    '14,7': '에버블룸 체육관\n관장 엘로아 — 북쪽 온실 테라스.',
    '23,7': '쌍둥이 온실\n서쪽은 재배, 동쪽은 관찰 기록을 담당합니다.',
    '3,23': '포켓몬센터', '35,23': '포켓몬마트',
    '27,17': '중앙 교차정원\n다리와 십자 산책로는 남문까지 이어집니다.',
  };
  MAP_DECALS.everbloom = [
    { img: 'house', x0: 16, y0: 4, x1: 22, y1: 6, hue: 92 },
    { img: 'house', x0: 5, y0: 12, x1: 9, y1: 14, hue: 28 },
    { img: 'house', x0: 28, y0: 12, x1: 32, y1: 14, hue: 150 },
    { img: 'center', x0: 5, y0: 21, x1: 9, y1: 23 },
    { img: 'mart', x0: 29, y0: 21, x1: 33, y1: 23 },
  ];
  retargetInteriorExit('mirrorgym', 'everbloom', 19, 7);
  retargetInteriorExit('healbloom', 'everbloom', 7, 24);
  retargetInteriorExit('shopbloom', 'everbloom', 31, 24);
}

for (const [id, plan] of Object.entries(TOWN_LAYOUT_PLANS)) MAPS[id].townPlan = plan;

// Every placement states why the actor is there. Mobile residents only roam
// within their own work/social zone; story and quest actors remain fixed at a
// landmark the player can describe and find again.
const TOWN_NPC_PLACEMENTS = {
  hometown: {
    hv1: [8, 8, 'left', true, 1, 'north craft-lane neighbour'],
    hv2: [8, 15, 'down', true, 1, 'family-lane type tutor'],
    hv3: [18, 8, 'down', true, 1, 'pond-noise witness by town hall'],
    willow_kid: [10, 7, 'right', true, 2, 'central loop runner'],
    willow_gardener: [4, 11, 'right', true, 1, 'west flower-bed caretaker'],
    willow_fisher: [8, 10, 'right', true, 1, 'west pond angler'],
    willow_aide: [23, 16, 'left', true, 1, 'laboratory field aide'],
    willow_runner: [13, 3, 'down', true, 2, 'north-gate route runner'],
    willow_keeper: [18, 11, 'left', false, 0, 'pond story marker'],
  },
  stonegate: {
    cast_yuno: [11, 18, 'right', false, 0, 'quarry match-analysis board'],
    sv2: [9, 22, 'left', true, 1, 'healing-center visitor'],
    stone_mason: [27, 10, 'up', true, 1, 'masonry workshop forecourt'],
    stone_child: [17, 16, 'right', true, 2, 'north-south road runner'],
  },
  lakeglass: {
    glass_child: [17, 15, 'down', true, 2, 'central bridge child'],
    glass_elder: [23, 18, 'left', true, 1, 'south promenade elder'],
    glass_boatman: [5, 9, 'down', true, 1, 'west landing boatman'],
    analyst_sulnun: [31, 24, 'left', false, 0, 'mart-side observation desk'],
  },
  brightgear: {
    gear_mechanic: [8, 11, 'up', true, 1, 'west repair-shop mechanic'],
    gear_child: [23, 9, 'left', true, 2, 'gym-side errand child'],
    gear_cyclist: [18, 25, 'up', true, 3, 'south cycle-test lane'],
    gear_oldtech: [16, 18, 'left', false, 0, 'first cooling-basin technician'],
    reactor_ddabong: [26, 18, 'left', false, 0, 'second reactor quest station'],
  },
  everbloom: {
    bloom_gardener: [10, 15, 'right', true, 1, 'west greenhouse gardener'],
    bloom_student: [27, 15, 'left', true, 2, 'east greenhouse student'],
    bloom_scientist: [19, 20, 'down', false, 0, 'central garden archive scientist'],
    bloom_cyclist: [13, 25, 'right', true, 2, 'south promenade cyclist'],
    bloom_elder: [27, 24, 'left', true, 1, 'garden-market elder'],
  },
};

for (const [mapId, placements] of Object.entries(TOWN_NPC_PLACEMENTS)) {
  for (const npc of MAPS[mapId].npcs || []) {
    const placement = placements[npc.id];
    if (!placement) continue;
    const [x, y, facing, wander, wanderRadius, placementRole] = placement;
    npc.x = x; npc.y = y; npc.facing = facing;
    npc.wander = wander; npc.wanderRadius = wanderRadius;
    npc.placementRole = placementRole;
  }
}
