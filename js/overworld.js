// ===== Overworld engine =====
const DELTA = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

// The rival always picks the starter that counters the player's choice.
const RIVAL_COUNTER = { bulbasaur: 'charmander', charmander: 'squirtle', squirtle: 'bulbasaur' };

const Overworld = (() => {
  const TILE = 16, VIEW_W = 240, VIEW_H = 160;
  const WALK_STEP_TIME = 0.18;
  const BIKE_STEP_TIME = 0.085;
  const FACE_DELAY = 0.07;  // tap-to-turn grace period

  let moving = null;        // { fromX, fromY, t }
  let faceTimer = 0;
  let bumpCooldown = 0;
  let blockedDir = null;    // direction of a gate that just refused us; re-arm on release
  let pendingPuzzleNotice = null;
  let wanderTimer = 1.4;
  let wanderMapId = null;

  function map() { return MAPS[Game.player.map]; }
  function mapW() { return map().rows[0].length; }
  function mapH() { return map().rows.length; }
  function tileAt(x, y) {
    const m = map();
    if (y < 0 || y >= m.rows.length || x < 0 || x >= m.rows[y].length) return null;
    const gateFlag = m.puzzle && m.puzzle.gates && m.puzzle.gates[`${x},${y}`];
    if (gateFlag && Game.player.flags[gateFlag]) return '_';
    return m.rows[y][x];
  }
  function visibleNpcs() {
    return (map().npcs || []).filter(n => !(n.hiddenIf && Game.player.flags[n.hiddenIf]));
  }
  function npcAt(x, y) {
    return visibleNpcs().find(n => n.x === x && n.y === y) || null;
  }

  function pushPuzzleState(push) {
    if (!push) return null;
    let state = Game.player.flags[push.stateFlag];
    const valid = state && typeof state === 'object' && push.blocks.every(block => {
      const pos = state[block.id];
      return pos && Number.isInteger(pos.x) && Number.isInteger(pos.y);
    });
    if (!valid) {
      state = {};
      for (const block of push.blocks) state[block.id] = { x: block.x, y: block.y };
      Game.player.flags[push.stateFlag] = state;
    }
    return state;
  }

  function pushBlockAt(x, y) {
    const push = map().puzzle && map().puzzle.push;
    if (!push) return null;
    const state = pushPuzzleState(push);
    for (const block of push.blocks) {
      const pos = state[block.id];
      if (pos.x === x && pos.y === y) return { push, block, pos };
    }
    return null;
  }

  function rotorPuzzleState(rotors) {
    if (!rotors) return null;
    let state = Game.player.flags[rotors.stateFlag];
    const devices = Object.values(rotors.devices);
    const valid = state && typeof state === 'object' && devices.every(device =>
      Number.isInteger(state[device.id]) && state[device.id] >= 0 && state[device.id] < 4);
    if (!valid) {
      state = {};
      for (const device of devices) state[device.id] = device.start || 0;
      Game.player.flags[rotors.stateFlag] = state;
    }
    return state;
  }
  function isSolid(x, y) {
    const ch = tileAt(x, y);
    if (ch === null) return true;
    const gateFlag = map().puzzle && map().puzzle.gates && map().puzzle.gates[`${x},${y}`];
    const openedGate = gateFlag && Game.player.flags[gateFlag];
    if (!openedGate && mapTileIsSolid(map(), x, y)) return true;
    // tiles under a building image are solid (doors stay enterable)
    if (ch !== 'D' && GameAssets.decalSolid(Game.player.map, x, y)) return true;
    if (pushBlockAt(x, y)) return true;
    if (npcAt(x, y)) return true;
    return false;
  }

  function tryPushBlock(info, dir) {
    if (!info || Game.player.flags[info.push.solvedFlag]) return null;
    const [dx, dy] = DELTA[dir];
    const nx = info.pos.x + dx, ny = info.pos.y + dy;
    if (isSolid(nx, ny)) return null;
    const fromX = info.pos.x, fromY = info.pos.y;
    info.pos.x = nx;
    info.pos.y = ny;
    const state = pushPuzzleState(info.push);
    const solved = info.push.goals.every(goal => Object.values(state).some(pos => pos.x === goal.x && pos.y === goal.y));
    if (solved) {
      Game.player.flags[info.push.solvedFlag] = true;
      pendingPuzzleNotice = info.push.solvedText;
    }
    return { id: info.block.id, fromX, fromY, toX: nx, toY: ny };
  }

  function runAsync(fn) {
    if (Game.busy) return;
    Game.busy = true;
    Promise.resolve(fn()).catch(e => console.error(e)).finally(() => {
      Game.busy = false;
      Input.clearPressed();
    });
  }

  // ---------------- update ----------------
  function update(dt) {
    if (Game.mode !== 'overworld' || Game.busy) return;
    const p = Game.player;
    if (bumpCooldown > 0) bumpCooldown -= dt;

    if (moving) {
      moving.t += dt / (p.ridingBike ? BIKE_STEP_TIME : WALK_STEP_TIME);
      if (moving.t >= 1) {
        moving = null;
        onStepComplete();
      }
      return;
    }

    if (Input.consume('bike')) { toggleBike(); return; }
    if (Input.consume('start')) { runAsync(startMenu); return; }
    if (Input.consume('a')) { runAsync(interact); return; }

    const dir = Input.dirHeld();
    if (!dir) {
      faceTimer = 0;
      blockedDir = null;
      updateNpcWander(dt);
      return;
    }
    if (blockedDir && dir !== blockedDir) blockedDir = null;

    if (p.facing !== dir) {
      p.facing = dir;
      faceTimer = FACE_DELAY;
      return;
    }
    if (faceTimer > 0) { faceTimer -= dt; return; }

    const [dx, dy] = DELTA[dir];
    const tx = p.x + dx, ty = p.y + dy;

    // map edge → link to neighbor map
    if (tileAt(tx, ty) === null) {
      if (dir === blockedDir) return; // gate already warned; wait for key release
      const link = (map().links || {})[dir];
      if (link) runAsync(() => traverseLink(dir, link));
      return;
    }
    const pushedBlock = pushBlockAt(tx, ty);
    if (pushedBlock) {
      const pushed = tryPushBlock(pushedBlock, dir);
      if (!pushed) {
        if (bumpCooldown <= 0) { Sfx.bump(); bumpCooldown = 0.4; }
        return;
      }
      moving = { fromX: p.x, fromY: p.y, t: 0, pushed };
      p.x = tx; p.y = ty;
      return;
    }
    if (isSolid(tx, ty)) {
      if (bumpCooldown <= 0) { Sfx.bump(); bumpCooldown = 0.4; }
      return;
    }
    moving = { fromX: p.x, fromY: p.y, t: 0 };
    p.x = tx; p.y = ty;
  }

  function toggleBike() {
    if (!map().outdoor) {
      Sfx.bump();
      UI.toast('실내에서는 자전거를 탈 수 없습니다.');
      return;
    }
    Game.player.ridingBike = !Game.player.ridingBike;
    Sfx.select();
    UI.toast(Game.player.ridingBike ? '자전거를 탔습니다.' : '자전거에서 내렸습니다.');
  }

  function onStepComplete() {
    const p = Game.player;
    const ch = tileAt(p.x, p.y);

    if (pendingPuzzleNotice) {
      const text = pendingPuzzleNotice;
      pendingPuzzleNotice = null;
      runAsync(async () => {
        Sfx.door();
        await UI.flashScreen(1);
        await UI.say(text);
      });
      return;
    }

    // warp tiles (doors / exit mats / stairs)
    const warp = (map().warps || {})[`${p.x},${p.y}`];
    if (warp) { runAsync(() => doWarp(warp)); return; }

    // Tide-gym pressure valves permanently lower their matching water gates.
    // The solved state lives in ordinary player flags, so leaving the gym or
    // saving never resets progress halfway through the puzzle.
    const plate = map().puzzle && map().puzzle.plates && map().puzzle.plates[`${p.x},${p.y}`];
    if (plate && !p.flags[plate.flag]) {
      p.flags[plate.flag] = true;
      runAsync(async () => {
        Sfx.door();
        await UI.flashScreen(1);
        await UI.say(plate.text);
      });
      return;
    }

    // Maps can opt into encounters on other walkable tiles (for example,
    // cave floors). Outdoor maps keep tall grass as the default.
    const enc = map().encounters;
    const encounterTiles = enc && Array.isArray(enc.tiles) ? enc.tiles : ['t'];
    if (enc && encounterTiles.includes(ch) && Math.random() < enc.rate) {
      runAsync(() => startWildEncounter(enc));
      return;
    }

    // trainer line-of-sight
    for (const npc of visibleNpcs()) {
      if (!npc.trainer || npc.trainer.range <= 0) continue;
      if (Game.player.flags[npc.trainer.flag]) continue;
      if (seesPlayer(npc)) {
        runAsync(() => trainerApproach(npc));
        return;
      }
    }
  }

  // Trainers watch all four directions — sneaking behind them doesn't work.
  // When they spot the player they spin to face that direction first.
  function seesPlayer(npc) {
    const p = Game.player;
    for (const dir of ['up', 'down', 'left', 'right']) {
      const [dx, dy] = DELTA[dir];
      for (let i = 1; i <= npc.trainer.range; i++) {
        const x = npc.x + dx * i, y = npc.y + dy * i;
        if (p.x === x && p.y === y) { npc.facing = dir; return true; }
        const ch = tileAt(x, y);
        if (ch === null || mapTileIsSolid(map(), x, y) || npcAt(x, y)) break;
      }
    }
    return false;
  }

  // Ordinary residents make short, readable loops around their starting
  // point. Important interactables, trainers, and quest givers stay put so a
  // player can still find the story at the location shown by the map design.
  function canNpcWander(npc) {
    if (npc.wander === false || npc.trainer || npc.quest || npc.kind === 'rival') return false;
    if (NPC_FIXED_SPECIALS.has(npc.special)) return false;
    return true;
  }

  function wanderHome(npc) {
    const id = Game.player.map;
    if (npc._wanderMap !== id) {
      npc._wanderMap = id;
      npc._wanderHome = { x: npc.x, y: npc.y };
    }
    return npc._wanderHome;
  }

  function canNpcStep(npc, dir) {
    const [dx, dy] = DELTA[dir];
    const nx = npc.x + dx, ny = npc.y + dy;
    const ch = tileAt(nx, ny);
    if (ch === null || ['D', 'm', 'h'].includes(ch)) return false;
    if (Game.player.x === nx && Game.player.y === ny) return false;
    if (moving && moving.fromX === nx && moving.fromY === ny) return false;
    return !isSolid(nx, ny);
  }

  function updateNpcWander(dt) {
    const id = Game.player.map;
    if (wanderMapId !== id) {
      wanderMapId = id;
      wanderTimer = 1.2;
    }
    wanderTimer -= dt;
    if (wanderTimer > 0) return;
    wanderTimer = 2.2 + Math.random() * 2.8;

    const candidates = visibleNpcs().filter(npc => {
      if (!canNpcWander(npc) || npc.alert) return false;
      const home = wanderHome(npc);
      const radius = npc.wanderRadius || 2;
      return Math.abs(npc.x - home.x) <= radius && Math.abs(npc.y - home.y) <= radius &&
        Math.abs(npc.x - Game.player.x) + Math.abs(npc.y - Game.player.y) > 2;
    });
    if (!candidates.length) return;
    const npc = candidates[Math.floor(Math.random() * candidates.length)];
    const home = wanderHome(npc);
    const radius = npc.wanderRadius || 2;
    const dirs = ['up', 'down', 'left', 'right'].sort(() => Math.random() - 0.5);
    const dir = dirs.find(candidate => {
      const [dx, dy] = DELTA[candidate];
      return Math.abs(npc.x + dx - home.x) <= radius &&
        Math.abs(npc.y + dy - home.y) <= radius && canNpcStep(npc, candidate);
    });
    if (dir) runAsync(() => wanderNpc(npc, dir));
  }

  async function wanderNpc(npc, dir) {
    if (!canNpcWander(npc) || !canNpcStep(npc, dir)) return;
    npc.facing = dir;
    await stepNpc(npc, dir);
  }

  // ---------------- warps & links ----------------
  async function doWarp(warp) {
    if (Game.player.map === 'house' && warp.map === 'hometown' &&
        !Game.player.flags.sent_off && !Game.player.flags.starter) {
      await UI.sayLines([
        '엄마: 잠깐! 인사도 없이 나가려고? 여행 시작부터 스토리 순서를 건너뛰면 안 되지.',
        '계단 아래 거실에서 노란 느낌표를 찾아 말을 걸어 줘. 준비물과 다음 목적지를 알려 줄게.',
      ]);
      UI.toast('메인 임무: 거실의 엄마에게 말을 걸자.');
      return;
    }
    if (warp.map === 'mirrorgym' &&
        !Game.player.flags.story_archive_restored &&
        !Game.player.badges.includes('청록향기 배지')) {
      await UI.say('체육관 문에 붉은 오류등이 켜져 있다. 흰안개단의 위조 관측 신호가 출입 회로까지 막고 있다.');
      await UI.say('중앙정원의 기록관리자 비트나에게 관측기지에서 얻은 송신 코드를 전달하자.');
      return;
    }
    Sfx.door();
    await UI.fadeOut(280);
    const p = Game.player;
    const sourceMap = p.map;
    if (warp.returnTo) {
      Game.interiorReturn = { map: sourceMap, x: p.x, y: p.y + 1, facing: 'up' };
    }
    const destination = warp.returnWarp && Game.interiorReturn ? Game.interiorReturn : warp;
    Game.player.map = destination.map;
    Game.player.x = destination.x;
    Game.player.y = destination.y;
    Game.player.facing = destination.facing || 'down';
    if (!MAPS[destination.map].outdoor) Game.player.ridingBike = false;
    if (warp.returnWarp) Game.interiorReturn = null;
    Bgm.playMap(MAPS[destination.map].bgm);
    // Reaching a healing center makes it the blackout respawn point.
    if ((MAPS[warp.map].npcs || []).some(n => n.special === 'nurse')) {
      Game.player.respawn = { map: warp.map, x: warp.x, y: warp.y };
    }
    await UI.fadeIn(280);
  }

  async function traverseLink(dir, targetId) {
    const p = Game.player;
    if (targetId === 'route1' && p.map === 'hometown' && !p.flags.starter) {
      await UI.say('잠깐! 파트너도 없이 풀숲에 들어가려고? 자신감만 레벨 100이네.');
      await UI.say('남동쪽 빨간 지붕 연구소에서 메이플 박사님을 만나. 맨몸 진행은 공략이 아니라 사고야.');
      blockedDir = dir; // don't re-trigger until the key is released
      return;
    }
    if (targetId === 'route2' && p.map === 'stonegate' && !p.badges.includes('화강암 배지')) {
      await UI.say('북문 관리인: 정지! 이 너머는 길도 험하고 포켓몬도 성격이 급해서 배지 없이는 못 보내.');
      await UI.say('메이슨 관장부터 이기고 와. 말로 이겼다는 건 인정 안 해. 내가 어제 그 수법에 당했거든.');
      blockedDir = dir;
      return;
    }
    if (targetId === 'thunderway' && p.map === 'lakeglass' && !p.badges.includes('유리물결 배지')) {
      await UI.say('북쪽 부두 관리인: 천둥갈대길은 전류가 강해서 유리물결 배지 없이 통과시킬 수 없어.');
      await UI.say('세이라 관장에게 먼저 도전해. 물가 안전 수칙보다 배지 확인이 짧아서 이러는 건 아니야.');
      blockedDir = dir;
      return;
    }
    if (targetId === 'highrail' && p.map === 'brightgear' && !p.badges.includes('스파크기어 배지')) {
      await UI.say('고원 검문원: 별바람 고원은 세 번째 배지를 확인한 도전자만 들어갈 수 있습니다.');
      await UI.say('토렌 관장에게 다녀오세요. 머리가 번쩍인다고 관장을 찾은 것으로 처리되진 않습니다.');
      blockedDir = dir;
      return;
    }
    if (targetId === 'everbloom' && p.map === 'mistworks' &&
        !p.flags.tr_mist_director && !p.badges.includes('청록향기 배지')) {
      await UI.say('북쪽 출구의 보안 셔터가 흰안개단 신호에 잠겨 있다.');
      await UI.say('관측기지 곳곳의 송신 담당자 셋을 찾아 주파수 조각을 모은 뒤 현장책임자를 쓰러뜨리자.');
      blockedDir = dir;
      return;
    }
    const source = map();
    const target = MAPS[targetId];
    await UI.fadeOut(220);
    p.map = targetId;
    Bgm.playMap(target.bgm);
    // Neighboring maps can have very different dimensions (wide towns versus
    // narrow routes). Project the old edge position proportionally, then land
    // on the closest walkable opening of the destination edge.
    if (dir === 'up' || dir === 'down') {
      const edgeY = dir === 'up' ? target.rows.length - 1 : 0;
      const preferred = p.x / Math.max(1, source.rows[0].length - 1) * (target.rows[0].length - 1);
      const openings = [];
      for (let x = 0; x < target.rows[0].length; x++) {
        if (!mapTileIsSolid(target, x, edgeY)) openings.push(x);
      }
      if (openings.length) p.x = openings.reduce((best, x) => Math.abs(x - preferred) < Math.abs(best - preferred) ? x : best);
      p.y = edgeY;
    } else {
      const edgeX = dir === 'left' ? target.rows[0].length - 1 : 0;
      const preferred = p.y / Math.max(1, source.rows.length - 1) * (target.rows.length - 1);
      const openings = [];
      for (let y = 0; y < target.rows.length; y++) {
        if (!mapTileIsSolid(target, edgeX, y)) openings.push(y);
      }
      if (openings.length) p.y = openings.reduce((best, y) => Math.abs(y - preferred) < Math.abs(best - preferred) ? y : best);
      p.x = edgeX;
    }
    UI.toast(target.name);
    await UI.fadeIn(220);
  }

  const ROTOR_DIRECTION_NAMES = ['북쪽', '동쪽', '남쪽', '서쪽'];

  async function puzzleInteract(x, y) {
    const puzzle = map().puzzle;
    if (!puzzle) return false;
    const key = `${x},${y}`;

    const push = puzzle.push;
    if (push && key === push.resetAt) {
      if (Game.player.flags[push.solvedFlag]) {
        await UI.say('도르래가 잠겨 있다. 홈에 놓인 바위와 열린 석문은 이제 움직이지 않는다.');
        return true;
      }
      const state = pushPuzzleState(push);
      for (const block of push.blocks) state[block.id] = { x: block.x, y: block.y };
      Sfx.door();
      await UI.say(push.resetText);
      return true;
    }

    const sequence = puzzle.sequence;
    const node = sequence && sequence.nodes[key];
    if (node) {
      if (Game.player.flags[sequence.solvedFlag]) {
        Sfx.select();
        await UI.say(`${node.label}이(가) 맑게 울렸다. 「${node.tone}」 이미 완성된 세 음의 일부다.`);
        return true;
      }
      let progress = Math.max(0, Math.min(sequence.order.length - 1, Number(Game.player.flags[sequence.stateFlag]) || 0));
      Sfx.select();
      if (sequence.order[progress] !== node.id) {
        Game.player.flags[sequence.stateFlag] = 0;
        Sfx.bump();
        await UI.say(`${node.label}에서 「${node.tone}」 소리가 났다. ${sequence.resetText}`);
        return true;
      }
      progress++;
      Game.player.flags[sequence.stateFlag] = progress;
      if (progress >= sequence.order.length) {
        Game.player.flags[sequence.solvedFlag] = true;
        Sfx.statUp();
        await UI.flashScreen(1);
        await UI.say(`${node.label}에서 「${node.tone}」 소리가 났다. ${sequence.solvedText}`);
      } else {
        await UI.say(`${node.label}에서 「${node.tone}」 소리가 났다. 올바른 울림이다! (${progress}/${sequence.order.length})`);
      }
      return true;
    }

    const rotors = puzzle.rotors;
    const device = rotors && rotors.devices[key];
    if (device) {
      const state = rotorPuzzleState(rotors);
      if (Game.player.flags[rotors.solvedFlag]) {
        await UI.say(`${device.label}은(는) ${ROTOR_DIRECTION_NAMES[state[device.id]]}을 향한 채 고정되어 있다.`);
        return true;
      }
      state[device.id] = (state[device.id] + 1) % 4;
      Sfx.select();
      const solved = Object.values(rotors.devices).every(part => state[part.id] === part.target);
      if (solved) {
        Game.player.flags[rotors.solvedFlag] = true;
        Sfx.door();
        await UI.flashScreen(1);
        await UI.say(`${device.label}을(를) ${ROTOR_DIRECTION_NAMES[state[device.id]]}으로 돌렸다. ${rotors.solvedText}`);
      } else {
        await UI.say(`${device.label}을(를) 시계 방향으로 돌렸다. 지금은 ${ROTOR_DIRECTION_NAMES[state[device.id]]}을 향한다.`);
      }
      return true;
    }
    return false;
  }

  // ---------------- interaction ----------------
  async function interact() {
    const p = Game.player;
    const [dx, dy] = DELTA[p.facing];
    let tx = p.x + dx, ty = p.y + dy;

    let npc = npcAt(tx, ty);
    // talking across a counter
    if (!npc && tileAt(tx, ty) === 'k') npc = npcAt(tx + dx, ty + dy);
    if (npc) { await talkTo(npc); return; }

    const ch = tileAt(tx, ty);
    if (await puzzleInteract(tx, ty)) return;
    const sign = (map().signs || {})[`${tx},${ty}`];
    if (sign) { await UI.say(sign); return; }
    if ((map().pcs || {})[`${tx},${ty}`]) { await pcFlow(); return; }
    if (STARTER_STATIONS[ch]) { await pedestal(ch); return; }
    if (ch === 'B') { await UI.say('침대가 유혹한다. 지금 누우면 모험은 내일부터 시작될 가능성이 매우 높다.'); return; }
    if (ch === 'b') { await UI.say('현장 안내서와 지도, 「초보도 챔피언처럼 보이는 법」이라는 수상한 책이 있다.'); return; }
  }

  async function talkTo(npc) {
    // face the player
    npc.facing = OPPOSITE[Game.player.facing];
    if (npc.special === 'nurse') return nurseFlow();
    if (npc.special === 'shop') return shopFlow();
    if (npc.special === 'prof') return profFlow();
    if (npc.special === 'parent') return parentFlow();
    if (npc.special === 'townstory') return townStoryFlow();
    if (npc.special === 'ecology') return ecologyResearchFlow();
    if (npc.special === 'story') return storyFlow(npc);
    if (npc.special === 'sidequest') return sideQuestFlow(npc);
    if (npc.trainer) return trainerFlow(npc);
    await UI.sayLines(npc.dialog);
  }

  function allCaughtCreatures() {
    return Game.player.party.concat(Game.player.vault || []);
  }

  function questRequirementState(requirement) {
    const req = requirement || {};
    if (req.type === 'flags') {
      const flags = req.flags || [];
      const current = flags.filter(flag => Game.player.flags[flag]).length;
      return { done: current >= flags.length, current, total: flags.length };
    }
    if (req.type === 'identified') {
      const current = allCaughtCreatures().filter(c => c.identified).length;
      return { done: current >= req.count, current: Math.min(current, req.count), total: req.count };
    }
    if (req.type === 'caught') {
      const current = allCaughtCreatures().length;
      return { done: current >= req.count, current: Math.min(current, req.count), total: req.count };
    }
    if (req.type === 'level') {
      const current = Game.player.party.reduce((best, c) => Math.max(best, c.level), 0);
      return { done: current >= req.level, current: Math.min(current, req.level), total: req.level };
    }
    return { done: true, current: 1, total: 1 };
  }

  function npcHasQuestMarker(npc) {
    const f = Game.player.flags;
    if (npc.special === 'parent') return !f.sent_off && !f.starter;
    if (npc.special === 'prof') return !!f.sent_off && !f.starter;
    if (npc.quest) return !f[`quest_${npc.quest.id}_done`];
    if (npc.story === 'signal') {
      return Game.player.badges.includes('유리물결 배지') && !f.story_signal_brief;
    }
    if (npc.story === 'archive') {
      return (!!f.tr_mist_director && !f.story_archive_restored) ||
        (!!f.tr_eloa && !f.story_arc_reward);
    }
    return false;
  }

  function grantQuestReward(reward) {
    const r = reward || {};
    for (const [id, amount] of Object.entries(r.items || {})) {
      Game.player.bag[id] = (Game.player.bag[id] || 0) + Math.max(1, amount || 1);
    }
    if (r.money) Game.player.money += Math.max(0, r.money);
    if (r.heal) {
      for (const c of Game.player.party) {
        c.hp = c.maxHp;
        c.status = null;
        c.sleepTurns = 0;
        for (const move of c.moves) move.pp = move.maxPp;
      }
    }
    Sfx.statUp();
  }

  async function sideQuestFlow(npc) {
    const q = npc.quest;
    const f = Game.player.flags;
    const started = `quest_${q.id}_started`;
    const done = `quest_${q.id}_done`;
    if (f[done]) {
      await UI.sayLines(q.after || [`${q.giver}: 그 임무는 완벽하게 끝났어. 편집본에서는 내가 더 많이 도운 것으로 나갈 거야.`]);
      return;
    }
    if (!f[started]) {
      await UI.sayLines(q.intro);
      f[started] = true;
      Sfx.statUp();
      UI.toast(`부가 임무 등록: ${q.title}`);
    }
    const state = questRequirementState(q.requirement);
    if (!state.done) {
      await UI.sayLines(q.progress);
      UI.toast(`${q.title} ${state.current}/${state.total}`);
      return;
    }
    await UI.sayLines(q.complete);
    grantQuestReward(q.reward);
    f[done] = true;
    UI.toast(q.rewardText);
  }

  async function storyFlow(npc) {
    const f = Game.player.flags;
    if (npc.story === 'signal') {
      if (!Game.player.badges.includes('유리물결 배지')) {
        await UI.sayLines([
          '기록 기술자 비트: 요즘 관측망에 가짜 이름표가 끼어들어. 화면과 이름이 다르면 포켓몬보다 방송 장비를 먼저 의심해.',
          '북쪽 중계탑에서 신호가 내려오는데 지금은 부두가 막혀 있어. 세이라의 배지를 얻으면 다시 와 줘.',
        ]);
        return;
      }
      if (!f.story_signal_brief) {
        await UI.sayLines([
          '기록 기술자 비트: 잘 왔어. 흰안개단이 관측 신호에 가짜 종 이름을 섞고 있어.',
          '트레이너들이 자기 기록을 못 믿게 만든 뒤, 자기들 유료 스캐너만 정답이라고 팔 생각이래. 악당인데 사업계획서는 꼼꼼하더라.',
          '별바람 고원 너머 관측기지에 송신 담당자 셋이 있어. 각자 가진 주파수 조각을 모아 현장책임자의 신호를 끊어 줘.',
        ]);
        f.story_signal_brief = true;
        Sfx.statUp();
        UI.toast('메인 임무 갱신: 조작된 관측 신호');
        return;
      }
      const fragments = ['tr_mist_a', 'tr_mist_b', 'tr_mist_c'].filter(flag => f[flag]).length;
      if (!f.tr_mist_director) {
        await UI.say(`기록 기술자 비트: 주파수 조각은 ${fragments}/3개야. 셋을 모으면 현장책임자의 보호 신호를 해제할 수 있어.`);
        return;
      }
      if (!f.story_archive_restored) {
        await UI.sayLines([
          '기록 기술자 비트: 현장책임자 코드까지 얻었군. 에버블룸 중앙정원의 비트나에게 전달해.',
          '둘이 이름이 비슷하다고? 기록망 계정 만들 때 추천 닉네임을 그대로 쓴 우리 잘못이야.',
        ]);
        return;
      }
      await UI.say('기록 기술자 비트: 관측망이 정상으로 돌아왔어. 이제 모습과 이름이 다르면 적어도 우리 서버 탓은 아니야. 아마도.');
      return;
    }

    if (npc.story === 'archive') {
      if (!f.tr_mist_director && !Game.player.badges.includes('청록향기 배지')) {
        await UI.sayLines([
          '기록관리자 비트나: 도시 전체 기록이 흰안개 신호에 잠겼어. 체육관 출입 회로도 같이 묶였고.',
          '남쪽 관측기지의 송신 담당자 셋과 현장책임자를 찾아. 그의 마스터 코드가 있어야 복구할 수 있어.',
        ]);
        return;
      }
      if (!f.story_archive_restored) {
        await UI.sayLines([
          '기록관리자 비트나: 마스터 코드를 받았어. 분석해 보니 흰안개단은 포켓몬을 숨긴 게 아니라 관측 결과의 이름표를 바꾸고 있었네.',
          '모두가 정보를 불신하게 만든 다음 자기들만 정답을 파는 계획... 장사 수완을 좋은 데 썼으면 마트 체인이 됐을 텐데.',
          '위조 신호를 지웠고 체육관 회로도 열었어. 복구 작업에 쓸 만병통치제 세 개를 챙겨 뒀으니 가져가.',
        ]);
        Game.player.bag.fullheal = (Game.player.bag.fullheal || 0) + 3;
        f.story_archive_restored = true;
        Sfx.statUp();
        UI.toast('관측 기록 복구! 만병통치제 3개를 받았다!');
        return;
      }
      if (!f.tr_eloa) {
        await UI.sayLines([
          '기록관리자 비트나: 기록은 복구됐지만 누가 위조 신호를 구분할 수 있는지는 증명해야 해.',
          '엘로아 관장에게 도전해. 온실 미로는 관찰력 시험이고, 틀린 발판은 서버 오류가 아니라 네 선택이야.',
        ]);
        return;
      }
      if (!f.story_arc_reward) {
        await UI.sayLines([
          '기록관리자 비트나: 청록향기 배지까지 확인했어. 네 관측 기록이 지역 표준으로 채택됐대.',
          '흰안개단의 상위 송신지는 아직 남아 있지만 이번 도시의 조작은 완전히 끝났어.',
          '현장 조사 보상이야. 다음 지역에서 더 교묘한 가짜 정보가 나와도 직접 확인할 수 있을 거야.',
        ]);
        Game.player.bag.scanner = (Game.player.bag.scanner || 0) + 2;
        Game.player.bag.greatball = (Game.player.bag.greatball || 0) + 5;
        Game.player.money += 2000;
        f.story_arc_reward = true;
        Sfx.badge();
        UI.toast('스캐너 2개, 슈퍼볼 5개, 2000원을 받았다!');
        return;
      }
      await UI.say('기록관리자 비트나: 현재 구간의 위조 신호는 0%. 흰안개단이 다시 접속하면 이번에는 비밀번호부터 바꿀게.');
    }
  }

  // Early story hook: Wildvale is an open ecological crossroads rather than
  // a single-generation region. The quest also teaches the finite Scanner
  // economy and gives the first forest a reason to explore its side paths.
  async function ecologyResearchFlow() {
    const f = Game.player.flags;
    if (!f.ecology_brief) {
      await UI.sayLines([
        '생태조사원 아라: 잠깐! 메이플 박사님의 신입이지? 축하해, 첫 출근부터 현장 업무야.',
        '이 지방은 여러 지역의 포켓몬이 한 숲에 섞여 살아서 관측기로 이동 경로를 기록하고 있어.',
        '그런데 흰안개단이 북서쪽 관측 기록을 뜯어 갔어. 이름부터 악당 티가 나는데 본인들만 모르는 모양이야.',
        '서쪽 샛길에서 회색 외투를 찾아 줘. 숲에서 회색 외투 입고 서 있으면 열에 아홉은 그쪽이야.',
      ]);
      f.ecology_brief = true;
      if (!f.tr_mist_rookie) return;
    }
    if (!f.tr_mist_rookie) {
      await UI.say('생태조사원 아라: 서쪽 굽은 길을 봐 줘. 길보다 대놓고 수상한 사람이 더 잘 보일 거야.');
      return;
    }
    if (!f.ecology_reward) {
      await UI.sayLines([
        '생태조사원 아라: 기록 장치를 되찾았네! 다행히 데이터는 무사해. 비밀번호를 1234로 해 둔 건 안 무사하고.',
        '흰안개단은 실루엣 판독 기술을 노리는 것 같아. 다음 관측소에서도 또 멋있는 척 나타나겠지.',
        '조사 보상이야. 스캐너는 정말 모르겠을 때 쓰고, 볼은 잡고 싶은 동료에게 써. 둘 다 관상용은 아니야.',
      ]);
      Game.player.bag.scanner = (Game.player.bag.scanner || 0) + 1;
      Game.player.bag.greatball = (Game.player.bag.greatball || 0) + 2;
      f.ecology_reward = true;
      Sfx.statUp();
      UI.toast('스캐너 1개와 슈퍼볼 2개를 받았다!');
      return;
    }
    await UI.sayLines([
      '생태조사원 아라: 첫 체육관은 잘 버티는 팀이야. 약한 기술 연타로 이기려면 먼저 손가락 보험부터 들어.',
      '메이슨도 북쪽 관측소가 이상하댔어. 배지를 얻고 회색바람 고개로 가면 단서가 더 나올 거야.',
    ]);
  }

  async function parentFlow() {
    const f = Game.player.flags;
    if (!f.sent_off) {
      await UI.sayLines([
        '엄마: 드디어 일어났니? 한 번만 더 안 일어나면 이웃집 구구에게 쪼아 달라고 할 참이었어.',
        '엄마: 메이플 박사님이 연구소로 오래. 아주 중요한 선택이라는데, 아침 메뉴보다 중요해 보이더라.',
        '엄마: 가방 옆 주머니에 상처약을 넣었어. 아껴서 엔딩까지 들고 다니면 엄마가 운다.',
        '엄마: 자, 출발! 모든 챔피언도 처음엔 현관 앞에서 저장했는지 고민했단다.',
      ]);
      Game.player.bag.potion = (Game.player.bag.potion || 0) + 1;
      f.sent_off = true;
      Sfx.statUp();
      UI.toast('상처약 1개 획득 · 다음 목표: 메이플 연구소');
      return;
    }
    const ok = await UI.yesNo('엄마: 얼굴이 체력 1처럼 보이는구나.\n잠깐 쉬었다 갈래?');
    if (!ok) { await UI.say('엄마: 그래, 그 고집도 능력치라면 꽤 높겠구나. 조심히 다녀와.'); return; }
    await UI.fadeOut(300);
    Sfx.heal();
    for (const c of Game.player.party) {
      c.hp = c.maxHp;
      c.status = null;
      c.sleepTurns = 0;
      for (const m of c.moves) m.pp = m.maxPp;
    }
    Game.player.respawn = { map: Game.player.map, x: Game.player.x, y: Game.player.y };
    await wait(500);
    await UI.fadeIn(300);
    await UI.say('엄마: 자, 모두 완벽하게 회복했어. 너도 간식 먹었으니 사실상 풀피야.');
  }

  async function townStoryFlow() {
    const f = Game.player.flags;
    if (!f.willow_notice) {
      await UI.sayLines([
        '기록관 하루: 잠깐, 네가 메이플 박사님의 새 현장 연구원이구나. 윌로우브룩에 이상한 일이 생겨서 기다리고 있었어.',
        '기록관 하루: 연못 수로에서 포켓몬의 실루엣과 이름이 서로 다른 기록이 발견됐어. 누군가 관측 표를 바꿔 끼운 모양이야.',
        '기록관 하루: 아직은 작은 마을의 소문이지만, 북쪽 트레일로 번지면 모두가 자기 눈을 믿지 못하게 돼. 연구소에서 파트너를 고른 뒤 이 일을 기억해 줘.',
      ]);
      f.willow_notice = true;
      UI.toast('윌로우브룩의 이상 기록을 기억했다.');
      return;
    }
    if (!f.starter) {
      await UI.say('기록관 하루: 먼저 연구소에서 파트너를 골라. 맨몸으로 관측 기록을 쫓는 건 용기가 아니라 서류상 사고야.');
      return;
    }
    if (!f.willow_dispatch) {
      await UI.sayLines([
        '기록관 하루: 파트너를 만났구나. 네가 직접 본 첫 실루엣과 연구소의 기록을 비교해 보면 단서가 될 거야.',
        '기록관 하루: 북쪽 펀웨이에서 이상한 장치를 든 사람을 만나면 기록을 빼앗기지 말고, 배틀로 멈춰 세워 줘.',
        '기록관 하루: 진짜 이름은 스캐너가 알려 주겠지만, 무엇을 믿을지는 네가 정해야 해.',
      ]);
      f.willow_dispatch = true;
      Sfx.statUp();
      UI.toast('새 단서: 펀웨이의 조작된 관측 기록');
      return;
    }
    if (f.tr_mist_rookie && !f.willow_return) {
      await UI.sayLines([
        '기록관 하루: 장치를 되찾았네. 안에 윌로우브룩의 수로 지도가 들어 있었어. 단순한 장난은 아니었군.',
        '기록관 하루: 메이플 박사님에게 지도를 전해 줘. 다음 흔적은 새싹숲 쪽에서 찾게 될 거야.',
      ]);
      f.willow_return = true;
      UI.toast('윌로우브룩 기록을 박사에게 전하자.');
      return;
    }
    await UI.say('기록관 하루: 물빛 연못의 기록은 잠잠해졌지만, 북쪽 숲의 안개는 아직 걷히지 않았어. 눈으로 보고, 기록하고, 의심해 줘.');
  }

  async function nurseFlow() {
    await UI.say('간호사: 어서 오세요. 표정을 보니 접수 사유는 굳이 안 물어봐도 되겠네요.');
    const ok = await UI.yesNo('간호사: 동료들을\n완전히 회복시켜 드릴까요?');
    if (!ok) { await UI.say('간호사: 알겠습니다. 하지만 체력 빨간색은 패션이 아니랍니다.'); return; }
    await UI.fadeOut(250);
    Sfx.heal();
    for (const c of Game.player.party) {
      c.hp = c.maxHp;
      c.status = null;
      c.sleepTurns = 0;
      for (const m of c.moves) m.pp = m.maxPp;
    }
    Game.player.respawn = { map: Game.player.map, x: Game.player.x, y: Game.player.y };
    await wait(500);
    await UI.fadeIn(250);
      await UI.sayLines([
      '간호사: 끝났습니다! HP, 상태 이상, PP까지 전부 정상이에요.',
      '간호사: 또 만나요. 그래도 문 나가자마자 돌아오면 조금 놀랄 거예요.',
    ]);
  }

  async function shopFlow() {
    await UI.sayLines([
      '점원: 어서 오세요! 돈이 없어도 구경은 무료, 충동구매는 유료입니다.',
      '점원: 상처에는 약, 포획에는 볼! 기합으로 해결되는 상품은 아직 입고 전이에요.',
    ]);
    await UI.shopScreen();
    await UI.say('점원: 감사합니다! 풀숲에서 후회하지 말고 필요할 때 도구를 써 주세요!');
  }

  async function profFlow() {
    const f = Game.player.flags;
    if (!f.starter) {
      if (!f.prof_briefed) {
        await UI.sayLines([
          '메이플: 왔구나! 나는 메이플 박사. 여러 지방 포켓몬이 한 생태계에서 사는 방식을 연구한단다.',
          '메이플: 여기선 오래전 알려진 종과 최근 발견된 종이 같은 길을 걸어. 도감 한 권으로는 정리가 안 돼서 내 책상도 저 모양이지.',
          '메이플: 연구에는 현장 데이터가 필요하고, 현장에는 젊은 무릎이 필요하단다. 아주 과학적인 인선이지.',
          '메이플: 아래쪽에 나란히 놓인 세 선택대를 하나씩 조사해 보렴. 각 장치에는 서로 다른 후보 한 마리의 자료가 연결되어 있단다.',
          '메이플: 고민이 길어져도 괜찮다. 렉스만 옆에서 타들어 갈 테니까.',
        ]);
        f.prof_briefed = true;
        Sfx.statUp();
        UI.toast('메인 임무 갱신: 세 선택대에서 첫 파트너를 선택하자.');
      } else {
        await UI.say('메이플: 아래쪽 세 선택대는 각각 한 후보 전용이란다. 하나씩 조사해 설명을 비교한 뒤 마음에 드는 장치를 다시 확인하렴.');
      }
    } else if (!f.first_partner_scanned) {
      const starter = Game.player.party.find(c => c.uid === f.starter_uid) || Game.player.party[0];
      await firstScannerTutorial(starter);
    } else {
      await UI.sayLines([
        `메이플: ${creatureName(Game.player.party[0])}와는 잘 지내니? 서로 도망 안 간 걸 보니 훌륭하구나.`,
        '메이플: 북쪽 펀웨이에는 여러 지방 포켓몬이 섞여 살아. 실루엣 보고 정답 외쳤다가 민망해도 연구 과정이란다.',
        '메이플: 몬스터볼도 챙겨. 팀의 빈자리는 가능성이지만, 빈 가방은 그냥 준비 부족이란다.',
      ]);
    }
  }

  async function firstScannerTutorial(starter) {
    if (!starter || starter.identified) {
      if (starter) identifyCreature(starter);
      return;
    }
    if (!(Game.player.bag.scanner > 0)) Game.player.bag.scanner = 1;
    await UI.sayLines([
      '메이플: 배틀 전에 가장 중요한 장비부터 익히자. 가방에 넣어 둔 스캐너는 실루엣 뒤의 정체를 확인하는 도구란다.',
      '메이플: 지금 가방을 열어 스캐너를 선택하고, 방금 만난 첫 파트너에게 사용해 보렴.',
      '메이플: 첫 스캔을 마치기 전에는 이름을 함부로 추측할 수 없게 해 두었다. 틀린 확신은 관찰보다 위험하거든.',
    ]);
    while (!starter.identified) {
      const id = await UI.bagScreen({});
      if (id !== 'scanner') {
        await UI.say('메이플: 이번 연습에서는 가방의 스캐너를 선택하렴. 취소해도 실습은 건너뛸 수 없단다.');
        continue;
      }
      const target = await UI.partyScreen({ title: '첫 파트너에게 스캐너를 사용하세요.', forced: true });
      if (target < 0 || Game.player.party[target] !== starter) continue;
      Game.player.bag.scanner--;
      identifyCreature(starter);
      Sfx.statUp();
      await UI.say(`스캐너 결과: ${speciesName(starter)}! 실루엣이 걷히고 진짜 모습이 드러났다!`);
    }
    await UI.sayLines([
      '메이플: 좋아, 이제부터 동료 메뉴의 관찰 기록을 보고 이름을 추측할 수 있단다.',
      '메이플: 정답이면 스캐너 없이도 모습을 확인할 수 있지만, 틀리면 동료가 실망해서 떠나 버려. 충분히 관찰한 뒤 결정하렴.',
    ]);
    UI.toast('이름 추측 기능이 해금되었다!');
  }

  async function pedestal(station) {
    if (Game.player.flags.starter) {
      await UI.say('이 책상은 이제 비어 있다.');
      return;
    }
    if (!Game.player.flags.prof_briefed) {
      await UI.say('후보의 자료가 잠겨 있다. 먼저 노란 느낌표가 있는 메이플 박사님께 설명을 듣자.');
      return;
    }
    const candidate = STARTER_STATIONS[station];
    if (!candidate) return;
    const id = await UI.starterChoice(candidate);
    if (!id) return; // backed out — the three pedestals stay available
    const ok = await UI.yesNo('이 파트너 후보를 선택할까요?');
    if (!ok) return;
    const starter = makeCreature(id, 6);
    Game.player.party.push(starter);
    Game.player.flags.starter = true;
    Game.player.flags.starter_id = id;
    Game.player.flags.starter_uid = starter.uid;
    Sfx.caught();
    await UI.say('새로운 파트너가 동료가 되었다! 첫인상은 실루엣이지만 우정은 정상 영업 중이다.');
    await UI.sayLines([
      '메이플: 아주 잘 어울리는구나! 사실 누구를 골라도 이 말은 해 주려고 했단다.',
      '메이플: 몬스터볼 5개도 가져가렴. 야생 포켓몬은 체력을 줄이면 잡기 쉬워져. 너무 줄여서 눕히지는 말고.',
    ]);
    Game.player.bag.pokeball = (Game.player.bag.pokeball || 0) + 5;
    UI.toast('몬스터볼 5개를 손에 넣었다!');
    await firstScannerTutorial(starter);

    // The rival grabs the counter-pick and challenges immediately.
    const rivalId = RIVAL_COUNTER[id];
    await UI.sayLines([
      '렉스: 드디어 골랐냐? 그럼 난 네 선택을 완벽하게 이기는 후보를 고르지. 방금 즉흥으로 정한 건 아니고 전략이야.',
      '렉스: 바로 승부하자! 준비 시간은 충분했어. 네가 고민하는 동안 나는 마음속으로 세 번 이겼거든.',
    ]);
    const tr = {
      flag: 'tr_rex', name: '라이벌 렉스',
      party: [[rivalId, 5]], prize: 175,
    };
    const result = await Battle.start({ trainer: tr });
    Game.player.flags.rex_gone = true;
    if (result === 'win') {
      Game.player.flags.tr_rex = true;
      await UI.sayLines([
        '렉스: ...방금 건 튜토리얼이라 일부러 진 거야. 튜토리얼에 상금이 왜 나가는지는 묻지 마.',
        '렉스: 다음엔 두 배로 강해져서 온다. 정확히 뭘 두 배로 할지는 가면서 정할 거고!',
      ]);
      await UI.say('렉스는 패배 로그가 저장되기 전에 연구소 밖으로 뛰쳐나갔다.');
      await UI.sayLines([
        '메이플: 저 아이는 패배보다 변명을 빨리 배우는구나. 그래도 좋은 경쟁 상대가 될 게다.',
        '메이플: 필요하면 집에서 쉬고 북쪽 펀웨이로 가렴. 스톤게이트 체육관은 변명을 배지로 바꿔 주진 않는단다.',
      ]);
    } else if (result === 'lose') {
      await blackout();
      await UI.sayLines([
        '연구소 너머에서 렉스가 벌써 우승 소감을 세 번째 반복하는 소리가 들린다.',
        '괜찮아. 쉬고 풀숲에서 훈련하자. 첫 판 패배는 흑역사가 아니라 성장 서사의 재료다.',
      ]);
    }
  }

  // ---------------- trainers ----------------
  async function trainerFlow(npc) {
    const tr = npc.trainer;
    if (Game.player.flags[tr.flag]) {
      await UI.sayLines(tr.after);
      return;
    }
    const missingRequirements = (tr.requiresFlags || []).filter(flag => !Game.player.flags[flag]);
    if (missingRequirements.length) {
      await UI.sayLines(tr.locked || ['아직 이 승부를 시작할 조건이 갖춰지지 않았다. 주변을 더 조사하자.']);
      return;
    }
    await UI.sayLines(tr.intro);
    let battleTrainer = tr;
    if (tr.rivalStarter) {
      const counterId = RIVAL_COUNTER[Game.player.flags.starter_id] || 'charmander';
      battleTrainer = Object.assign({}, tr, {
        party: [[counterId, tr.rivalStarter.level], ...tr.party],
      });
    }
    const result = await Battle.start({ trainer: battleTrainer });
    if (result === 'win') {
      Game.player.flags[tr.flag] = true;
      if (tr.flag === 'tr_cal' && !Game.player.flags.scanner_rewarded) {
        Game.player.bag.scanner = (Game.player.bag.scanner || 0) + 1;
        Game.player.flags.scanner_rewarded = true;
        Sfx.statUp();
        await UI.say('\uC815\uCC30\uBCD1\uC774 \uBCF4\uB2F5\uC73C\uB85C \uC2A4\uCE94\uB108\uB97C \uD558\uB098 \uBC1B\uC558\uB2E4!');
      }
      await UI.say(`${tr.name}: ${tr.loseText}`);
      if (tr.reward) {
        const amount = Math.max(1, tr.reward.amount || 1);
        Game.player.bag[tr.reward.item] = (Game.player.bag[tr.reward.item] || 0) + amount;
        Sfx.statUp();
        await UI.say(tr.reward.text || `${ITEMS[tr.reward.item].name}을(를) ${amount}개 받았다!`);
      }
      if (tr.badge && !Game.player.badges.includes(tr.badge.name)) {
        Game.player.badges.push(tr.badge.name);
        Sfx.badge();
        await UI.say(tr.badge.received);
        await UI.say(tr.badge.description);
      }
      await UI.sayLines(tr.after);
    } else if (result === 'lose') {
      await blackout();
    }
  }

  async function trainerApproach(npc) {
    npc.alert = 1;
    Sfx.encounter();
    await wait(700);
    npc.alert = 0;
    // walk along the line of sight until adjacent to the player
    const p = Game.player;
    while (Math.abs(npc.x - p.x) + Math.abs(npc.y - p.y) > 1) {
      await stepNpc(npc, npc.facing);
    }
    p.facing = OPPOSITE[npc.facing];
    await trainerFlow(npc);
  }

  async function stepNpc(npc, dir) {
    const [dx, dy] = DELTA[dir];
    npc.ox = 0; npc.oy = 0;
    for (let k = 1; k <= 8; k++) {
      npc.ox = dx * 2 * k; npc.oy = dy * 2 * k;
      await wait(20);
    }
    npc.x += dx; npc.y += dy;
    npc.ox = 0; npc.oy = 0;
  }

  // ---------------- battles from the overworld ----------------
  async function startWildEncounter(enc) {
    const total = enc.table.reduce((s, [, w]) => s + w, 0);
    let roll = randInt(1, total);
    let speciesId = enc.table[0][0];
    for (const [id, w] of enc.table) {
      roll -= w;
      if (roll <= 0) { speciesId = id; break; }
    }
    const level = randInt(enc.levels[0], enc.levels[1]);
    const result = await Battle.start({ wild: makeCreature(speciesId, level) });
    if (result === 'lose') await blackout();
  }

  async function blackout() {
    await UI.say('배틀할 수 있는 동료가 더 이상 없다!');
    Game.player.money = Math.floor(Game.player.money / 2);
    await UI.say('눈앞이 캄캄해졌다!');
    await UI.fadeOut(600);
    for (const c of Game.player.party) {
      c.hp = c.maxHp; c.status = null; c.sleepTurns = 0;
      for (const m of c.moves) m.pp = m.maxPp;
    }
    const r = Game.player.respawn;
    Game.player.map = r.map; Game.player.x = r.x; Game.player.y = r.y;
    Game.player.facing = 'down';
    Bgm.playMap(MAPS[r.map].bgm);
    await wait(400);
    await UI.fadeIn(400);
    await UI.say('지친 동료들을 감싸 안고 안전한 곳으로 서둘러 돌아왔다...');
  }

  // ---------------- start menu ----------------
  function mainQuestStatus() {
    const f = Game.player.flags;
    if (Game.player.badges.includes('청록향기 배지')) {
      return f.story_arc_reward
        ? '현재 구간의 관측 신호를 복구했다. 흰안개단의 다음 송신지는 아직 불명이다.'
        : '청록향기 배지를 비트나에게 보여 주고 조사 결과를 보고하자.';
    }
    if (!f.starter && !f.sent_off) return '우리 집 1층 거실에서 엄마에게 여행 준비를 듣자.';
    if (!f.starter && !f.prof_briefed) return '윌로우브룩의 메이플 연구소에서 박사님께 말을 걸자.';
    if (!f.starter) return '연구소 아래쪽의 세 선택대를 조사해 첫 파트너를 선택하자.';
    if (!f.first_partner_scanned) return '첫 파트너에게 스캐너를 사용해 정체를 확인하자.';
    if (!f.ecology_brief) return '새싹숲의 생태조사원 아라를 찾아가자.';
    if (!f.tr_mist_rookie) return '새싹숲 서쪽에서 도난당한 관측 기록을 되찾자.';
    if (!f.ecology_reward) return '관측 기록을 아라에게 돌려주자.';
    if (!Game.player.badges.includes('유리물결 배지')) return '레이크글라스의 세이라에게 두 번째 배지를 얻자.';
    const fragments = ['tr_mist_a', 'tr_mist_b', 'tr_mist_c'].filter(flag => f[flag]).length;
    if (f.story_archive_restored) return '복구된 체육관에서 엘로아에게 도전하자.';
    if (f.tr_mist_director && !f.story_archive_restored) return '마스터 코드를 에버블룸의 기록관리자 비트나에게 전달하자.';
    if (fragments >= 3 && !f.tr_mist_director) return '기지 북쪽의 현장책임자 베일을 쓰러뜨리자.';
    if (!f.story_signal_brief) return '브라이트기어 서쪽의 기록 기술자 비트에게 조작 신호를 물어보자.';
    if (fragments < 3) return `흰안개 관측기지에서 주파수 조각을 모으자. (${fragments}/3)`;
    return '기지 북쪽의 현장책임자 베일을 쓰러뜨리자.';
  }

  async function questLog() {
    const lines = [`[메인] ${mainQuestStatus()}`];
    const sideQuests = [];
    for (const m of Object.values(MAPS)) {
      for (const npc of (m.npcs || [])) {
        if (!npc.quest) continue;
        const q = npc.quest;
        const started = Game.player.flags[`quest_${q.id}_started`];
        const done = Game.player.flags[`quest_${q.id}_done`];
        if (!started && !done) continue;
        if (done) {
          sideQuests.push(`[완료] ${q.title}`);
        } else {
          const state = questRequirementState(q.requirement);
          sideQuests.push(`[부가] ${q.title} (${state.current}/${state.total})`);
        }
      }
    }
    if (sideQuests.length) lines.push(...sideQuests);
    else lines.push('아직 등록한 부가 임무가 없다. 머리 위에 노란 느낌표가 뜬 NPC에게 말을 걸어 보자.');
    await UI.sayLines(lines);
  }

  async function startMenu() {
    Sfx.select();
    while (true) {
      const menuOptions = ['동료', '가방', '임무', '배지', '저장'];
      if (map().outdoor) menuOptions.push(Game.player.ridingBike ? '자전거 내리기' : '자전거 타기');
      menuOptions.push('나가기');
      const pick = await UI.choose(menuOptions, {
        style: { right: '12px', top: '12px' },
      });
      if (pick === -1) return;
      if (pick === menuOptions.length - 1) {
        const exitChoice = await UI.choose([
          '저장하고 타이틀로',
          '저장하지 않고 타이틀로',
          '취소',
        ], {
          style: { right: '12px', top: '12px', width: '210px' },
        });
        if (exitChoice === 2 || exitChoice === -1) continue;
        if (exitChoice === 0) {
          if (!SaveSys.toLocal()) {
            await UI.say('저장에 실패했습니다! 타이틀로 돌아갈 수 없습니다.');
            continue;
          }
          UI.toast('게임을 저장했습니다!');
          await wait(350);
        }
        await returnToTitle();
        return;
      }
      if (pick === 0) await partyManage();
      if (pick === 1) await overworldBag();
      if (pick === 2) await questLog();
      if (pick === 3) {
        const b = Game.player.badges;
        await UI.say(b.length ? `배지: ${b.join(', ')}` : '아직 배지가 없다. 스톤게이트 체육관이 기다리고 있다!');
      }
      if (pick === 4) {
        const s = await UI.choose(['브라우저에 저장', '저장 코드 받기', '취소'], {
          style: { right: '12px', top: '12px' },
        });
        if (s === 0) {
          UI.toast(SaveSys.toLocal() ? '게임을 저장했습니다!' : '저장에 실패했습니다!');
          Sfx.heal();
        } else if (s === 1) {
          SaveSys.toLocal();
          await UI.saveModal(SaveSys.exportCode());
        }
      }
      if (map().outdoor && pick === 5) { toggleBike(); continue; }
    }
  }

  async function partyManage() {
    while (true) {
      const i = await UI.partyScreen({ title: '동료' });
      if (i === -1) return;
      const c = Game.player.party[i];
      const guessLabel = c.identified
        ? '정체 확인 완료'
        : Game.player.flags.guess_unlocked ? '이름 추측' : '이름 추측 (잠김)';
      const action = await UI.choose(['요약 보기', '관찰 기록', guessLabel, '동료 순서 변경', '취소'], {
        style: { right: '12px', bottom: '90px', width: '210px' },
      });
      if (action === 0) {
        await UI.summaryScreen(c);
        continue;
      }
      if (action === 1) {
        await UI.hintRecordScreen(c);
        continue;
      }
      if (action === 2) {
        if (c.identified) { await UI.say(`${speciesName(c)}은(는) 이미 정체가 확인된 동료다!`); continue; }
        if (!Game.player.flags.guess_unlocked) {
          await UI.say('첫 파트너에게 스캐너를 사용하는 튜토리얼을 마쳐야 이름을 추측할 수 있다.');
          continue;
        }
        if (Game.player.party.length <= 1) {
          await UI.say('마지막 동료를 잃을 수는 없다. 스캐너로 정체를 확인하자.');
          continue;
        }
        const guess = await UI.guessModal(c);
        if (guess === null) continue;
        if (!guess.trim()) { await UI.say('추측할 이름을 입력해야 한다.'); continue; }
        if (guessMatchesSpecies(c, guess)) {
          identifyCreature(c);
          Sfx.statUp();
          await UI.flashScreen(2);
          await UI.say(`정답이다! 실루엣이 걷히며 ${speciesName(c)}의 모습이 드러났다!`);
        } else {
          const actualName = speciesName(c);
          Game.player.party.splice(i, 1);
          Sfx.cancel();
          await UI.say(`${actualName}은(는) 실망하며 도망갔다.`);
        }
        continue;
      }
      if (action === -1 || action === 4) continue;
      if (Game.player.party.length < 2) { UI.toast('아직 교체할 동료가 없습니다!'); continue; }
      const j = await UI.partyScreen({ title: '누구와 교체할까요?' });
      if (j === -1 || j === i) continue;
      const party = Game.player.party;
      [party[i], party[j]] = [party[j], party[i]];
      Sfx.select();
    }
  }

  async function pcFlow() {
    await UI.say('포켓몬 보관 시스템을 실행했다.');
    await UI.storageScreen();
    await UI.say('보관 시스템과의 연결을 종료했다.');
  }

  async function learnMoveOutsideBattle(c, moveId) {
    if (c.moves.some(m => m.id === moveId)) return;
    const mv = MOVES[moveId];
    if (c.moves.length < 4) {
      c.moves.push({ id: moveId, pp: mv.pp, maxPp: mv.pp });
      Sfx.statUp();
      await UI.say(`${creatureName(c)}\uC774(\uAC00) ${mv.name}\uC744(\uB97C) \uBC30\uC6E0\uB2E4!`);
      return;
    }
    await UI.say(`${creatureName(c)}\uC774(\uAC00) ${mv.name}\uC744(\uB97C) \uBC30\uC6B0\uACE0 \uC2F6\uC5B4 \uD55C\uB2E4. \uD558\uC9C0\uB9CC \uC774\uBBF8 \uAE30\uC220\uC744 4\uAC1C \uC54C\uACE0 \uC788\uB2E4.`);
    const yes = await UI.yesNo(`${mv.name}\uC744(\uB97C) \uBC30\uC6B8 \uC790\uB9AC\uB97C \uB9CC\uB4E4\uAE30 \uC704\uD574 \uAE30\uC220 \uD558\uB098\uB97C \uC78A\uC744\uAE4C\uC694?`);
    if (!yes) {
      await UI.say(`${creatureName(c)}\uC740(\uB294) ${mv.name}\uC744(\uB97C) \uBC30\uC6B0\uC9C0 \uC54A\uC558\uB2E4.`);
      return;
    }
    UI.setPrompt('\uC5B4\uB5A4 \uAE30\uC220\uC744 \uC78A\uC744\uAE4C\uC694?');
    const pick = await UI.choose(c.moves.map(m => MOVES[m.id].name).concat('\uCDE8\uC18C'),
      { style: { right: '14px', bottom: '126px' } });
    UI.hideDialog();
    if (pick === -1 || pick === 4) {
      await UI.say(`${creatureName(c)}\uC740(\uB294) ${mv.name}\uC744(\uB97C) \uBC30\uC6B0\uC9C0 \uC54A\uC558\uB2E4.`);
      return;
    }
    const old = MOVES[c.moves[pick].id].name;
    c.moves[pick] = { id: moveId, pp: mv.pp, maxPp: mv.pp };
    await UI.say(`\uD558\uB098... \uB458... \uBF55! ${creatureName(c)}\uC740(\uB294) ${old}\uC744(\uB97C) \uC78A\uACE0 ${mv.name}\uC744(\uB97C) \uBC30\uC6E0\uB2E4!`);
  }

  async function useRareCandyOutsideBattle(c, id) {
    if (c.level >= 100) {
      await UI.say('\uB808\uBCA8 100\uC5D0\uAC8C\uB294 \uC544\uBB34 \uD6A8\uACFC\uB3C4 \uC5C6\uB2E4.');
      return;
    }
    const oldMax = c.maxHp;
    c.level++;
    c.exp = expForLevel(c.level);
    calcStats(c);
    c.hp = Math.min(c.maxHp, c.hp + (c.maxHp - oldMax));
    Game.player.bag[id]--;
    Sfx.levelUp();
    await UI.say(`${creatureName(c)}\uC758 \uB808\uBCA8\uC774 ${c.level}(\uC73C)\uB85C \uC62C\uB790\uB2E4!`);

    const beforeEvolution = SPECIES[c.species];
    for (const entry of beforeEvolution.learnset.filter(e => e.lv === c.level)) {
      await learnMoveOutsideBattle(c, entry.move);
    }
    if (!beforeEvolution.evolve || c.level < beforeEvolution.evolve.at) return;

    const oldName = creatureName(c);
    await UI.say('\uBB50\uC9C0? \uC9C4\uD654\uD558\uB824\uACE0 \uD55C\uB2E4!');
    Sfx.evolve();
    await UI.flashScreen(4);
    const preEvolutionMax = c.maxHp;
    c.species = beforeEvolution.evolve.to;
    c.revealedHints = [];
    calcStats(c);
    c.hp = Math.min(c.maxHp, c.hp + (c.maxHp - preEvolutionMax));
    await UI.say(`\uCD95\uD558\uD569\uB2C8\uB2E4! ${oldName}\uC774(\uAC00) ${creatureName(c)}(\uC73C)\uB85C \uC9C4\uD654\uD588\uB2E4!`);
    for (const entry of SPECIES[c.species].learnset.filter(e => e.lv === c.level)) {
      await learnMoveOutsideBattle(c, entry.move);
    }
  }

  async function overworldBag() {
    while (true) {
      const id = await UI.bagScreen({});
      if (!id) return;
      if (ITEMS[id].kind === 'scanner') {
        const t = await UI.partyScreen({ title: '\uB204\uAD6C\uC758 \uC815\uCCB4\uB97C \uD655\uC778\uD560\uAE4C\uC694?' });
        if (t === -1) continue;
        const c = Game.player.party[t];
        if (c.identified) { await UI.say('\uC774\uBBF8 \uC815\uCCB4\uAC00 \uBC1D\uD600\uC9C4 \uB3D9\uB8CC\uC785\uB2C8\uB2E4!'); continue; }
        const unlockedBefore = Game.player.flags.guess_unlocked === true;
        identifyCreature(c);
        Game.player.bag[id]--;
        Sfx.statUp();
        await UI.say(`\uC2A4\uCE94\uB108 \uACB0\uACFC: ${speciesName(c)}\uC785\uB2C8\uB2E4!`);
        if (!unlockedBefore && Game.player.flags.guess_unlocked) {
          await UI.say('첫 파트너의 스캔을 마쳤다! 이제 동료 메뉴에서 이름을 추측할 수 있다.');
        }
        continue;
      }
      if (ITEMS[id].kind === 'level') {
        const t = await UI.partyScreen({ title: '\uB204\uAD6C\uC5D0\uAC8C \uC774\uC0C1\uD55C\uC0AC\uD0D5\uC744 \uC0AC\uC6A9\uD560\uAE4C\uC694?' });
        if (t === -1) continue;
        await useRareCandyOutsideBattle(Game.player.party[t], id);
        continue;
      }
      if (ITEMS[id].kind === 'orb') { await UI.say('볼은 배틀에서 사용하는 것이 좋다!'); continue; }
      if (ITEMS[id].kind === 'hint') { await UI.say('힌트는 배틀할 때 사용할 수 있다!'); continue; }
      const t = await UI.partyScreen({ title: '누구에게 사용할까요?' });
      if (t === -1) continue;
      const c = Game.player.party[t];
      const it = ITEMS[id];
      if (it.kind === 'heal') {
        if (c.hp <= 0 || c.hp >= c.maxHp) { await UI.say('아무 효과도 없다.'); continue; }
        const from = c.hp;
        c.hp = Math.min(c.maxHp, c.hp + it.amount);
        Game.player.bag[id]--;
        Sfx.heal();
        await UI.say(`${creatureName(c)}의 체력이 ${c.hp - from} 회복되었다!`);
      } else {
        const works = c.hp > 0 && c.status && (it.cures.includes('ALL') || it.cures.includes(c.status));
        if (!works) { await UI.say('아무 효과도 없다.'); continue; }
        c.status = null; c.sleepTurns = 0;
        Game.player.bag[id]--;
        Sfx.heal();
        await UI.say(`${creatureName(c)}의 상태 이상이 사라졌다!`);
      }
    }
  }

  // ---------------- drawing ----------------
  function playerRenderPos() {
    const p = Game.player;
    let px = p.x * TILE, py = p.y * TILE;
    if (moving) {
      px = (moving.fromX + (p.x - moving.fromX) * moving.t) * TILE;
      py = (moving.fromY + (p.y - moving.fromY) * moving.t) * TILE;
    }
    return [px, py];
  }

  function drawPuzzleFloor(ctx, camX, camY) {
    const puzzle = map().puzzle;
    if (!puzzle) return;
    const push = puzzle.push;
    if (push) {
      for (const goal of push.goals) {
        const x = goal.x * TILE - camX, y = goal.y * TILE - camY;
        ctx.fillStyle = Game.player.flags[push.solvedFlag] ? '#f4d35e' : '#5ed6c8';
        ctx.fillRect(x + 3, y + 3, 10, 2);
        ctx.fillRect(x + 3, y + 11, 10, 2);
        ctx.fillRect(x + 3, y + 5, 2, 6);
        ctx.fillRect(x + 11, y + 5, 2, 6);
      }
    }
    const sequence = puzzle.sequence;
    if (sequence) {
      const progress = Number(Game.player.flags[sequence.stateFlag]) || 0;
      let index = 0;
      for (const key of Object.keys(sequence.nodes)) {
        const [tx, ty] = key.split(',').map(Number);
        ctx.fillStyle = Game.player.flags[sequence.solvedFlag] || index < progress ? '#f4d35e' : '#70d6c8';
        ctx.fillRect(tx * TILE - camX + 6, ty * TILE - camY + 2, 4, 3);
        index++;
      }
    }
    const rotors = puzzle.rotors;
    if (rotors) {
      const state = rotorPuzzleState(rotors);
      const vectors = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      for (const [key, device] of Object.entries(rotors.devices)) {
        const [tx, ty] = key.split(',').map(Number);
        const x = tx * TILE - camX + 8, y = ty * TILE - camY + 8;
        const dir = state[device.id] % 4;
        const [dx, dy] = vectors[dir];
        ctx.fillStyle = Game.player.flags[rotors.solvedFlag] ? '#f4d35e' : '#9fe7ff';
        ctx.fillRect(x - 1, y - 1, 3, 3);
        for (let i = 2; i <= 5; i++) ctx.fillRect(x + dx * i - 1, y + dy * i - 1, 3, 3);
      }
    }
  }

  function draw(ctx) {
    const m = map();
    const w = mapW(), h = mapH();
    const VW = Game.viewW; // logical viewport width adapts to the screen
    const [prx, pry] = playerRenderPos();

    let camX, camY;
    camX = w * TILE <= VW ? -(VW - w * TILE) / 2
      : Math.max(0, Math.min(w * TILE - VW, prx - (VW - TILE) / 2));
    camY = h * TILE <= VIEW_H ? -(VIEW_H - h * TILE) / 2
      : Math.max(0, Math.min(h * TILE - VIEW_H, pry - (VIEW_H - TILE) / 2));
    // snap the camera to whole device pixels (the canvas runs at 2x) —
    // fractional scroll offsets cause visible seams between tile rows
    camX = Math.round(camX * 2) / 2;
    camY = Math.round(camY * 2) / 2;

    ctx.fillStyle = '#101018';
    ctx.fillRect(0, 0, VW, VIEW_H);

    const mapId = Game.player.map;
    const indoor = !m.outdoor;
    const visualObjects = m.objects || m.furniture || [];
    const furnitureAnchors = new Set(visualObjects.map(item => `${item.x},${item.y}`));
    const x0 = Math.floor(Math.max(0, camX) / TILE) - 1;
    const y0 = Math.floor(Math.max(0, camY) / TILE) - 1;
    const xSpan = Math.ceil(VW / TILE) + 3;
    for (let y = Math.max(0, y0); y < Math.min(h, y0 + 14); y++) {
      for (let x = Math.max(0, x0); x < Math.min(w, x0 + xSpan); x++) {
        // building footprints render as grass; the decal image goes on top
        const ch = GameAssets.tileCovered(mapId, x, y) ? '.' : tileAt(x, y);
        const dx = x * TILE - camX, dy = y * TILE - camY;
        const furnitureAnchor = indoor && furnitureAnchors.has(`${x},${y}`);
        const drawn = furnitureAnchor
          ? GameAssets.drawTileBase(ctx, ch, dx, dy, indoor, m.tileset, x, y)
          : GameAssets.drawTile(ctx, ch, dx, dy, indoor, m.tileset, x, y);
        if (!drawn) {
          ctx.drawImage(Sprites.tile(furnitureAnchor ? '_' : ch, indoor), dx, dy);
        }
      }
    }
    drawPuzzleFloor(ctx, camX, camY);
    GameAssets.drawDecals(ctx, mapId, camX, camY);

    // entities sorted by y so lower ones draw in front
    const ents = [];
    for (const furniture of visualObjects) {
      const footprint = INTERIOR_FURNITURE_FOOTPRINTS[furniture.ch] || [0, 0, 1, 1];
      const [, oy, , height] = footprint;
      ents.push({
        y: (furniture.y + oy + height - 1) * TILE,
        draw: () => {
          const fx = furniture.x * TILE - camX;
          const fy = furniture.y * TILE - camY;
          if (!GameAssets.drawTileObject(ctx, furniture.ch, fx, fy, indoor, m.tileset, furniture.x, furniture.y)) {
            ctx.drawImage(Sprites.tile(furniture.ch, indoor), fx, fy);
          }
        },
      });
    }
    const push = m.puzzle && m.puzzle.push;
    if (push) {
      const state = pushPuzzleState(push);
      for (const block of push.blocks) {
        const pos = state[block.id];
        let bx = pos.x * TILE, by = pos.y * TILE;
        if (moving && moving.pushed && moving.pushed.id === block.id) {
          const pushed = moving.pushed;
          bx = (pushed.fromX + (pushed.toX - pushed.fromX) * moving.t) * TILE;
          by = (pushed.fromY + (pushed.toY - pushed.fromY) * moving.t) * TILE;
        }
        ents.push({
          y: by,
          draw: () => {
            const dx = bx - camX, dy = by - camY;
            if (!GameAssets.drawTile(ctx, 'O', dx, dy, indoor, m.tileset, pos.x, pos.y)) {
              ctx.drawImage(Sprites.tile('O'), dx, dy);
            }
          },
        });
      }
    }
    for (const npc of visibleNpcs()) {
      ents.push({
        y: npc.y * TILE + (npc.oy || 0),
        draw: () => {
          const nx = npc.x * TILE + (npc.ox || 0) - camX;
          const ny = npc.y * TILE + (npc.oy || 0) - camY;
          const stepping = (npc.ox || npc.oy);
          const frame = stepping ? (Math.floor(Math.abs(npc.ox + npc.oy) / 4) % 4) : 0;
          if (!GameAssets.drawActor(ctx, npc.visual || npc.kind, npc.facing, frame, nx, ny)) {
            ctx.drawImage(Sprites.human(npc.kind, npc.facing), nx, ny - 1);
          }
          if (npc.alert) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(nx + 4, ny - 17, 8, 10);
            ctx.fillStyle = '#d03028';
            ctx.fillRect(nx + 7, ny - 15, 2, 4);
            ctx.fillRect(nx + 7, ny - 10, 2, 2);
          } else if (npcHasQuestMarker(npc)) {
            ctx.fillStyle = '#fff5b0';
            ctx.fillRect(nx + 4, ny - 17, 8, 10);
            ctx.fillStyle = '#d08018';
            ctx.fillRect(nx + 7, ny - 15, 2, 4);
            ctx.fillRect(nx + 7, ny - 10, 2, 2);
          }
        },
      });
    }
    const bob = moving && moving.t > 0.2 && moving.t < 0.7 ? -1 : 0;
    const pFrame = moving ? (Math.floor(moving.t * 4) % 4) : 0;
    ents.push({
      y: pry,
      draw: () => {
        const playerVisual = Game.player.ridingBike ? 'player_bike' : 'player';
        if (!GameAssets.drawActor(ctx, playerVisual, Game.player.facing, pFrame, prx - camX, pry - camY)) {
          ctx.drawImage(Sprites.human('player', Game.player.facing), prx - camX, pry - camY - 1 + bob);
        }
        // tall grass partly covers the player
        if (tileAt(Game.player.x, Game.player.y) === 't' && !moving) {
          const dx = Game.player.x * TILE - camX, dy = Game.player.y * TILE - camY;
          ctx.save();
          ctx.beginPath();
          ctx.rect(dx, dy + 9, 16, 7);
          ctx.clip();
            if (!GameAssets.drawTile(ctx, 't', dx, dy, indoor, m.tileset, Game.player.x, Game.player.y)) {
            ctx.drawImage(Sprites.tile('t'), 0, 9, 16, 7, dx, dy + 9, 16, 7);
          }
          ctx.restore();
        }
      },
    });
    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) e.draw();
    // Roofs are drawn once behind actors for the full building silhouette,
    // then their upper slice is restored in front so actors cannot appear to
    // walk across the roof. The door/front facade remains visible behind a
    // character standing on the approach tile.
    GameAssets.drawDecals(ctx, mapId, camX, camY, 'roof');
  }

  return { update, draw, objective: mainQuestStatus };
})();
