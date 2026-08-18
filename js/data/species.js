// ===== Species data: National Dex #001-#020, Gen 3 stats =====
// base: [hp, atk, def, spa, spd, spe]
// catchRate: 0-255. expYield: Gen 3 base experience.
// learnset: FireRed level-up moves (trimmed to the implemented move pool).
// All blurb text is original flavor writing.
const SPECIES = {
  // --- Bulbasaur line ---
  bulbasaur: {
    name: '이상해씨', types: ['GRASS', 'POISON'], base: [45, 49, 49, 65, 65, 45],
    catchRate: 45, expYield: 64,
    evolve: { at: 16, to: 'ivysaur' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 4, move: 'growl' },
      { lv: 7, move: 'leechseed' }, { lv: 10, move: 'vinewhip' },
      { lv: 15, move: 'poisonpowder' }, { lv: 15, move: 'sleeppowder' },
      { lv: 20, move: 'razorleaf' }, { lv: 25, move: 'sweetscent' },
      { lv: 32, move: 'growth' },
    ],
    blurb: '등의 씨앗은 햇빛을 마시며 함께 자란다.',
  },
  ivysaur: {
    name: '이상해풀', types: ['GRASS', 'POISON'], base: [60, 62, 63, 80, 80, 60],
    catchRate: 45, expYield: 141,
    evolve: { at: 32, to: 'venusaur' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'growl' }, { lv: 1, move: 'leechseed' },
      { lv: 10, move: 'vinewhip' }, { lv: 15, move: 'poisonpowder' }, { lv: 15, move: 'sleeppowder' },
      { lv: 22, move: 'razorleaf' }, { lv: 29, move: 'sweetscent' }, { lv: 38, move: 'growth' },
    ],
    blurb: '무거운 꽃봉오리 때문에 다리가 휘지만, 피어날 꽃을 위해서라면 견딜 만하다.',
  },
  venusaur: {
    name: '이상해꽃', types: ['GRASS', 'POISON'], base: [80, 82, 83, 100, 100, 80],
    catchRate: 45, expYield: 208,
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'growl' }, { lv: 1, move: 'leechseed' },
      { lv: 1, move: 'vinewhip' }, { lv: 15, move: 'poisonpowder' }, { lv: 15, move: 'sleeppowder' },
      { lv: 22, move: 'razorleaf' }, { lv: 29, move: 'sweetscent' }, { lv: 41, move: 'growth' },
    ],
    blurb: '등의 커다란 꽃은 비가 내린 뒤 계곡 전체에 향기를 퍼뜨린다.',
  },

  // --- Charmander line ---
  charmander: {
    name: '파이리', types: ['FIRE'], base: [39, 52, 43, 60, 50, 65],
    catchRate: 45, expYield: 65,
    evolve: { at: 16, to: 'charmeleon' },
    learnset: [
      { lv: 1, move: 'scratch' }, { lv: 1, move: 'growl' },
      { lv: 7, move: 'ember' }, { lv: 13, move: 'metalclaw' },
      { lv: 19, move: 'smokescreen' }, { lv: 25, move: 'scaryface' },
      { lv: 31, move: 'flamethrower' }, { lv: 37, move: 'slash' },
    ],
    blurb: '건강하고 기분이 좋을 때 꼬리의 불꽃은 안정적으로 타오른다.',
  },
  charmeleon: {
    name: '리자드', types: ['FIRE'], base: [58, 64, 58, 80, 65, 80],
    catchRate: 45, expYield: 142,
    evolve: { at: 36, to: 'charizard' },
    learnset: [
      { lv: 1, move: 'scratch' }, { lv: 1, move: 'growl' }, { lv: 1, move: 'ember' },
      { lv: 13, move: 'metalclaw' }, { lv: 20, move: 'smokescreen' },
      { lv: 27, move: 'scaryface' }, { lv: 34, move: 'flamethrower' }, { lv: 41, move: 'slash' },
    ],
    blurb: '다혈질이고 자존심이 강하다. 둥지 위 밤하늘은 희미하게 빛난다.',
  },
  charizard: {
    name: '리자몽', types: ['FIRE', 'FLYING'], base: [78, 84, 78, 109, 85, 100],
    catchRate: 45, expYield: 209,
    learnset: [
      { lv: 1, move: 'scratch' }, { lv: 1, move: 'growl' }, { lv: 1, move: 'ember' },
      { lv: 1, move: 'metalclaw' }, { lv: 20, move: 'smokescreen' }, { lv: 27, move: 'scaryface' },
      { lv: 34, move: 'flamethrower' }, { lv: 36, move: 'wingattack' }, { lv: 44, move: 'slash' },
    ],
    blurb: '날갯짓으로 꼬리 불꽃을 새하얗게 달군다. 누구의 명령도 따르지 않는다.',
  },

  // --- Squirtle line ---
  squirtle: {
    name: '꼬부기', types: ['WATER'], base: [44, 48, 65, 50, 64, 43],
    catchRate: 45, expYield: 66,
    evolve: { at: 16, to: 'wartortle' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 4, move: 'tailwhip' },
      { lv: 7, move: 'bubble' }, { lv: 10, move: 'withdraw' },
      { lv: 13, move: 'watergun' }, { lv: 18, move: 'bite' },
      { lv: 23, move: 'rapidspin' },
    ],
    blurb: '둥근 등껍질은 물과 걱정을 모두 털어낸다. 느긋하게 헤엄치는 작은 친구다.',
  },
  wartortle: {
    name: '어니부기', types: ['WATER'], base: [59, 63, 80, 65, 80, 58],
    catchRate: 45, expYield: 143,
    evolve: { at: 36, to: 'blastoise' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'tailwhip' }, { lv: 1, move: 'bubble' },
      { lv: 10, move: 'withdraw' }, { lv: 13, move: 'watergun' },
      { lv: 19, move: 'bite' }, { lv: 25, move: 'rapidspin' },
    ],
    blurb: '꼬리의 털은 나이를 먹으며 짙어진다. 오래 산 개체는 행운을 부른다고 한다.',
  },
  blastoise: {
    name: '거북왕', types: ['WATER'], base: [79, 83, 100, 85, 105, 78],
    catchRate: 45, expYield: 210,
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'tailwhip' }, { lv: 1, move: 'bubble' },
      { lv: 1, move: 'withdraw' }, { lv: 13, move: 'watergun' },
      { lv: 19, move: 'bite' }, { lv: 25, move: 'rapidspin' },
    ],
    blurb: '등껍질의 대포는 절벽도 뚫을 수 있다. 코코넛을 열 때도 쓸 수 있다.',
  },

  // --- Caterpie line ---
  caterpie: {
    name: '캐터피', types: ['BUG'], base: [45, 30, 35, 20, 20, 45],
    catchRate: 255, expYield: 53,
    evolve: { at: 7, to: 'metapod' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'stringshot' },
    ],
    blurb: '매일 자기 몸무게만큼 잎을 먹으며 날개를 꿈꾼다.',
  },
  metapod: {
    name: '단데기', types: ['BUG'], base: [50, 20, 55, 25, 25, 30],
    catchRate: 120, expYield: 72,
    evolve: { at: 10, to: 'butterfree' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'harden' },
    ],
    blurb: '초록색 껍질 안에서 모든 것이 다시 만들어지고 있다. 두드리지 말 것.',
  },
  butterfree: {
    name: '버터플', types: ['BUG', 'FLYING'], base: [60, 45, 50, 80, 80, 70],
    catchRate: 45, expYield: 160,
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 10, move: 'confusion' },
      { lv: 13, move: 'poisonpowder' }, { lv: 14, move: 'stunspore' },
      { lv: 15, move: 'sleeppowder' }, { lv: 18, move: 'supersonic' },
      { lv: 28, move: 'gust' }, { lv: 34, move: 'psybeam' },
    ],
    blurb: '날개 가루가 햇빛 속에서 느린 눈처럼 흩날린다. 꽃밭을 좋아한다.',
  },

  // --- Weedle line ---
  weedle: {
    name: '뿔충이', types: ['BUG', 'POISON'], base: [40, 35, 30, 20, 20, 50],
    catchRate: 255, expYield: 52,
    evolve: { at: 7, to: 'kakuna' },
    learnset: [
      { lv: 1, move: 'poisonsting' }, { lv: 1, move: 'stringshot' },
    ],
    blurb: '머리의 뿔은 장식이 아니다. 집어 들 때는 각오해야 한다.',
  },
  kakuna: {
    name: '딱충이', types: ['BUG', 'POISON'], base: [45, 25, 50, 25, 25, 35],
    catchRate: 120, expYield: 71,
    evolve: { at: 10, to: 'beedrill' },
    learnset: [
      { lv: 1, move: 'poisonsting' }, { lv: 1, move: 'harden' },
    ],
    blurb: '나뭇가지에 매달려 꼼짝하지 않는다. 가끔은 예외지만.',
  },
  beedrill: {
    name: '독침붕', types: ['BUG', 'POISON'], base: [65, 80, 40, 45, 80, 75],
    catchRate: 45, expYield: 159,
    learnset: [
      { lv: 1, move: 'poisonsting' }, { lv: 10, move: 'furyattack' },
      { lv: 20, move: 'twineedle' }, { lv: 30, move: 'pursuit' },
      { lv: 35, move: 'pinmissile' }, { lv: 40, move: 'agility' },
    ],
    blurb: '세 개의 창과 하나의 성질. 날갯소리는 숲이 보내는 마지막 경고다.',
  },

  // --- Pidgey line ---
  pidgey: {
    name: '구구', types: ['NORMAL', 'FLYING'], base: [40, 45, 40, 35, 35, 56],
    catchRate: 255, expYield: 55,
    evolve: { at: 18, to: 'pidgeotto' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 5, move: 'sandattack' },
      { lv: 9, move: 'gust' }, { lv: 13, move: 'quickattack' },
      { lv: 25, move: 'twister' }, { lv: 31, move: 'featherdance' },
      { lv: 39, move: 'agility' },
    ],
    blurb: '온순하고 흔한 새다. 궁지에 몰리면 모래를 일으킨다.',
  },
  pidgeotto: {
    name: '피죤', types: ['NORMAL', 'FLYING'], base: [63, 60, 55, 50, 50, 71],
    catchRate: 120, expYield: 113,
    evolve: { at: 36, to: 'pidgeot' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'sandattack' }, { lv: 1, move: 'gust' },
      { lv: 13, move: 'quickattack' }, { lv: 27, move: 'twister' },
      { lv: 34, move: 'featherdance' }, { lv: 43, move: 'agility' },
    ],
    blurb: '넓은 영역을 순찰하며 얼굴과 모욕을 절대 잊지 않는다.',
  },
  pidgeot: {
    name: '피죤투', types: ['NORMAL', 'FLYING'], base: [83, 80, 75, 70, 70, 91],
    catchRate: 45, expYield: 172,
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'sandattack' }, { lv: 1, move: 'gust' },
      { lv: 13, move: 'quickattack' }, { lv: 27, move: 'twister' },
      { lv: 34, move: 'featherdance' }, { lv: 44, move: 'agility' },
    ],
    blurb: '급강하로 연못을 바닥까지 가른다. 볏은 순전히 멋을 위한 것이다.',
  },

  // --- Rattata line ---
  rattata: {
    name: '꼬렛', types: ['NORMAL'], base: [30, 56, 35, 25, 35, 72],
    catchRate: 255, expYield: 57,
    evolve: { at: 20, to: 'raticate' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'tailwhip' },
      { lv: 4, move: 'quickattack' }, { lv: 13, move: 'hyperfang' },
      { lv: 20, move: 'pursuit' }, { lv: 27, move: 'superfang' },
    ],
    blurb: '무엇이든 한 번은 갉아 본다. 맛있었다면 두 번도 갉는다.',
  },
  raticate: {
    name: '레트라', types: ['NORMAL'], base: [55, 81, 60, 50, 70, 97],
    catchRate: 127, expYield: 116,
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'tailwhip' }, { lv: 1, move: 'quickattack' },
      { lv: 13, move: 'hyperfang' }, { lv: 20, move: 'pursuit' }, { lv: 30, move: 'superfang' },
    ],
    blurb: '앞니가 계속 자라므로 말썽을 향한 식욕도 멈추지 않는다.',
  },

  // --- Additional early-route species from the supplied Graphics pack ---
  spearow: {
    name: '깨비참', types: ['NORMAL', 'FLYING'], base: [40, 60, 30, 31, 31, 70],
    catchRate: 255, expYield: 58,
    evolve: { at: 20, to: 'fearow' },
    learnset: [
      { lv: 1, move: 'peck' }, { lv: 1, move: 'growl' },
      { lv: 13, move: 'furyattack' }, { lv: 26, move: 'pursuit' },
      { lv: 43, move: 'agility' },
    ],
    blurb: '몸집은 작지만 영역을 지키려는 목소리는 숲 전체를 흔든다.',
  },
  fearow: {
    name: '깨비드릴조', types: ['NORMAL', 'FLYING'], base: [65, 90, 65, 61, 61, 100],
    catchRate: 90, expYield: 162,
    learnset: [
      { lv: 1, move: 'peck' }, { lv: 1, move: 'growl' },
      { lv: 13, move: 'furyattack' }, { lv: 26, move: 'pursuit' },
      { lv: 43, move: 'agility' },
    ],
    blurb: '긴 부리와 넓은 날개로 바람을 가르며 먼 곳까지 순찰한다.',
  },
  pikachu: {
    name: '피카츄', types: ['ELECTRIC'], base: [35, 55, 40, 50, 50, 90],
    catchRate: 190, expYield: 82,
    learnset: [
      { lv: 1, move: 'thundershock' }, { lv: 1, move: 'growl' },
      { lv: 6, move: 'tailwhip' }, { lv: 8, move: 'thunderwave' },
      { lv: 11, move: 'quickattack' }, { lv: 33, move: 'agility' },
    ],
    blurb: '볼의 전기 주머니가 차오르면 꼬리 끝에서 작은 불꽃이 튄다.',
  },
  raichu: {
    name: '라이츄', types: ['ELECTRIC'], base: [60, 90, 55, 90, 80, 100],
    catchRate: 75, expYield: 122,
    learnset: [
      { lv: 1, move: 'thundershock' }, { lv: 1, move: 'tailwhip' },
      { lv: 1, move: 'quickattack' }, { lv: 1, move: 'thunderwave' },
    ],
    blurb: '넘치는 전기를 긴 꼬리로 땅에 흘려 보내며 균형을 잡는다.',
  },
  sandshrew: {
    name: '모래두지', types: ['GROUND'], base: [50, 75, 85, 20, 30, 40],
    catchRate: 255, expYield: 93,
    evolve: { at: 22, to: 'sandslash' },
    learnset: [
      { lv: 1, move: 'scratch' }, { lv: 6, move: 'defensecurl' },
      { lv: 10, move: 'sandattack' }, { lv: 17, move: 'poisonsting' },
      { lv: 23, move: 'slash' },
    ],
    blurb: '마른 흙을 파고들어 몸을 둥글게 말면 작은 바위처럼 보인다.',
  },
  sandslash: {
    name: '고지', types: ['GROUND'], base: [75, 100, 110, 45, 55, 65],
    catchRate: 90, expYield: 163,
    learnset: [
      { lv: 1, move: 'scratch' }, { lv: 1, move: 'defensecurl' },
      { lv: 10, move: 'sandattack' }, { lv: 17, move: 'poisonsting' },
      { lv: 24, move: 'slash' },
    ],
    blurb: '단단한 가시와 발톱은 메마른 땅에서도 빠르게 길을 만든다.',
  },
  zubat: {
    name: '주뱃', types: ['POISON', 'FLYING'], base: [40, 45, 35, 30, 40, 55],
    catchRate: 255, expYield: 54,
    evolve: { at: 22, to: 'golbat' },
    learnset: [
      { lv: 1, move: 'leechlife' }, { lv: 6, move: 'supersonic' },
      { lv: 16, move: 'bite' }, { lv: 21, move: 'wingattack' },
    ],
    blurb: '빛이 없는 동굴에서도 초음파의 메아리만으로 길을 찾는다.',
  },
  golbat: {
    name: '골뱃', types: ['POISON', 'FLYING'], base: [75, 80, 70, 65, 75, 90],
    catchRate: 90, expYield: 171,
    learnset: [
      { lv: 1, move: 'leechlife' }, { lv: 1, move: 'supersonic' },
      { lv: 16, move: 'bite' }, { lv: 21, move: 'wingattack' },
    ],
    blurb: '커다란 입으로 먹잇감을 붙잡고 넓은 날개로 조용히 사라진다.',
  },
  mankey: {
    name: '망키', types: ['FIGHTING'], base: [40, 80, 35, 35, 45, 70],
    catchRate: 190, expYield: 61,
    evolve: { at: 28, to: 'primeape' },
    learnset: [
      { lv: 1, move: 'scratch' }, { lv: 6, move: 'lowkick' },
      { lv: 11, move: 'karatechop' }, { lv: 16, move: 'furyattack' },
      { lv: 36, move: 'scaryface' },
    ],
    blurb: '화를 내기 시작하면 이유를 잊은 뒤에도 한동안 멈추지 않는다.',
  },
  primeape: {
    name: '성원숭', types: ['FIGHTING'], base: [65, 105, 60, 60, 70, 95],
    catchRate: 75, expYield: 149,
    learnset: [
      { lv: 1, move: 'scratch' }, { lv: 1, move: 'lowkick' },
      { lv: 11, move: 'karatechop' }, { lv: 16, move: 'furyattack' },
      { lv: 36, move: 'scaryface' },
    ],
    blurb: '분노가 온몸의 힘을 끌어내지만 친구의 목소리는 잊지 않는다.',
  },

  // --- Cross-generation early-route families (Generations 2-9) ---
  sentret: {
    name: '꼬리선', generation: 2, types: ['NORMAL'], base: [35, 46, 34, 35, 45, 20],
    catchRate: 255, expYield: 43, evolve: { at: 15, to: 'furret' },
    learnset: [
      { lv: 1, move: 'scratch' }, { lv: 1, move: 'defensecurl' },
      { lv: 4, move: 'quickattack' }, { lv: 7, move: 'furyattack' },
      { lv: 13, move: 'headbutt' }, { lv: 19, move: 'agility' },
    ],
    blurb: '꼬리로 높이 서서 멀리까지 살핀다. 위험을 보면 먼저 친구들에게 알린다.',
  },
  furret: {
    name: '다꼬리', generation: 2, types: ['NORMAL'], base: [85, 76, 64, 45, 55, 90],
    catchRate: 90, expYield: 145,
    learnset: [
      { lv: 1, move: 'scratch' }, { lv: 1, move: 'defensecurl' },
      { lv: 4, move: 'quickattack' }, { lv: 7, move: 'furyattack' },
      { lv: 13, move: 'headbutt' }, { lv: 21, move: 'agility' },
    ],
    blurb: '긴 몸으로 좁은 굴을 미끄러지듯 달린다. 둥지는 놀랄 만큼 가지런하다.',
  },
  zigzagoon: {
    name: '지그제구리', generation: 3, types: ['NORMAL'], base: [38, 30, 41, 30, 41, 60],
    catchRate: 255, expYield: 56, evolve: { at: 20, to: 'linoone' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'growl' },
      { lv: 5, move: 'tailwhip' }, { lv: 9, move: 'sandattack' },
      { lv: 13, move: 'headbutt' }, { lv: 17, move: 'pursuit' },
    ],
    blurb: '호기심이 향하는 대로 지그재그 달린다. 길가의 작은 물건을 잘 찾아낸다.',
  },
  linoone: {
    name: '직구리', generation: 3, types: ['NORMAL'], base: [78, 70, 61, 50, 61, 100],
    catchRate: 90, expYield: 147,
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'growl' },
      { lv: 5, move: 'tailwhip' }, { lv: 9, move: 'sandattack' },
      { lv: 13, move: 'headbutt' }, { lv: 17, move: 'pursuit' },
    ],
    blurb: '곧은길에서는 눈으로 쫓기 어려울 만큼 빠르지만 급한 모퉁이는 조금 서툴다.',
  },
  starly: {
    name: '찌르꼬', generation: 4, types: ['NORMAL', 'FLYING'], base: [40, 55, 30, 30, 30, 60],
    catchRate: 255, expYield: 49, evolve: { at: 14, to: 'staravia' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'growl' },
      { lv: 5, move: 'quickattack' }, { lv: 9, move: 'wingattack' },
      { lv: 13, move: 'agility' },
    ],
    blurb: '작은 무리가 같은 박자로 날아오른다. 혼자일 때보다 함께일 때 훨씬 대담하다.',
  },
  staravia: {
    name: '찌르버드', generation: 4, types: ['NORMAL', 'FLYING'], base: [55, 75, 50, 40, 40, 80],
    catchRate: 120, expYield: 119, evolve: { at: 34, to: 'staraptor' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'growl' },
      { lv: 5, move: 'quickattack' }, { lv: 9, move: 'wingattack' },
      { lv: 18, move: 'featherdance' }, { lv: 28, move: 'agility' },
    ],
    blurb: '자기 영역의 바람길을 모두 기억한다. 낯선 날갯짓에는 곧바로 반응한다.',
  },
  staraptor: {
    name: '찌르호크', generation: 4, types: ['NORMAL', 'FLYING'], base: [85, 120, 70, 50, 60, 100],
    catchRate: 45, expYield: 218,
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'quickattack' },
      { lv: 9, move: 'wingattack' }, { lv: 18, move: 'featherdance' },
      { lv: 28, move: 'agility' },
    ],
    blurb: '상처를 두려워하지 않고 거센 바람을 정면으로 가른다. 무리를 지키는 데 망설임이 없다.',
  },
  lillipup: {
    name: '요테리', generation: 5, types: ['NORMAL'], base: [45, 60, 45, 25, 45, 55],
    catchRate: 255, expYield: 55, evolve: { at: 16, to: 'herdier' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'leer' },
      { lv: 5, move: 'bite' }, { lv: 9, move: 'defensecurl' },
      { lv: 12, move: 'headbutt' }, { lv: 16, move: 'scaryface' },
    ],
    blurb: '상대의 기척을 털로 읽는다. 믿는 사람에게는 작지만 용감한 길잡이가 된다.',
  },
  herdier: {
    name: '하데리어', generation: 5, types: ['NORMAL'], base: [65, 80, 65, 35, 65, 60],
    catchRate: 120, expYield: 130, evolve: { at: 32, to: 'stoutland' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'leer' },
      { lv: 5, move: 'bite' }, { lv: 9, move: 'defensecurl' },
      { lv: 12, move: 'headbutt' }, { lv: 20, move: 'scaryface' },
    ],
    blurb: '풍성한 털로 공격을 받아내며 동료의 앞을 지킨다. 오래된 길의 냄새도 놓치지 않는다.',
  },
  stoutland: {
    name: '바랜드', generation: 5, types: ['NORMAL'], base: [85, 110, 90, 45, 90, 80],
    catchRate: 45, expYield: 225,
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'leer' },
      { lv: 5, move: 'bite' }, { lv: 12, move: 'headbutt' },
      { lv: 20, move: 'scaryface' },
    ],
    blurb: '험한 날씨에도 사람을 찾아내는 든든한 구조대원이다. 수염은 바람의 변화를 읽는다.',
  },
  fletchling: {
    name: '화살꼬빈', generation: 6, types: ['NORMAL', 'FLYING'], base: [45, 50, 43, 40, 38, 62],
    catchRate: 255, expYield: 56, evolve: { at: 17, to: 'fletchinder' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'growl' },
      { lv: 6, move: 'quickattack' }, { lv: 10, move: 'peck' },
      { lv: 13, move: 'agility' },
    ],
    blurb: '맑은 울음으로 무리의 위치를 알린다. 꼬리의 색은 숲속에서도 선명하게 보인다.',
  },
  fletchinder: {
    name: '불화살빈', generation: 6, types: ['FIRE', 'FLYING'], base: [62, 73, 55, 56, 52, 84],
    catchRate: 120, expYield: 134, evolve: { at: 35, to: 'talonflame' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'growl' },
      { lv: 6, move: 'quickattack' }, { lv: 10, move: 'peck' },
      { lv: 17, move: 'ember' }, { lv: 25, move: 'wingattack' },
    ],
    blurb: '불씨를 품은 몸으로 상승기류를 만든다. 흥분하면 날개 사이로 열기가 번진다.',
  },
  talonflame: {
    name: '파이어로', generation: 6, types: ['FIRE', 'FLYING'], base: [78, 81, 71, 74, 69, 126],
    catchRate: 45, expYield: 175,
    learnset: [
      { lv: 1, move: 'quickattack' }, { lv: 1, move: 'peck' },
      { lv: 17, move: 'ember' }, { lv: 25, move: 'wingattack' },
      { lv: 39, move: 'agility' },
    ],
    blurb: '불꽃 같은 날개로 하늘을 가른다. 최고 속도에서는 붉은 선 하나만 남는다.',
  },
  grubbin: {
    name: '턱지충이', generation: 7, types: ['BUG'], base: [47, 62, 45, 55, 45, 46],
    catchRate: 255, expYield: 60, evolve: { at: 20, to: 'charjabug' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'stringshot' },
      { lv: 5, move: 'bugbite' }, { lv: 10, move: 'bite' },
      { lv: 15, move: 'spark' },
    ],
    blurb: '튼튼한 턱으로 나무껍질을 파고든다. 전기가 흐르는 곳에 집을 짓는 것을 좋아한다.',
  },
  charjabug: {
    name: '전지충이', generation: 7, types: ['BUG', 'ELECTRIC'], base: [57, 82, 95, 55, 75, 36],
    catchRate: 120, expYield: 140, evolve: { at: 30, to: 'vikavolt' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'stringshot' },
      { lv: 5, move: 'bugbite' }, { lv: 15, move: 'spark' },
      { lv: 25, move: 'irondefense' },
    ],
    blurb: '몸에 모은 전기를 동료와 나눈다. 움직임은 느려도 껍질은 작은 요새처럼 단단하다.',
  },
  vikavolt: {
    name: '투구뿌논', generation: 7, types: ['BUG', 'ELECTRIC'], base: [77, 70, 90, 145, 75, 43],
    catchRate: 45, expYield: 225,
    learnset: [
      { lv: 1, move: 'bugbite' }, { lv: 1, move: 'spark' },
      { lv: 25, move: 'irondefense' }, { lv: 35, move: 'agility' },
    ],
    blurb: '집게 사이에 전기를 모아 쏜다. 숲의 좁은 틈도 정확하게 날아 통과한다.',
  },
  rookidee: {
    name: '파라꼬', generation: 8, types: ['FLYING'], base: [38, 47, 35, 33, 35, 57],
    catchRate: 255, expYield: 49, evolve: { at: 18, to: 'corvisquire' },
    learnset: [
      { lv: 1, move: 'peck' }, { lv: 1, move: 'leer' },
      { lv: 6, move: 'furyattack' }, { lv: 10, move: 'pluck' },
      { lv: 16, move: 'agility' },
    ],
    blurb: '작아도 겁이 없어 큰 상대에게 먼저 덤빈다. 패배한 길도 잊지 않고 다시 찾아온다.',
  },
  corvisquire: {
    name: '파크로우', generation: 8, types: ['FLYING'], base: [68, 67, 55, 43, 55, 77],
    catchRate: 120, expYield: 128, evolve: { at: 38, to: 'corviknight' },
    learnset: [
      { lv: 1, move: 'peck' }, { lv: 1, move: 'leer' },
      { lv: 6, move: 'furyattack' }, { lv: 10, move: 'pluck' },
      { lv: 20, move: 'agility' },
    ],
    blurb: '도구와 지형을 기억해 영리하게 싸운다. 반짝이는 표식을 보면 오래 관찰한다.',
  },
  corviknight: {
    name: '아머까오', generation: 8, types: ['FLYING', 'STEEL'], base: [98, 87, 105, 53, 85, 67],
    catchRate: 45, expYield: 248,
    learnset: [
      { lv: 1, move: 'peck' }, { lv: 1, move: 'leer' },
      { lv: 10, move: 'pluck' }, { lv: 20, move: 'agility' },
      { lv: 38, move: 'metalclaw' }, { lv: 45, move: 'irondefense' },
    ],
    blurb: '검은 갑옷 같은 깃털로 하늘길을 지킨다. 큰 날개가 드리우면 숲이 잠시 조용해진다.',
  },
  pawmi: {
    name: '빠모', generation: 9, types: ['ELECTRIC'], base: [45, 50, 20, 40, 25, 60],
    catchRate: 190, expYield: 48, evolve: { at: 18, to: 'pawmo' },
    learnset: [
      { lv: 1, move: 'scratch' }, { lv: 1, move: 'thundershock' },
      { lv: 5, move: 'tailwhip' }, { lv: 7, move: 'nuzzle' },
      { lv: 12, move: 'quickattack' },
    ],
    blurb: '앞발의 작은 방전 기관으로 전기를 나눈다. 낯선 상대에게도 호기심이 먼저 앞선다.',
  },
  pawmo: {
    name: '빠모트', generation: 9, types: ['ELECTRIC', 'FIGHTING'], base: [60, 75, 40, 50, 40, 85],
    catchRate: 80, expYield: 123, evolve: { at: 30, to: 'pawmot' },
    learnset: [
      { lv: 1, move: 'scratch' }, { lv: 1, move: 'thundershock' },
      { lv: 7, move: 'nuzzle' }, { lv: 12, move: 'quickattack' },
      { lv: 18, move: 'armthrust' }, { lv: 24, move: 'spark' },
    ],
    blurb: '두 발로 달리며 전기를 주먹에 모은다. 오래 함께 걸을수록 움직임이 힘차진다.',
  },
  pawmot: {
    name: '빠르모트', generation: 9, types: ['ELECTRIC', 'FIGHTING'], base: [70, 115, 70, 70, 60, 105],
    catchRate: 45, expYield: 245,
    learnset: [
      { lv: 1, move: 'nuzzle' }, { lv: 1, move: 'quickattack' },
      { lv: 18, move: 'armthrust' }, { lv: 24, move: 'spark' },
      { lv: 36, move: 'agility' },
    ],
    blurb: '충전된 털을 세우고 빠르게 파고든다. 강한 전격 뒤에도 동료를 살피는 것을 잊지 않는다.',
  },

  // --- Habitat expansion: nine complete or field-completable families ---
  oddish: {
    name: '뚜벅쵸', types: ['GRASS', 'POISON'], base: [45, 50, 55, 75, 65, 30],
    catchRate: 255, expYield: 64, evolve: { at: 21, to: 'gloom' },
    learnset: [
      { lv: 1, move: 'absorb' }, { lv: 5, move: 'sweetscent' },
      { lv: 9, move: 'acid' }, { lv: 14, move: 'poisonpowder' },
      { lv: 15, move: 'stunspore' }, { lv: 18, move: 'sleeppowder' },
      { lv: 22, move: 'megadrain' },
    ],
    blurb: '달빛이 짙어지면 흙에서 빠져나와 촉촉한 발자국을 남기며 걷는다.',
  },
  gloom: {
    name: '냄새꼬', types: ['GRASS', 'POISON'], base: [60, 65, 70, 85, 75, 40],
    catchRate: 120, expYield: 138,
    learnset: [
      { lv: 1, move: 'absorb' }, { lv: 1, move: 'sweetscent' },
      { lv: 9, move: 'acid' }, { lv: 14, move: 'poisonpowder' },
      { lv: 15, move: 'stunspore' }, { lv: 18, move: 'sleeppowder' },
      { lv: 24, move: 'megadrain' },
    ],
    blurb: '머리의 꽃봉오리에서 강한 향을 흘린다. 본인은 그 냄새를 꽤 자랑스러워한다.',
  },
  vileplume: {
    name: '라플레시아', types: ['GRASS', 'POISON'], base: [75, 80, 85, 110, 90, 50],
    catchRate: 45, expYield: 221,
    learnset: [
      { lv: 1, move: 'absorb' }, { lv: 1, move: 'sweetscent' },
      { lv: 1, move: 'acid' }, { lv: 1, move: 'poisonpowder' },
      { lv: 18, move: 'sleeppowder' }, { lv: 24, move: 'megadrain' },
    ],
    blurb: '거대한 꽃잎을 흔들어 짙은 가루를 퍼뜨리면 주변의 바람까지 향기로 물든다.',
  },
  gastly: {
    name: '고오스', types: ['GHOST', 'POISON'], base: [30, 35, 30, 100, 35, 80],
    catchRate: 190, expYield: 62, evolve: { at: 25, to: 'haunter' },
    learnset: [
      { lv: 1, move: 'astonish' }, { lv: 5, move: 'smokescreen' },
      { lv: 9, move: 'supersonic' }, { lv: 13, move: 'shadowsneak' },
      { lv: 21, move: 'shadowball' },
    ],
    blurb: '차가운 안개에 몸을 섞어 벽 틈으로 스며든다. 웃음소리만 조금 늦게 따라온다.',
  },
  haunter: {
    name: '고우스트', types: ['GHOST', 'POISON'], base: [45, 50, 45, 115, 55, 95],
    catchRate: 90, expYield: 142,
    learnset: [
      { lv: 1, move: 'astonish' }, { lv: 1, move: 'smokescreen' },
      { lv: 9, move: 'supersonic' }, { lv: 13, move: 'shadowsneak' },
      { lv: 25, move: 'shadowball' },
    ],
    blurb: '허공에 뜬 두 손으로 등 뒤를 톡 건드린다. 돌아본 순간에는 천장에 붙어 웃고 있다.',
  },
  gengar: {
    name: '팬텀', types: ['GHOST', 'POISON'], base: [60, 65, 60, 130, 75, 110],
    catchRate: 45, expYield: 225,
    learnset: [
      { lv: 1, move: 'astonish' }, { lv: 1, move: 'supersonic' },
      { lv: 13, move: 'shadowsneak' }, { lv: 25, move: 'shadowball' },
    ],
    blurb: '사물의 그림자를 한 칸씩 옮겨 놓고 누가 먼저 눈치채는지 조용히 지켜본다.',
  },
  mareep: {
    name: '메리프', generation: 2, types: ['ELECTRIC'], base: [55, 40, 40, 65, 45, 35],
    catchRate: 235, expYield: 56, evolve: { at: 15, to: 'flaaffy' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'growl' },
      { lv: 6, move: 'thundershock' }, { lv: 10, move: 'thunderwave' },
      { lv: 15, move: 'defensecurl' }, { lv: 20, move: 'spark' },
    ],
    blurb: '솜털에 정전기가 차오르면 꼬리의 빛이 밝아져 어두운 길의 표지가 된다.',
  },
  flaaffy: {
    name: '보송송', generation: 2, types: ['ELECTRIC'], base: [70, 55, 55, 80, 60, 45],
    catchRate: 120, expYield: 128, evolve: { at: 30, to: 'ampharos' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'growl' },
      { lv: 6, move: 'thundershock' }, { lv: 10, move: 'thunderwave' },
      { lv: 15, move: 'defensecurl' }, { lv: 22, move: 'spark' },
    ],
    blurb: '전기를 모으기 쉬운 털만 남아 있다. 꼬리의 구슬은 멀리서도 또렷하게 빛난다.',
  },
  ampharos: {
    name: '전룡', generation: 2, types: ['ELECTRIC'], base: [90, 75, 85, 115, 90, 55],
    catchRate: 45, expYield: 230,
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'thundershock' },
      { lv: 10, move: 'thunderwave' }, { lv: 22, move: 'spark' },
      { lv: 30, move: 'agility' },
    ],
    blurb: '꼬리의 빛을 일정한 박자로 깜빡여 폭풍 속에서도 동료에게 방향을 알려 준다.',
  },
  ralts: {
    name: '랄토스', generation: 3, types: ['PSYCHIC', 'FAIRY'], base: [28, 25, 25, 45, 35, 40],
    catchRate: 235, expYield: 40, evolve: { at: 20, to: 'kirlia' },
    learnset: [
      { lv: 1, move: 'growl' }, { lv: 4, move: 'confusion' },
      { lv: 9, move: 'fairywind' }, { lv: 14, move: 'sweetscent' },
      { lv: 18, move: 'drainingkiss' },
    ],
    blurb: '머리의 뿔로 감정의 파동을 읽는다. 따뜻한 마음 곁에서는 발걸음이 가벼워진다.',
  },
  kirlia: {
    name: '킬리아', generation: 3, types: ['PSYCHIC', 'FAIRY'], base: [38, 35, 35, 65, 55, 50],
    catchRate: 120, expYield: 97, evolve: { at: 30, to: 'gardevoir' },
    learnset: [
      { lv: 1, move: 'growl' }, { lv: 4, move: 'confusion' },
      { lv: 9, move: 'fairywind' }, { lv: 18, move: 'drainingkiss' },
      { lv: 24, move: 'psybeam' }, { lv: 28, move: 'agility' },
    ],
    blurb: '기분이 좋으면 발끝을 돌려 춤춘다. 주변 공기까지 리듬에 맞춰 가볍게 흔들린다.',
  },
  gardevoir: {
    name: '가디안', generation: 3, types: ['PSYCHIC', 'FAIRY'], base: [68, 65, 65, 125, 115, 80],
    catchRate: 45, expYield: 233,
    learnset: [
      { lv: 1, move: 'confusion' }, { lv: 1, move: 'fairywind' },
      { lv: 18, move: 'drainingkiss' }, { lv: 24, move: 'psybeam' },
      { lv: 30, move: 'agility' },
    ],
    blurb: '믿는 동료 앞에서는 조용히 서 있지만 위험이 닥치면 누구보다 먼저 힘을 펼친다.',
  },
  roggenrola: {
    name: '단굴', generation: 5, types: ['ROCK'], base: [55, 75, 85, 25, 25, 15],
    catchRate: 255, expYield: 56, evolve: { at: 25, to: 'boldore' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 4, move: 'harden' },
      { lv: 8, move: 'sandattack' }, { lv: 12, move: 'rockthrow' },
      { lv: 20, move: 'irondefense' }, { lv: 25, move: 'rockslide' },
    ],
    blurb: '몸속의 단단한 핵으로 땅의 진동을 읽는다. 발소리가 다가오면 눈부터 반짝인다.',
  },
  boldore: {
    name: '암트르', generation: 5, types: ['ROCK'], base: [70, 105, 105, 50, 40, 20],
    catchRate: 120, expYield: 137,
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'harden' },
      { lv: 12, move: 'rockthrow' }, { lv: 20, move: 'irondefense' },
      { lv: 25, move: 'rockslide' },
    ],
    blurb: '주황빛 결정이 에너지를 머금으면 낮은 울림이 난다. 광부들은 그 소리로 길을 찾는다.',
  },
  gigalith: {
    name: '기가이어스', generation: 5, types: ['ROCK'], base: [85, 135, 130, 60, 80, 25],
    catchRate: 45, expYield: 232,
    learnset: [
      { lv: 1, move: 'harden' }, { lv: 12, move: 'rockthrow' },
      { lv: 20, move: 'irondefense' }, { lv: 25, move: 'rockslide' },
    ],
    blurb: '결정에 모은 빛을 한꺼번에 내보낸다. 움직임은 느려도 자리를 지키는 힘은 굳건하다.',
  },
  noibat: {
    name: '음뱃', generation: 6, types: ['FLYING', 'DRAGON'], base: [40, 30, 35, 45, 40, 55],
    catchRate: 190, expYield: 49, evolve: { at: 48, to: 'noivern' },
    learnset: [
      { lv: 1, move: 'supersonic' }, { lv: 5, move: 'gust' },
      { lv: 11, move: 'bite' }, { lv: 18, move: 'wingattack' },
      { lv: 24, move: 'twister' }, { lv: 32, move: 'dragonbreath' },
    ],
    blurb: '커다란 귀로 동굴의 굴곡을 읽는다. 익은 열매를 찾을 때는 음파가 유난히 들뜬다.',
  },
  noivern: {
    name: '음번', generation: 6, types: ['FLYING', 'DRAGON'], base: [85, 70, 80, 97, 80, 123],
    catchRate: 45, expYield: 187,
    learnset: [
      { lv: 1, move: 'supersonic' }, { lv: 1, move: 'gust' },
      { lv: 11, move: 'bite' }, { lv: 18, move: 'wingattack' },
      { lv: 24, move: 'twister' }, { lv: 32, move: 'dragonbreath' },
    ],
    blurb: '귀에서 퍼지는 초음파가 바위를 떨게 한다. 조용한 밤에는 먼 산까지 날아간다.',
  },
  snom: {
    name: '누니머기', generation: 8, types: ['ICE', 'BUG'], base: [30, 25, 35, 45, 30, 20],
    catchRate: 190, expYield: 37,
    learnset: [
      { lv: 1, move: 'powdersnow' }, { lv: 1, move: 'stringshot' },
      { lv: 8, move: 'bugbite' }, { lv: 16, move: 'icywind' },
    ],
    blurb: '눈 위를 천천히 기어가며 등에 고드름을 키운다. 지나간 자리에는 가는 서리길이 남는다.',
  },
  frosmoth: {
    name: '모스노우', generation: 8, types: ['ICE', 'BUG'], base: [70, 65, 60, 125, 90, 65],
    catchRate: 75, expYield: 166,
    learnset: [
      { lv: 1, move: 'powdersnow' }, { lv: 1, move: 'stringshot' },
      { lv: 8, move: 'bugbite' }, { lv: 16, move: 'icywind' },
      { lv: 30, move: 'icebeam' },
    ],
    blurb: '차가운 날개 가루를 뿌려 눈보라를 만든다. 빛을 받으면 얼음 비늘이 별처럼 반짝인다.',
  },
  tinkatink: {
    name: '어리짱', generation: 9, types: ['FAIRY', 'STEEL'], base: [50, 45, 45, 35, 64, 58],
    catchRate: 190, expYield: 59, evolve: { at: 24, to: 'tinkatuff' },
    learnset: [
      { lv: 1, move: 'scratch' }, { lv: 5, move: 'fairywind' },
      { lv: 9, move: 'metalclaw' }, { lv: 14, move: 'sweetkiss' },
      { lv: 18, move: 'rockthrow' },
    ],
    blurb: '주운 금속 조각을 두드려 작은 망치를 만든다. 모양이 마음에 들 때까지 멈추지 않는다.',
  },
  tinkatuff: {
    name: '벼리짱', generation: 9, types: ['FAIRY', 'STEEL'], base: [65, 55, 55, 45, 82, 78],
    catchRate: 90, expYield: 133, evolve: { at: 38, to: 'tinkaton' },
    learnset: [
      { lv: 1, move: 'scratch' }, { lv: 5, move: 'fairywind' },
      { lv: 9, move: 'metalclaw' }, { lv: 14, move: 'sweetkiss' },
      { lv: 18, move: 'rockthrow' }, { lv: 26, move: 'drainingkiss' },
    ],
    blurb: '튼튼한 금속을 찾아 폐허를 돌아다닌다. 완성된 망치는 몸보다 커도 가볍게 휘두른다.',
  },
  tinkaton: {
    name: '두드리짱', generation: 9, types: ['FAIRY', 'STEEL'], base: [85, 75, 77, 70, 105, 94],
    catchRate: 45, expYield: 253,
    learnset: [
      { lv: 1, move: 'fairywind' }, { lv: 1, move: 'metalclaw' },
      { lv: 18, move: 'rockthrow' }, { lv: 26, move: 'drainingkiss' },
      { lv: 38, move: 'irondefense' },
    ],
    blurb: '거대한 망치로 장애물을 경쾌하게 날린다. 요란한 소리 뒤에는 만족스러운 웃음이 따른다.',
  },
  rockruff: {
    name: '암멍이', generation: 7, types: ['ROCK'], base: [45, 65, 40, 30, 40, 60],
    catchRate: 190, expYield: 56, evolve: { at: 25, to: 'lycanroc' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'leer' },
      { lv: 7, move: 'sandattack' }, { lv: 12, move: 'bite' },
      { lv: 16, move: 'rockthrow' }, { lv: 23, move: 'rockslide' },
    ],
    blurb: '목의 돌을 부딪쳐 인사한다. 돌이 단단해질수록 혼자 먼 길을 달려 보려 한다.',
  },
  lycanroc: {
    name: '루가루암', generation: 7, types: ['ROCK'], base: [75, 115, 65, 55, 65, 112],
    catchRate: 90, expYield: 170,
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'leer' },
      { lv: 12, move: 'bite' }, { lv: 16, move: 'rockthrow' },
      { lv: 25, move: 'rockslide' }, { lv: 30, move: 'agility' },
    ],
    blurb: '햇빛을 받은 바위 길을 빠르게 달린다. 날카로운 갈기로 상대의 빈틈을 가른다.',
  },

  // --- 100-species expansion: waterlands, cliffs, and late-game rarities ---
  wooper: {
    name: '우파', generation: 2, types: ['WATER', 'GROUND'], base: [55, 45, 45, 25, 25, 15],
    catchRate: 255, expYield: 42, evolve: { at: 20, to: 'quagsire' },
    learnset: [
      { lv: 1, move: 'watergun' }, { lv: 1, move: 'tailwhip' },
      { lv: 5, move: 'mudshot' }, { lv: 12, move: 'defensecurl' },
      { lv: 18, move: 'bulldoze' },
    ],
    blurb: '물가의 진흙을 온몸에 묻히고 느긋하게 걷는다. 발자국에는 작은 물웅덩이가 남는다.',
  },
  quagsire: {
    name: '누오', generation: 2, types: ['WATER', 'GROUND'], base: [95, 85, 85, 65, 65, 35],
    catchRate: 90, expYield: 151,
    learnset: [
      { lv: 1, move: 'watergun' }, { lv: 1, move: 'tailwhip' },
      { lv: 5, move: 'mudshot' }, { lv: 12, move: 'defensecurl' },
      { lv: 20, move: 'bulldoze' }, { lv: 28, move: 'rockslide' },
    ],
    blurb: '급한 물살에도 표정 하나 바꾸지 않는다. 강바닥의 돌과 부딪치면 돌아서서 다시 헤엄친다.',
  },
  houndour: {
    name: '델빌', generation: 2, types: ['DARK', 'FIRE'], base: [45, 60, 30, 80, 50, 65],
    catchRate: 120, expYield: 66, evolve: { at: 24, to: 'houndoom' },
    learnset: [
      { lv: 1, move: 'leer' }, { lv: 1, move: 'ember' },
      { lv: 7, move: 'smokescreen' }, { lv: 10, move: 'bite' },
      { lv: 16, move: 'pursuit' }, { lv: 24, move: 'flamethrower' },
    ],
    blurb: '짧은 울음으로 무리에게 길을 알린다. 어둠 속 코끝에는 작은 불씨가 오래 남는다.',
  },
  houndoom: {
    name: '헬가', generation: 2, types: ['DARK', 'FIRE'], base: [75, 90, 50, 110, 80, 95],
    catchRate: 45, expYield: 175,
    learnset: [
      { lv: 1, move: 'leer' }, { lv: 1, move: 'ember' },
      { lv: 7, move: 'smokescreen' }, { lv: 10, move: 'bite' },
      { lv: 16, move: 'pursuit' }, { lv: 24, move: 'flamethrower' },
    ],
    blurb: '낮게 울리는 포효로 동료를 모은다. 뿔 사이로 피어오른 열기가 밤안개를 갈라 놓는다.',
  },
  swablu: {
    name: '파비코', generation: 3, types: ['NORMAL', 'FLYING'], base: [45, 40, 60, 40, 75, 50],
    catchRate: 255, expYield: 62, evolve: { at: 35, to: 'altaria' },
    learnset: [
      { lv: 1, move: 'peck' }, { lv: 1, move: 'growl' },
      { lv: 7, move: 'astonish' }, { lv: 12, move: 'furyattack' },
      { lv: 20, move: 'dragonbreath' }, { lv: 28, move: 'agility' },
    ],
    blurb: '구름 같은 날개로 먼지를 꼼꼼히 턴다. 깨끗한 표지판을 발견하면 한동안 내려앉아 쉰다.',
  },
  altaria: {
    name: '파비코리', generation: 3, types: ['DRAGON', 'FLYING'], base: [75, 70, 90, 70, 105, 80],
    catchRate: 45, expYield: 172,
    learnset: [
      { lv: 1, move: 'peck' }, { lv: 1, move: 'growl' },
      { lv: 7, move: 'astonish' }, { lv: 12, move: 'furyattack' },
      { lv: 20, move: 'dragonbreath' }, { lv: 28, move: 'agility' },
      { lv: 35, move: 'twister' },
    ],
    blurb: '포근한 날개를 넓혀 바람을 탄다. 노랫소리가 들리는 곳에는 구름 조각 같은 깃털이 남는다.',
  },
  shinx: {
    name: '꼬링크', generation: 4, types: ['ELECTRIC'], base: [45, 65, 34, 40, 34, 45],
    catchRate: 235, expYield: 53, evolve: { at: 15, to: 'luxio' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'leer' },
      { lv: 5, move: 'thundershock' }, { lv: 9, move: 'bite' },
      { lv: 13, move: 'spark' },
    ],
    blurb: '앞발을 땅에 대면 털끝이 푸르게 빛난다. 놀라면 꼬리 불빛부터 켜고 주위를 살핀다.',
  },
  luxio: {
    name: '럭시오', generation: 4, types: ['ELECTRIC'], base: [60, 85, 49, 60, 49, 60],
    catchRate: 120, expYield: 127, evolve: { at: 30, to: 'luxray' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'leer' },
      { lv: 5, move: 'thundershock' }, { lv: 9, move: 'bite' },
      { lv: 15, move: 'spark' }, { lv: 23, move: 'scaryface' },
    ],
    blurb: '동료의 꼬리와 맞닿아 전기를 나눈다. 어두운 길에서는 푸른 섬광으로 앞을 밝힌다.',
  },
  luxray: {
    name: '렌트라', generation: 4, types: ['ELECTRIC'], base: [80, 120, 79, 95, 79, 70],
    catchRate: 45, expYield: 235,
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'leer' },
      { lv: 5, move: 'thundershock' }, { lv: 9, move: 'bite' },
      { lv: 15, move: 'spark' }, { lv: 23, move: 'scaryface' },
      { lv: 30, move: 'thunderwave' },
    ],
    blurb: '번개가 번쩍일 때 먼 움직임까지 놓치지 않는다. 무리를 지킬 때는 갈기의 빛이 더욱 선명해진다.',
  },
  drilbur: {
    name: '두더류', generation: 5, types: ['GROUND'], base: [60, 85, 40, 30, 45, 68],
    catchRate: 120, expYield: 66, evolve: { at: 31, to: 'excadrill' },
    learnset: [
      { lv: 1, move: 'scratch' }, { lv: 5, move: 'mudshot' },
      { lv: 9, move: 'rapidspin' }, { lv: 15, move: 'metalclaw' },
      { lv: 22, move: 'rockslide' }, { lv: 28, move: 'bulldoze' },
    ],
    blurb: '두 발톱을 모아 흙 속을 나선형으로 파고든다. 지나간 굴은 놀랄 만큼 반듯하다.',
  },
  excadrill: {
    name: '몰드류', generation: 5, types: ['GROUND', 'STEEL'], base: [110, 135, 60, 50, 65, 88],
    catchRate: 60, expYield: 178,
    learnset: [
      { lv: 1, move: 'scratch' }, { lv: 5, move: 'mudshot' },
      { lv: 9, move: 'rapidspin' }, { lv: 15, move: 'metalclaw' },
      { lv: 22, move: 'rockslide' }, { lv: 28, move: 'bulldoze' },
      { lv: 36, move: 'slash' },
    ],
    blurb: '강철 발톱으로 단단한 암반에도 길을 낸다. 굴의 갈림길마다 일정한 간격으로 흠집을 남긴다.',
  },
  goomy: {
    name: '미끄메라', generation: 6, types: ['DRAGON'], base: [45, 50, 35, 55, 75, 40],
    catchRate: 45, expYield: 60, evolve: { at: 40, to: 'sliggoo' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 5, move: 'absorb' },
      { lv: 9, move: 'watergun' }, { lv: 15, move: 'dragonbreath' },
      { lv: 23, move: 'acid' },
    ],
    blurb: '촉촉한 그늘을 따라 천천히 움직인다. 몸이 마르기 전에 맑은 물방울을 찾아 몸을 적신다.',
  },
  sliggoo: {
    name: '미끄네일', generation: 6, types: ['DRAGON'], base: [68, 75, 53, 83, 113, 60],
    catchRate: 45, expYield: 158, evolve: { at: 50, to: 'goodra' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 5, move: 'absorb' },
      { lv: 9, move: 'watergun' }, { lv: 15, move: 'dragonbreath' },
      { lv: 23, move: 'acid' }, { lv: 32, move: 'mudshot' },
    ],
    blurb: '촉각으로 주변의 진동을 읽는다. 비가 내리면 껍질이 반짝이고 평소보다 훨씬 활발해진다.',
  },
  goodra: {
    name: '미끄래곤', generation: 6, types: ['DRAGON'], base: [90, 100, 70, 110, 150, 80],
    catchRate: 45, expYield: 270,
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 5, move: 'absorb' },
      { lv: 9, move: 'watergun' }, { lv: 15, move: 'dragonbreath' },
      { lv: 23, move: 'acid' }, { lv: 32, move: 'mudshot' },
      { lv: 50, move: 'twister' },
    ],
    blurb: '반가운 상대를 보면 힘껏 끌어안는다. 말랑한 몸과 달리 꼬리에서 나오는 힘은 매우 강하다.',
  },
  rowlet: {
    name: '나몰빼미', generation: 7, types: ['GRASS', 'FLYING'], base: [68, 55, 55, 50, 50, 42],
    catchRate: 45, expYield: 64, evolve: { at: 17, to: 'dartrix' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'growl' },
      { lv: 5, move: 'peck' }, { lv: 9, move: 'astonish' },
      { lv: 13, move: 'razorleaf' },
    ],
    blurb: '고개를 둥글게 돌려 소리의 방향을 찾는다. 잎사귀를 다듬은 뒤 조용히 목표를 겨눈다.',
  },
  dartrix: {
    name: '빼미스로우', generation: 7, types: ['GRASS', 'FLYING'], base: [78, 75, 75, 70, 70, 52],
    catchRate: 45, expYield: 147, evolve: { at: 34, to: 'decidueye' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'growl' },
      { lv: 5, move: 'peck' }, { lv: 9, move: 'astonish' },
      { lv: 13, move: 'razorleaf' }, { lv: 22, move: 'pluck' },
      { lv: 30, move: 'shadowsneak' },
    ],
    blurb: '날개 깃을 흐트러짐 없이 정돈한다. 멋진 자세를 잡느라 상대의 첫 움직임을 놓칠 때도 있다.',
  },
  decidueye: {
    name: '모크나이퍼', generation: 7, types: ['GRASS', 'GHOST'], base: [78, 107, 75, 100, 100, 70],
    catchRate: 45, expYield: 239,
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 5, move: 'peck' },
      { lv: 9, move: 'astonish' }, { lv: 13, move: 'razorleaf' },
      { lv: 22, move: 'pluck' }, { lv: 30, move: 'shadowsneak' },
      { lv: 34, move: 'shadowball' },
    ],
    blurb: '기척을 지운 채 잎 화살을 날린다. 어두운 숲에서 들리는 짧은 바람 소리가 유일한 흔적이다.',
  },
  fidough: {
    name: '쫀도기', generation: 9, types: ['FAIRY'], base: [37, 55, 70, 30, 55, 65],
    catchRate: 190, expYield: 62, evolve: { at: 26, to: 'dachsbun' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'growl' },
      { lv: 7, move: 'fairywind' }, { lv: 12, move: 'bite' },
      { lv: 18, move: 'sweetkiss' }, { lv: 24, move: 'drainingkiss' },
    ],
    blurb: '부드러운 몸에서 은은한 향기가 난다. 기분이 좋으면 귀를 반죽처럼 통통 튕긴다.',
  },
  dachsbun: {
    name: '바우첼', generation: 9, types: ['FAIRY'], base: [57, 80, 115, 50, 80, 95],
    catchRate: 90, expYield: 167,
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'growl' },
      { lv: 7, move: 'fairywind' }, { lv: 12, move: 'bite' },
      { lv: 18, move: 'sweetkiss' }, { lv: 24, move: 'drainingkiss' },
      { lv: 30, move: 'agility' },
    ],
    blurb: '잘 구워진 빵처럼 단단하고 따뜻하다. 마을을 돌며 익숙한 사람들의 냄새를 확인한다.',
  },
  frigibax: {
    name: '드니차', generation: 9, types: ['DRAGON', 'ICE'], base: [65, 75, 45, 35, 45, 55],
    catchRate: 45, expYield: 64, evolve: { at: 35, to: 'arctibax' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'leer' },
      { lv: 7, move: 'bite' }, { lv: 12, move: 'powdersnow' },
      { lv: 18, move: 'dragonbreath' }, { lv: 26, move: 'icywind' },
    ],
    blurb: '등지느러미로 주변의 열을 빨아들인다. 차가워진 바위 틈에 몸을 숨기고 움직임을 기다린다.',
  },
  arctibax: {
    name: '드니꽁', generation: 9, types: ['DRAGON', 'ICE'], base: [90, 95, 66, 45, 65, 62],
    catchRate: 25, expYield: 148, evolve: { at: 54, to: 'baxcalibur' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 1, move: 'leer' },
      { lv: 7, move: 'bite' }, { lv: 12, move: 'powdersnow' },
      { lv: 18, move: 'dragonbreath' }, { lv: 26, move: 'icywind' },
      { lv: 35, move: 'slash' },
    ],
    blurb: '등의 얼음 칼날을 단단히 세우고 돌진한다. 발밑에는 곧게 갈라진 서리 자국이 생긴다.',
  },
  baxcalibur: {
    name: '드닐레이브', generation: 9, types: ['DRAGON', 'ICE'], base: [115, 145, 92, 75, 86, 87],
    catchRate: 10, expYield: 300,
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 7, move: 'bite' },
      { lv: 12, move: 'powdersnow' }, { lv: 18, move: 'dragonbreath' },
      { lv: 26, move: 'icywind' }, { lv: 35, move: 'slash' },
      { lv: 54, move: 'icebeam' },
    ],
    blurb: '거대한 등지느러미에 냉기를 모은다. 한 번 휘두르면 주변 공기가 하얗게 얼어붙는다.',
  },
  glimmet: {
    name: '초롱순', generation: 9, types: ['ROCK', 'POISON'], base: [48, 35, 42, 105, 60, 60],
    catchRate: 70, expYield: 70, evolve: { at: 35, to: 'glimmora' },
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 5, move: 'acid' },
      { lv: 10, move: 'rockthrow' }, { lv: 16, move: 'poisonpowder' },
      { lv: 24, move: 'rockslide' },
    ],
    blurb: '동굴 벽의 틈에 붙어 희미한 빛을 낸다. 주변 공기가 흔들리면 꽃잎 같은 결정이 오므라든다.',
  },
  glimmora: {
    name: '킬라플로르', generation: 9, types: ['ROCK', 'POISON'], base: [83, 55, 90, 130, 81, 86],
    catchRate: 25, expYield: 184,
    learnset: [
      { lv: 1, move: 'tackle' }, { lv: 5, move: 'acid' },
      { lv: 10, move: 'rockthrow' }, { lv: 16, move: 'poisonpowder' },
      { lv: 24, move: 'rockslide' }, { lv: 35, move: 'irondefense' },
    ],
    blurb: '수정 꽃잎을 펼쳐 벽면의 빛을 모은다. 위험을 느끼면 독성 가루와 돌조각을 함께 흩뿌린다.',
  },
};

// ===== Creature helpers =====
let _uid = 1;

// Medium-fast experience curve.
function expForLevel(level) { return level * level * level; }

function statFromBase(base, level) { return Math.floor(2 * base * level / 100) + 5; }
function hpFromBase(base, level) { return Math.floor(2 * base * level / 100) + level + 10; }

function calcStats(c) {
  const b = SPECIES[c.species].base;
  c.maxHp = hpFromBase(b[0], c.level);
  c.atk = statFromBase(b[1], c.level);
  c.def = statFromBase(b[2], c.level);
  c.spa = statFromBase(b[3], c.level);
  c.spd = statFromBase(b[4], c.level);
  c.spe = statFromBase(b[5], c.level);
}

// Moves known at a given level: the 4 most recent learnset entries.
function movesAtLevel(speciesId, level) {
  const known = SPECIES[speciesId].learnset.filter(e => e.lv <= level).map(e => e.move);
  const dedup = [...new Set(known)];
  return dedup.slice(-4);
}

function makeCreature(speciesId, level) {
  const c = {
    uid: _uid++,
    species: speciesId,
    level,
    exp: expForLevel(level),
    shiny: Math.random() < 1 / 512,   // shiny encounter rate: 1 in 512
    identified: false,                // revealed by the Scanner
    nickname: '',                     // legacy field; new guesses are resolved immediately
    revealedHints: [],                // clues earned before this creature was caught
    status: null,       // null | 'PSN' | 'BRN' | 'PAR' | 'SLP' | 'FRZ'
    sleepTurns: 0,
    moves: movesAtLevel(speciesId, level).map(id => ({
      id, pp: MOVES[id].pp, maxPp: MOVES[id].pp,
    })),
  };
  calcStats(c);
  c.hp = c.maxHp;
  return c;
}

function creatureName(c) {
  // Legacy saves may still carry a nickname. New guesses resolve immediately:
  // correct answers identify the creature and wrong answers release it.
  const nickname = typeof c.nickname === 'string' ? c.nickname.trim() : '';
  if (!c.identified) return nickname || '???';
  return speciesName(c);
}

function speciesName(c) {
  // The hint database carries the clean display names used by mystery
  // encounters. Keep the old field as a fallback for data-only validation.
  const hint = typeof HINT_DATA !== 'undefined' ? HINT_DATA[c.species] : null;
  return hint && hint.name ? hint.name : SPECIES[c.species].name;
}

function normalizeSpeciesGuess(value) {
  return String(value || '').trim().toLocaleLowerCase().replace(/[\s._\-']/g, '');
}

function guessMatchesSpecies(c, guess) {
  const normalized = normalizeSpeciesGuess(guess);
  if (!normalized) return false;
  return normalized === normalizeSpeciesGuess(speciesName(c)) ||
    normalized === normalizeSpeciesGuess(c.species) ||
    normalized === normalizeSpeciesGuess(SPECIES[c.species].name);
}

function isFirstPartner(c) {
  if (typeof Game === 'undefined' || !Game.player || !Game.player.flags) return false;
  const flags = Game.player.flags;
  if (flags.starter_uid !== undefined && flags.starter_uid !== null) {
    return c.uid === flags.starter_uid;
  }
  return flags.starter === true && Game.player.party[0] === c;
}

function identifyCreature(c) {
  c.identified = true;
  c.unknown = false;
  c.nickname = '';
  if (isFirstPartner(c)) {
    Game.player.flags.first_partner_scanned = true;
    Game.player.flags.guess_unlocked = true;
  }
  return c;
}
function creatureTypes(c) { return SPECIES[c.species].types; }

// Exp needed to go from current total to the next level.
function expToNext(c) {
  if (c.level >= 100) return 0;
  return expForLevel(c.level + 1) - c.exp;
}

// 0..1 progress through the current level's exp band.
function expProgress(c) {
  if (c.level >= 100) return 1;
  const lo = expForLevel(c.level), hi = expForLevel(c.level + 1);
  return Math.max(0, Math.min(1, (c.exp - lo) / (hi - lo)));
}
