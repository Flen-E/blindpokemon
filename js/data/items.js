// ===== Item data (FireRed-style names, effects, prices) =====
// kind: 'heal' (restore HP), 'cure' (status), 'orb' (capture device),
// 'hint' (reveal mystery clues), 'scanner' (identify a mystery creature),
// 'level' (raise a party member by one level outside battle)
// cures: list of statuses removed ('ALL' = any)
const ITEMS = {
  hint:         { name: '\uD78C\uD2B8 \uACF5\uAC1C ?', kind: 'hint', unlimited: true, price: 250,
                  desc: '\uC57C\uC0DD \uD3EC\uCF13\uBAB9\uC758 \uAD00\uCC30 \uAE30\uB85D\uC744 \uD55C \uC904 \uC5F4\uC5B4 \uC90D\uB2C8\uB2E4. \uC0AC\uC6A9\uD574\uB3C4 \uC544\uC774\uD15C\uC740 \uC18C\uBAA8\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.' },
  scanner:      { name: '\uC2A4\uCE94\uB108', kind: 'scanner', price: 1200,
                  desc: '\uC815\uCCB4\uAC00 \uAC00\uB824\uC9C4 \uD3EC\uCF13\uBAB9\uC758 \uC774\uB984\uACFC \uC2E4\uCCB4\uB97C \uBC1D\uD600\uC90D\uB2C8\uB2E4. \uC0AC\uC6A9\uD558\uBA74 \uD55C \uD134\uC774 \uC9C0\uB098\uAC11\uB2C8\uB2E4.' },
  rarecandy:    { name: '\uC774\uC0C1\uD55C\uC0AC\uD0D5', kind: 'level', price: 4800,
                  desc: '\uD544\uB4DC\uC5D0\uC11C \uB3D9\uB8CC \uD558\uB098\uC758 \uB808\uBCA8\uC744 1 \uC62C\uB824 \uC90D\uB2C8\uB2E4. \uB808\uBCA8 100\uC5D0\uAC8C\uB294 \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' },
  potion:       { name: '상처약',         kind: 'heal', amount: 20,  price: 300,
                  desc: '분사식 치료약. 체력을 20 회복한다.' },
  superpotion:  { name: '좋은상처약',     kind: 'heal', amount: 50,  price: 700,
                  desc: '분사식 치료약. 체력을 50 회복한다.' },
  antidote:     { name: '해독제',         kind: 'cure', cures: ['PSN'], price: 100,
                  desc: '중독된 동료를 치료한다.' },
  paralyzeheal: { name: '마비치료제',     kind: 'cure', cures: ['PAR'], price: 200,
                  desc: '마비된 동료를 치료한다.' },
  awakening:    { name: '잠깨는약',       kind: 'cure', cures: ['SLP'], price: 250,
                  desc: '잠든 동료를 깨운다.' },
  burnheal:     { name: '화상치료제',     kind: 'cure', cures: ['BRN'], price: 250,
                  desc: '화상 입은 동료를 치료한다.' },
  iceheal:      { name: '얼음상태치료제', kind: 'cure', cures: ['FRZ'], price: 250,
                  desc: '얼어붙은 동료를 녹인다.' },
  fullheal:     { name: '만병통치제',     kind: 'cure', cures: ['ALL'], price: 600,
                  desc: '모든 상태 이상을 치료한다.' },
  pokeball:     { name: '몬스터볼',       kind: 'orb', rate: 1.0, price: 200,
                  desc: '야생 생물을 잡는 장치.' },
  greatball:    { name: '슈퍼볼',         kind: 'orb', rate: 1.5, price: 600,
                  desc: '포획 성능이 뛰어난 볼.' },
};

// What the shop sells, in display order.
const SHOP_STOCK = [
  'potion', 'superpotion', 'pokeball', 'greatball',
  'antidote', 'paralyzeheal', 'awakening', 'burnheal', 'iceheal', 'fullheal',
];
