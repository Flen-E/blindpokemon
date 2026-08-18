// Dev-only data validation (node validate.js). Not loaded by the game.
const fs = require('fs');
const path = require('path');
global.document = { createElement: () => ({ getContext: () => ({ fillRect(){}, drawImage(){}, strokeRect(){}, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){}, fill(){}, ellipse(){}, arc(){}, save(){}, restore(){}, translate(){}, rotate(){}, fillText(){} }), width: 0, height: 0 }) };
global.window = {};

let src = '';
for (const f of ['audio.js', 'data/types.js', 'data/moves.js', 'data/species.js', 'data/hints.js', 'data/sprites.js', 'data/assets.js', 'data/items.js', 'data/maps.js']) {
  src += fs.readFileSync(path.join(__dirname, 'js', f), 'utf8') + '\n';
}
// Run data files + validation body in one scope so consts are visible.
eval(src + '\n;(' + validate.toString() + ')();');

function validate() {
let errors = 0;
const err = m => { console.log('ERROR:', m); errors++; };
const requirePng = (file, label) => {
  if (!fs.existsSync(file)) { err(`${label} missing`); return; }
  const exactName = path.basename(file);
  if (!fs.readdirSync(path.dirname(file)).includes(exactName)) {
    err(`${label} filename casing differs from runtime path ${exactName}`);
  }
  const bytes = fs.readFileSync(file).subarray(0, 8);
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length !== png.length || png.some((byte, i) => bytes[i] !== byte)) err(`${label} is not a valid PNG`);
};
const requireAudio = (file, label) => {
  if (!fs.existsSync(file)) { err(`${label} missing`); return; }
  const exactName = path.basename(file);
  if (!fs.readdirSync(path.dirname(file)).includes(exactName)) {
    err(`${label} filename casing differs from runtime path ${exactName}`);
  }
  const signature = fs.readFileSync(file).subarray(0, 4).toString('ascii');
  const ext = path.extname(file).toLowerCase();
  if (ext === '.ogg' && signature !== 'OggS') err(`${label} is not a valid OGG`);
  if (ext === '.mid' && signature !== 'MThd') err(`${label} is not a valid MIDI`);
};

// 1. Map rows: consistent width, known tile chars
const KNOWN = new Set(['.', ',', ':', '=', 'q', 'v', 'l', 'j', 'e', 'z', 't', 'T', 'A', 'C', 'W', 'F', 'f', 'r', 'w', 'D', 's', '_', 'k', 'm', 'b', 'O', 'B', 'h',
  'R', 'M', 'c', 'g', 'H', 'G', 'P', 'n', '1', '2', '3', 'V', 'p', 'd', 'K', 'J', 'Y', 'x']);
const questIds = new Set();
const storyKinds = new Set(['signal', 'archive']);
const trainerFlags = new Set(Object.values(MAPS).flatMap(m => (m.npcs || []).filter(n => n.trainer).map(n => n.trainer.flag)));
const puzzleFlags = new Set(Object.values(MAPS).flatMap(m => {
  const puzzle = m.puzzle || {};
  return [puzzle.sequence?.solvedFlag, puzzle.push?.solvedFlag, puzzle.rotors?.solvedFlag].filter(Boolean);
}));
const questObjectiveFlags = new Set([...trainerFlags, ...puzzleFlags]);
const wildSpecies = new Set();
const puzzleKinds = new Set();
let encounterMapCount = 0;
for (const [id, m] of Object.entries(MAPS)) {
  const w = m.rows[0].length;
  m.rows.forEach((r, y) => {
    if (r.length !== w) err(`${id} row ${y} width ${r.length} != ${w}: "${r}"`);
    for (const ch of r) if (!KNOWN.has(ch)) err(`${id} row ${y} unknown tile '${ch}'`);
  });
  if (!m.outdoor) {
    if (!(m.roomPlan && typeof m.roomPlan.purpose === 'string' && m.roomPlan.purpose &&
          Array.isArray(m.roomPlan.required) && m.roomPlan.required.length)) {
      err(`${id} has no semantic room plan`);
    } else {
      const roomChars = m.rows.join('');
      for (const ch of m.roomPlan.required) {
        if (!roomChars.includes(ch)) err(`${id} (${m.roomPlan.purpose}) is missing required '${ch}' set piece`);
      }
    }
  }
  // warps reference valid maps and land on walkable, in-bounds tiles
  for (const [key, wp] of Object.entries(m.warps || {})) {
    const [x, y] = key.split(',').map(Number);
    if (!['D', 'm', 'h'].includes(m.rows[y]?.[x])) err(`${id} warp at ${key} is on '${m.rows[y]?.[x]}'`);
    const t = MAPS[wp.map];
    if (!t) { err(`${id} warp ${key} -> missing map ${wp.map}`); continue; }
    const ch = t.rows[wp.y]?.[wp.x];
    if (ch === undefined) err(`${id} warp ${key} -> out of bounds ${wp.map} ${wp.x},${wp.y}`);
    else if (mapTileIsSolid(t, wp.x, wp.y)) err(`${id} warp ${key} -> lands on solid tree footprint or '${ch}' in ${wp.map}`);
  }
  for (const [dir, target] of Object.entries(m.links || {})) {
    if (!MAPS[target]) err(`${id} link ${dir} -> missing map ${target}`);
  }
  const puzzleGates = (m.puzzle && m.puzzle.gates) || {};
  const puzzlePlates = (m.puzzle && m.puzzle.plates) || {};
  const puzzleSequence = m.puzzle && m.puzzle.sequence;
  const puzzlePush = m.puzzle && m.puzzle.push;
  const puzzleRotors = m.puzzle && m.puzzle.rotors;
  const puzzleGateTile = (m.puzzle && m.puzzle.gateTile) || 'j';
  const puzzlePlateTile = (m.puzzle && m.puzzle.plateTile) || 'l';
  for (const [key, flag] of Object.entries(puzzleGates)) {
    const [x, y] = key.split(',').map(Number);
    if (m.rows[y]?.[x] !== puzzleGateTile) err(`${id} puzzle gate ${key} is on '${m.rows[y]?.[x]}' instead of '${puzzleGateTile}'`);
    if (!flag) err(`${id} puzzle gate ${key} has no flag`);
  }
  for (const [key, plate] of Object.entries(puzzlePlates)) {
    const [x, y] = key.split(',').map(Number);
    if (m.rows[y]?.[x] !== puzzlePlateTile) err(`${id} puzzle plate ${key} is on '${m.rows[y]?.[x]}' instead of '${puzzlePlateTile}'`);
    if (!(plate.flag && plate.text)) err(`${id} puzzle plate ${key} is malformed`);
  }
  if (puzzleSequence) {
    puzzleKinds.add('sequence');
    const nodes = Object.entries(puzzleSequence.nodes || {});
    const nodeIds = nodes.map(([, node]) => node.id);
    if (nodes.length < 3 || new Set(nodeIds).size !== nodes.length) err(`${id} sequence puzzle needs at least three unique nodes`);
    if (!(puzzleSequence.stateFlag && puzzleSequence.solvedFlag && puzzleSequence.solvedText && puzzleSequence.resetText)) {
      err(`${id} sequence puzzle is malformed`);
    }
    if (!Array.isArray(puzzleSequence.order) || puzzleSequence.order.length !== nodes.length ||
        puzzleSequence.order.some(nodeId => !nodeIds.includes(nodeId))) err(`${id} sequence order does not match its nodes`);
    for (const [key, node] of nodes) {
      const [x, y] = key.split(',').map(Number);
      if (m.rows[y]?.[x] !== 's') err(`${id} sequence node ${key} is not on a sign device`);
      if (!(node.label && node.tone)) err(`${id} sequence node ${key} is malformed`);
    }
  }
  if (puzzlePush) {
    puzzleKinds.add('push');
    if (!(puzzlePush.stateFlag && puzzlePush.solvedFlag && puzzlePush.solvedText && puzzlePush.resetText)) err(`${id} push puzzle is malformed`);
    if (!Array.isArray(puzzlePush.blocks) || !puzzlePush.blocks.length || !Array.isArray(puzzlePush.goals) || puzzlePush.goals.length !== puzzlePush.blocks.length) {
      err(`${id} push puzzle needs one goal per block`);
    }
    const blockIds = new Set();
    for (const block of (puzzlePush.blocks || [])) {
      if (!block.id || blockIds.has(block.id)) err(`${id} push puzzle has duplicate/missing block id`);
      blockIds.add(block.id);
      if (mapTileIsSolid(m, block.x, block.y)) err(`${id} push block ${block.id} starts on a solid tile`);
    }
    for (const goal of (puzzlePush.goals || [])) if (mapTileIsSolid(m, goal.x, goal.y)) err(`${id} push goal ${goal.x},${goal.y} is solid`);
    const [rx, ry] = String(puzzlePush.resetAt || '').split(',').map(Number);
    if (m.rows[ry]?.[rx] !== 's') err(`${id} push reset ${puzzlePush.resetAt} is not on a sign device`);
  }
  if (puzzleRotors) {
    puzzleKinds.add('rotors');
    const devices = Object.entries(puzzleRotors.devices || {});
    const deviceIds = devices.map(([, device]) => device.id);
    if (devices.length < 3 || new Set(deviceIds).size !== devices.length) err(`${id} rotor puzzle needs at least three unique devices`);
    if (!(puzzleRotors.stateFlag && puzzleRotors.solvedFlag && puzzleRotors.solvedText)) err(`${id} rotor puzzle is malformed`);
    for (const [key, device] of devices) {
      const [x, y] = key.split(',').map(Number);
      if (m.rows[y]?.[x] !== 's') err(`${id} rotor ${key} is not on a sign device`);
      if (!(device.label && Number.isInteger(device.start) && device.start >= 0 && device.start < 4 &&
            Number.isInteger(device.target) && device.target >= 0 && device.target < 4)) err(`${id} rotor ${key} is malformed`);
    }
  }
  const mechanismFlags = new Set([
    ...Object.values(puzzlePlates).map(plate => plate.flag),
    puzzleSequence && puzzleSequence.solvedFlag,
    puzzlePush && puzzlePush.solvedFlag,
    puzzleRotors && puzzleRotors.solvedFlag,
  ].filter(Boolean));
  for (const flag of new Set(Object.values(puzzleGates))) {
    if (!mechanismFlags.has(flag)) err(`${id} puzzle gate flag ${flag} has no solving mechanism`);
  }
  if (m.tileset && !TILE_SRC_THEME[m.tileset]) err(`${id} unknown tileset theme ${m.tileset}`);
  if (m.battleBg && !BATTLE_BG_FILE[m.battleBg]) err(`${id} unknown battle background ${m.battleBg}`);
  if (!m.bgm || !BGM_TRACKS[m.bgm]) err(`${id} missing or unknown BGM theme ${m.bgm}`);
  // signs on solid sign tiles
  for (const key of Object.keys(m.signs || {})) {
    const [x, y] = key.split(',').map(Number);
    if (m.rows[y]?.[x] !== 's') err(`${id} sign at ${key} is on '${m.rows[y]?.[x]}'`);
  }
  // storage terminals have matching metadata and a visible PC tile
  for (const key of Object.keys(m.pcs || {})) {
    const [x, y] = key.split(',').map(Number);
    if (m.rows[y]?.[x] !== 'P') err(`${id} PC at ${key} is on '${m.rows[y]?.[x]}'`);
  }
  // npcs stand on walkable tiles
  for (const n of (m.npcs || [])) {
    const ch = m.rows[n.y]?.[n.x];
    if (mapTileIsSolid(m, n.x, n.y)) err(`${id} npc ${n.id} on solid/tree-footprint/missing tile '${ch}'`);
    if (n.visual && !CHAR_FILES.includes(n.visual)) err(`${id} npc ${n.id} unknown visual ${n.visual}`);
    const reviewedVisual = NPC_VISUAL_ASSIGNMENTS[id] && NPC_VISUAL_ASSIGNMENTS[id][n.id];
    if (!reviewedVisual) err(`${id} npc ${n.id} has no explicit reviewed character assignment`);
    else if (n.visual !== reviewedVisual) err(`${id} npc ${n.id} visual ${n.visual} differs from reviewed ${reviewedVisual}`);
    const shouldStayFixed = n.trainer || n.quest || n.kind === 'rival' || NPC_FIXED_SPECIALS.has(n.special);
    if (shouldStayFixed && n.wander !== false) {
      err(`${id} important npc ${n.id} is not explicitly fixed in place`);
    }
    if (!shouldStayFixed && n.wander === false) err(`${id} ordinary resident ${n.id} cannot use the local wander system`);
    if (n.trainer) {
      for (const [sp] of n.trainer.party) if (!SPECIES[sp]) err(`${id} trainer ${n.id} unknown species ${sp}`);
      if (n.trainer.reward && !ITEMS[n.trainer.reward.item]) err(`${id} trainer ${n.id} reward unknown item ${n.trainer.reward.item}`);
      if (n.trainer.requiresFlags && (!Array.isArray(n.trainer.requiresFlags) || !n.trainer.requiresFlags.every(Boolean))) {
        err(`${id} trainer ${n.id} has malformed requiresFlags`);
      }
      for (const flag of (n.trainer.requiresFlags || [])) {
        if (!trainerFlags.has(flag)) err(`${id} trainer ${n.id} requires unknown trainer flag ${flag}`);
      }
      if (n.trainer.requiresFlags && !(Array.isArray(n.trainer.locked) && n.trainer.locked.length)) {
        err(`${id} trainer ${n.id} has requirements but no locked dialogue`);
      }
      if (n.trainer.badge && !(n.trainer.badge.name && n.trainer.badge.received && n.trainer.badge.description)) {
        err(`${id} trainer ${n.id} malformed badge reward`);
      }
      if (n.trainer.rivalStarter && !(n.trainer.rivalStarter.level > 0)) err(`${id} trainer ${n.id} bad rival starter level`);
      if (n.trainer.trainerVisual && !TRAINER_VISUALS[n.trainer.trainerVisual]) {
        err(`${id} trainer ${n.id} unknown trainer visual ${n.trainer.trainerVisual}`);
      }
    }
    if (n.special === 'story' && !storyKinds.has(n.story)) err(`${id} story npc ${n.id} has unknown story ${n.story}`);
    if (n.special === 'sidequest') {
      const q = n.quest;
      if (!(q && q.id && q.title && q.giver && Array.isArray(q.intro) && q.intro.length &&
            Array.isArray(q.progress) && q.progress.length && Array.isArray(q.complete) && q.complete.length &&
            q.requirement && q.reward && q.rewardText)) {
        err(`${id} sidequest npc ${n.id} is malformed`);
      } else {
        if (questIds.has(q.id)) err(`${id} duplicate sidequest id ${q.id}`);
        questIds.add(q.id);
        if (!['flags', 'identified', 'caught', 'level'].includes(q.requirement.type)) {
          err(`${id} sidequest ${q.id} has unknown requirement ${q.requirement.type}`);
        }
        if (q.requirement.type === 'flags' && !(Array.isArray(q.requirement.flags) && q.requirement.flags.length)) {
          err(`${id} sidequest ${q.id} has no required flags`);
        }
        for (const flag of (q.requirement.flags || [])) {
          if (!questObjectiveFlags.has(flag)) err(`${id} sidequest ${q.id} requires unknown objective flag ${flag}`);
        }
        if (['identified', 'caught'].includes(q.requirement.type) && !(q.requirement.count > 0)) {
          err(`${id} sidequest ${q.id} has invalid count`);
        }
        if (q.requirement.type === 'level' && !(q.requirement.level > 0 && q.requirement.level <= 100)) {
          err(`${id} sidequest ${q.id} has invalid level`);
        }
        for (const itemId of Object.keys(q.reward.items || {})) {
          if (!ITEMS[itemId]) err(`${id} sidequest ${q.id} rewards unknown item ${itemId}`);
        }
      }
    }
  }
  // encounter tables
  if (m.encounters) {
    encounterMapCount++;
    if (!(m.encounters.rate > 0 && m.encounters.rate <= 1)) err(`${id} has invalid encounter rate ${m.encounters.rate}`);
    if (!(Array.isArray(m.encounters.levels) && m.encounters.levels.length === 2 &&
          Number.isInteger(m.encounters.levels[0]) && Number.isInteger(m.encounters.levels[1]) &&
          m.encounters.levels[0] > 0 && m.encounters.levels[0] <= m.encounters.levels[1] && m.encounters.levels[1] <= 100)) {
      err(`${id} has invalid encounter levels ${JSON.stringify(m.encounters.levels)}`);
    }
    if (!Array.isArray(m.encounters.table) || m.encounters.table.length < 12) {
      err(`${id} encounter pool has fewer than 12 species`);
    }
    const localSpecies = new Set();
    for (const entry of m.encounters.table || []) {
      const [sp, weight] = entry;
      if (!SPECIES[sp]) err(`${id} encounter unknown species ${sp}`);
      if (localSpecies.has(sp)) err(`${id} encounter repeats species ${sp}`);
      localSpecies.add(sp);
      wildSpecies.add(sp);
      if (!(Number.isInteger(weight) && weight > 0)) err(`${id} encounter ${sp} has invalid weight ${weight}`);
    }
    for (const ch of (m.encounters.tiles || ['t'])) {
      if (!KNOWN.has(ch)) err(`${id} encounter uses unknown tile '${ch}'`);
      if (!m.rows.some(row => row.includes(ch))) err(`${id} encounter tile '${ch}' is absent from map`);
      if (SOLID_TILES.has(ch)) err(`${id} encounter tile '${ch}' is solid`);
    }
  }

  // Building images are taller than their three-row footprints. Reproduce
  // the runtime's opaque-body span calculation so a wider town edit cannot
  // accidentally hide an NPC inside a roof or create an invisible overlap.
  for (const d of (MAP_DECALS[id] || [])) {
    const body = BUILDING_BODY[d.img];
    if (!body) { err(`${id} decal uses unknown building ${d.img}`); continue; }
    if (d.hue !== undefined && (!Number.isFinite(d.hue) || Math.abs(d.hue) > 360)) {
      err(`${id} decal ${d.img} has invalid hue ${d.hue}`);
    }
    const cx = ((d.x0 + d.x1 + 1) / 2) * 16;
    const span = {
      x0: Math.floor((cx - body.w / 2 + 8) / 16),
      x1: Math.floor((cx + body.w / 2 - 8) / 16),
      y0: d.y1 - Math.ceil((body.h - 8) / 16) + 1,
      y1: d.y1,
    };
    for (const n of (m.npcs || [])) {
      if (n.x >= span.x0 && n.x <= span.x1 && n.y >= span.y0 && n.y <= span.y1) {
        err(`${id} npc ${n.id} overlaps ${d.img} visual body`);
      }
    }
  }

  // Multi-cell supplied furniture must not overlap another furniture group;
  // that is the data-level version of the visual “cut into each other” bug.
  const furnitureRect = furniture => {
    const [ox, oy, width, height] = INTERIOR_FURNITURE_FOOTPRINTS[furniture.ch] || [];
    return ox === undefined ? null : {
      x0: furniture.x + ox, y0: furniture.y + oy,
      x1: furniture.x + ox + width - 1, y1: furniture.y + oy + height - 1,
    };
  };
  const furnitureRects = (m.furniture || []).map(furnitureRect).filter(Boolean);
  for (const rect of furnitureRects) {
    if (rect.x0 <= 0 || rect.y0 <= 0 || rect.x1 >= w - 1 || rect.y1 >= m.rows.length - 1) {
      err(`${id} furniture footprint ${rect.x0},${rect.y0}-${rect.x1},${rect.y1} overlaps the wall frame`);
    }
  }
  for (let i = 0; i < furnitureRects.length; i++) {
    for (let j = i + 1; j < furnitureRects.length; j++) {
      const a = furnitureRects[i], b = furnitureRects[j];
      if (a.x0 <= b.x1 && a.x1 >= b.x0 && a.y0 <= b.y1 && a.y1 >= b.y0) {
        err(`${id} furniture groups overlap at ${a.x0},${a.y0} and ${b.x0},${b.y0}`);
      }
    }
  }

  // Key gameplay points must share one walkable component. This catches
  // decorative edits that accidentally seal an NPC, door, PC, or map exit
  // behind trees/water even when every individual tile is otherwise valid.
  // For whole-map connectivity, puzzle gates are evaluated in their solved
  // state. A second simulation below proves the plates can open them in order.
  const npcCells = new Set((m.npcs || []).map(n => `${n.x},${n.y}`));
  const walkable = (x, y) =>
    (!!puzzleGates[`${x},${y}`] || !mapTileIsSolid(m, x, y)) && !npcCells.has(`${x},${y}`);
  const anchors = [];
  for (const key of Object.keys(m.warps || {})) anchors.push(key.split(',').map(Number));
  if (m.links?.up) for (let x = 0; x < w; x++) if (walkable(x, 0)) anchors.push([x, 0]);
  if (m.links?.down) for (let x = 0; x < w; x++) if (walkable(x, m.rows.length - 1)) anchors.push([x, m.rows.length - 1]);
  if (m.links?.left) for (let y = 0; y < m.rows.length; y++) if (walkable(0, y)) anchors.push([0, y]);
  if (m.links?.right) for (let y = 0; y < m.rows.length; y++) if (walkable(w - 1, y)) anchors.push([w - 1, y]);
  if (anchors.length) {
    const start = anchors[0];
    const seen = new Set([start.join(',')]);
    const queue = [start];
    while (queue.length) {
      const [x, y] = queue.shift();
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        const key = `${nx},${ny}`;
        if (walkable(nx, ny) && !seen.has(key)) { seen.add(key); queue.push([nx, ny]); }
      }
      const warp = (m.warps || {})[`${x},${y}`];
      if (warp && warp.map === id && walkable(warp.x, warp.y)) {
        const key = `${warp.x},${warp.y}`;
        if (!seen.has(key)) { seen.add(key); queue.push([warp.x, warp.y]); }
      }
    }
    for (const [x, y] of anchors) if (!seen.has(`${x},${y}`)) err(`${id} gameplay point ${x},${y} is unreachable`);
    const hasReachableNeighbor = key => {
      const [x, y] = key.split(',').map(Number);
      return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([nx, ny]) => seen.has(`${nx},${ny}`));
    };
    for (const n of (m.npcs || [])) {
      if (!hasReachableNeighbor(`${n.x},${n.y}`)) err(`${id} npc ${n.id} cannot be approached without crossing another NPC`);
    }
    for (const key of Object.keys(m.signs || {})) if (!hasReachableNeighbor(key)) err(`${id} sign ${key} cannot be reached`);
    for (const key of Object.keys(m.pcs || {})) if (!hasReachableNeighbor(key)) err(`${id} PC ${key} cannot be reached`);
  }

  if (Object.keys(puzzleGates).length) {
    let start = null;
    const startKey = Object.keys(m.warps || {})[0];
    if (startKey) start = startKey.split(',').map(Number);
    if (!start && m.links?.down) {
      const y = m.rows.length - 1;
      const x = [...m.rows[y]].findIndex((ch, px) => !mapTileIsSolid(m, px, y));
      if (x >= 0) start = [x, y];
    }
    if (!start && m.links?.up) {
      const x = [...m.rows[0]].findIndex((ch, px) => !mapTileIsSolid(m, px, 0));
      if (x >= 0) start = [x, 0];
    }
    if (!start) {
      err(`${id} puzzle has no entry warp or linked edge`);
    } else {
      if (m.links?.down && m.links?.up) {
        const closedSeen = new Set([start.join(',')]);
        const closedQueue = [start];
        while (closedQueue.length) {
          const [x, y] = closedQueue.shift();
          for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
            const key = `${nx},${ny}`;
            const passable = !puzzleGates[key] && !mapTileIsSolid(m, nx, ny) && !npcCells.has(key);
            if (passable && !closedSeen.has(key)) { closedSeen.add(key); closedQueue.push([nx, ny]); }
          }
        }
        const reachesOppositeExit = [...m.rows[0]].some((ch, x) =>
          !mapTileIsSolid(m, x, 0) && closedSeen.has(`${x},0`));
        if (reachesOppositeExit) err(`${id} puzzle gates can be bypassed before solving`);
      }
      const activeFlags = new Set();
      let solvedSeen = new Set();
      let changed = true;
      while (changed) {
        changed = false;
        solvedSeen = new Set([start.join(',')]);
        const queue = [start];
        while (queue.length) {
          const [x, y] = queue.shift();
          for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
            const key = `${nx},${ny}`;
            const gateFlag = puzzleGates[key];
            const passable = (gateFlag ? activeFlags.has(gateFlag) : !mapTileIsSolid(m, nx, ny)) && !npcCells.has(key);
            if (passable && !solvedSeen.has(key)) { solvedSeen.add(key); queue.push([nx, ny]); }
          }
        }
        for (const [key, plate] of Object.entries(puzzlePlates)) {
          if (solvedSeen.has(key) && !activeFlags.has(plate.flag)) {
            activeFlags.add(plate.flag);
            changed = true;
          }
        }
        const reachableNeighbor = key => {
          const [x, y] = key.split(',').map(Number);
          return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([nx, ny]) => solvedSeen.has(`${nx},${ny}`));
        };
        if (puzzleSequence && !activeFlags.has(puzzleSequence.solvedFlag) &&
            Object.keys(puzzleSequence.nodes).every(reachableNeighbor)) {
          activeFlags.add(puzzleSequence.solvedFlag);
          changed = true;
        }
        if (puzzleRotors && !activeFlags.has(puzzleRotors.solvedFlag) &&
            Object.keys(puzzleRotors.devices).every(reachableNeighbor)) {
          activeFlags.add(puzzleRotors.solvedFlag);
          changed = true;
        }
        if (puzzlePush && !activeFlags.has(puzzlePush.solvedFlag)) {
          const blocksReachable = puzzlePush.blocks.every(block => reachableNeighbor(`${block.x},${block.y}`));
          const goalsReachable = puzzlePush.goals.every(goal => solvedSeen.has(`${goal.x},${goal.y}`));
          if (blocksReachable && goalsReachable && reachableNeighbor(puzzlePush.resetAt)) {
            activeFlags.add(puzzlePush.solvedFlag);
            changed = true;
          }
        }
      }
      for (const flag of new Set(Object.values(puzzleGates))) {
        if (!activeFlags.has(flag)) err(`${id} puzzle flag ${flag} cannot be activated from the entrance`);
      }
      for (const n of (m.npcs || [])) {
        const canApproach = [[n.x + 1, n.y], [n.x - 1, n.y], [n.x, n.y + 1], [n.x, n.y - 1]]
          .some(([x, y]) => solvedSeen.has(`${x},${y}`));
        if (!canApproach) err(`${id} puzzle cannot approach npc ${n.id} after solving`);
      }
    }
  }
}
if (questIds.size < 7) err(`only ${questIds.size} sidequests are registered`);
for (const kind of ['sequence', 'push', 'rotors']) if (!puzzleKinds.has(kind)) err(`missing ${kind} environmental puzzle`);
if (encounterMapCount < 11) err(`only ${encounterMapCount} maps have wild encounters`);
if (Object.keys(SPECIES).length < 100) err(`playable roster has only ${Object.keys(SPECIES).length} species`);
for (const speciesId of Object.keys(SPECIES)) {
  if (!wildSpecies.has(speciesId)) err(`${speciesId} never appears in a wild encounter pool`);
}
for (const story of storyKinds) {
  if (!Object.values(MAPS).some(m => (m.npcs || []).some(n => n.story === story))) {
    err(`story npc ${story} is missing`);
  }
}
const mistDirector = (MAPS.mistworks.npcs || []).find(n => n.id === 'mist_director');
if (!mistDirector || !mistDirector.trainer || mistDirector.trainer.requiresFlags?.length !== 3) {
  err('White Mist director story gate is malformed');
}
const tutorialMother = (MAPS.house.npcs || []).find(n => n.id === 'mom');
if (!tutorialMother || tutorialMother.special !== 'parent' || tutorialMother.visual !== 'parent' ||
    tutorialMother.wander !== false || tutorialMother.x !== 9 || tutorialMother.y !== 3) {
  err('opening tutorial mother is missing, randomized, or misplaced');
}
const bedroomToHouse = MAPS.bedroom.warps?.['10,2'];
if (!bedroomToHouse || bedroomToHouse.map !== 'house' || bedroomToHouse.x !== 10 || bedroomToHouse.y !== 3) {
  err('opening tutorial staircase does not land in front of the mother');
}
for (const id of ['bedroom', 'house']) {
  if (MAPS[id].rows.length !== 10 || MAPS[id].rows[0].length !== 14) {
    err(`${id} expanded beyond the reviewed compact 14x10 home plan`);
  }
  const stair = MAPS[id].furniture?.find(item => item.ch === 'h');
  if (!stair || stair.x !== 10 || stair.y !== 2) {
    err(`${id} staircase is no longer attached to the upper-right wall`);
  }
}
const homeExit = MAPS.house.warps?.['7,8'];
const homeEntrance = MAPS.hometown.warps?.['5,18'];
const homeMat = MAPS.house.furniture?.find(item => item.ch === 'm');
if (!homeExit || homeExit.map !== 'hometown' || homeExit.x !== 5 || homeExit.y !== 19 || !homeEntrance ||
    homeEntrance.map !== 'house' || homeEntrance.x !== 7 || homeEntrance.y !== 7 ||
    !homeMat || homeMat.x !== 7 || homeMat.y !== 8) {
  err('starting home entrance no longer uses its complete lower-edge threshold and safe landing');
}
const tutorialProfessor = (MAPS.lab.npcs || []).find(n => n.special === 'prof');
if (!tutorialProfessor || tutorialProfessor.visual !== 'prof' || tutorialProfessor.wander !== false) {
  err('opening tutorial professor is missing, mobile, or uses a non-professor character');
}
const tutorialRival = (MAPS.lab.npcs || []).find(n => n.id === 'rex');
if (!tutorialRival || tutorialRival.visual !== 'rival' || tutorialRival.wander !== false) {
  err('opening tutorial rival is missing, mobile, or visually inconsistent');
}
for (const [mapId, assignments] of Object.entries(NPC_VISUAL_ASSIGNMENTS)) {
  if (!MAPS[mapId]) { err(`character assignments reference missing map ${mapId}`); continue; }
  for (const [npcId, visual] of Object.entries(assignments)) {
    if (!MAPS[mapId].npcs?.some(npc => npc.id === npcId)) err(`${mapId} character assignment references missing npc ${npcId}`);
    if (!CHAR_FILES.includes(visual)) err(`${mapId} npc ${npcId} assignment uses unknown visual ${visual}`);
  }
}
for (const id of ['hometown', 'stonegate', 'lakeglass', 'brightgear', 'everbloom']) {
  const visuals = MAPS[id].npcs.map(npc => npc.visual);
  if (new Set(visuals).size !== visuals.length) err(`${id} reuses one character sheet for multiple local residents`);
}
const reviewedTownFeatures = {
  hometown: { size: [26, 22], tiles: ['W', 'v', 'F', '=', ':'], decals: 5 },
  stonegate: { size: [34, 28], tiles: ['O', 'F', '=', 'q'], decals: 4 },
  lakeglass: { size: [34, 28], tiles: ['W', 'v', 'F', 'q'], decals: 3 },
  brightgear: { size: [36, 30], tiles: ['W', 'v', 'O', 'f', 'F'], decals: 5 },
  everbloom: { size: [38, 30], tiles: ['W', 'v', 'f', 'F', ':'], decals: 5 },
};
for (const [mapId, expected] of Object.entries(reviewedTownFeatures)) {
  const m = MAPS[mapId];
  const plan = TOWN_LAYOUT_PLANS[mapId];
  if (!plan || m.townPlan !== plan || !Array.isArray(plan.districts) || plan.districts.length < 3) {
    err(`${mapId} has no reviewed district-based town plan`);
  }
  if (m.rows[0].length !== expected.size[0] || m.rows.length !== expected.size[1] ||
      !plan || plan.size[0] !== expected.size[0] || plan.size[1] !== expected.size[1]) {
    err(`${mapId} changed from its reviewed compact ${expected.size.join('x')} footprint`);
  }
  const terrain = m.rows.join('');
  for (const ch of expected.tiles) if (!terrain.includes(ch)) err(`${mapId} lost themed landmark tile '${ch}'`);
  if ((MAP_DECALS[mapId] || []).length !== expected.decals) {
    err(`${mapId} no longer has its reviewed ${expected.decals}-building district plan`);
  }

  const placements = TOWN_NPC_PLACEMENTS[mapId] || {};
  const seenPositions = new Set();
  for (const npc of m.npcs || []) {
    const expectedPlacement = placements[npc.id];
    if (!expectedPlacement) {
      err(`${mapId} npc ${npc.id} has no reviewed role-based placement`);
      continue;
    }
    const actual = [npc.x, npc.y, npc.facing, npc.wander, npc.wanderRadius, npc.placementRole];
    if (actual.some((value, i) => value !== expectedPlacement[i])) {
      err(`${mapId} npc ${npc.id} moved away from its reviewed ${expectedPlacement[5]} placement`);
    }
    if (typeof npc.placementRole !== 'string' || !npc.placementRole.trim()) {
      err(`${mapId} npc ${npc.id} has no semantic placement role`);
    }
    if (npc.wander === true && (!Number.isInteger(npc.wanderRadius) || npc.wanderRadius < 1 || npc.wanderRadius > 3)) {
      err(`${mapId} mobile npc ${npc.id} has an unreviewed wander radius`);
    }
    if (npc.wander === false && npc.wanderRadius !== 0) {
      err(`${mapId} fixed npc ${npc.id} retains a meaningless wander radius`);
    }
    const key = `${npc.x},${npc.y}`;
    if (seenPositions.has(key)) err(`${mapId} stacks multiple residents at ${key}`);
    seenPositions.add(key);
  }
  for (const npcId of Object.keys(placements)) {
    if (!m.npcs?.some(npc => npc.id === npcId)) err(`${mapId} placement references missing npc ${npcId}`);
  }
}

// Ordinary doors must lead to purpose-built rooms, never to the legacy shared
// guesthouse. Exact sizes, palette themes, entrances, exits, and residents are
// locked together so a later town pass cannot silently clone one room again.
const reviewedOrdinaryInteriors = {
  willowworkshop: { outside: 'hometown', door: [5, 6], size: [16, 11], theme: 'willow_craft', exit: [8, 9], resident: 'willow_carpenter' },
  willowhall: { outside: 'hometown', door: [20, 6], size: [20, 13], theme: 'willow_civic', exit: [10, 11], resident: 'willow_archivist' },
  stoneworkshop: { outside: 'stonegate', door: [27, 7], size: [18, 12], theme: 'stone_workshop', exit: [9, 10], resident: 'stone_forewoman' },
  gearworkshop: { outside: 'brightgear', door: [6, 8], size: [20, 13], theme: 'gear_workshop', exit: [10, 11], resident: 'gear_repairer' },
  gearhome: { outside: 'brightgear', door: [30, 8], size: [16, 12], theme: 'gear_residence', exit: [8, 10], resident: 'gear_tenant' },
  bloomnursery: { outside: 'everbloom', door: [7, 14], size: [22, 14], theme: 'bloom_nursery', exit: [11, 12], resident: 'bloom_nursery_keeper' },
  bloomstudy: { outside: 'everbloom', door: [30, 14], size: [18, 12], theme: 'bloom_study', exit: [9, 10], resident: 'bloom_reader' },
};
const reviewedResidentialThemes = {
  bedroom_home: [[0, 1120], [64, 0]], family_home: [[0, 1888], [32, 0]],
  rival_home: [[0, 1248], [192, 128]], willow_craft: [[0, 1504], [32, 0]],
  willow_civic: [[0, 1632], [0, 128]], stone_workshop: [[0, 1024], [0, 0]],
  gear_workshop: [[0, 1120], [64, 0]], gear_residence: [[0, 1888], [0, 192]],
  bloom_nursery: [[0, 1760], [0, 544]], bloom_study: [[0, 1376], [192, 128]],
};
for (const [themeId, [floorAt, wallAt]] of Object.entries(reviewedResidentialThemes)) {
  const theme = TILE_SRC_THEME[themeId];
  if (!theme || theme._?.s !== 'interiorGeneral' || theme.w?.s !== 'interiorGeneral' ||
      theme._?.x !== floorAt[0] || theme._?.y !== floorAt[1] ||
      theme.w?.x !== wallAt[0] || theme.w?.y !== wallAt[1]) {
    err(`${themeId} no longer uses its reviewed complete floor/wall palette`);
  }
}
if (MAPS.bedroom.tileset !== 'bedroom_home' || MAPS.house.tileset !== 'family_home' ||
    MAPS.rexhouse.tileset !== 'rival_home') {
  err('core family homes reverted to one shared interior palette');
}
const ordinaryInteriorTargets = new Set();
for (const [insideId, expected] of Object.entries(reviewedOrdinaryInteriors)) {
  const inside = MAPS[insideId];
  const layout = ORDINARY_INTERIOR_LAYOUTS[insideId];
  const [doorX, doorY] = expected.door;
  const outsideWarp = MAPS[expected.outside].warps?.[`${doorX},${doorY}`];
  ordinaryInteriorTargets.add(outsideWarp && outsideWarp.map);
  if (!outsideWarp || outsideWarp.map !== insideId || outsideWarp.returnTo || outsideWarp.returnWarp ||
      outsideWarp.x !== expected.exit[0] || outsideWarp.y !== expected.exit[1] - 1) {
    err(`${expected.outside} door ${doorX},${doorY} does not enter its reviewed ${insideId} room`);
  }
  if (!inside || !layout || inside.rows[0].length !== expected.size[0] || inside.rows.length !== expected.size[1] ||
      layout.size[0] !== expected.size[0] || layout.size[1] !== expected.size[1]) {
    err(`${insideId} changed from its reviewed ${expected.size.join('x')} plan`);
    continue;
  }
  if (inside.tileset !== expected.theme || inside.roomPlan?.purpose !== layout.purpose) {
    err(`${insideId} lost its purpose-specific palette or semantic plan`);
  }
  const [exitX, exitY] = expected.exit;
  const exitWarp = inside.warps?.[`${exitX},${exitY}`];
  if (!exitWarp || exitWarp.map !== expected.outside || exitWarp.x !== doorX || exitWarp.y !== doorY + 1) {
    err(`${insideId} exit does not return one clear tile below its own exterior door`);
  }
  const resident = inside.npcs?.find(npc => npc.id === expected.resident);
  if (!resident || inside.npcs.length !== 1 || resident.wander !== true || resident.wanderRadius !== 1 ||
      resident.x !== layout.resident[0] || resident.y !== layout.resident[1]) {
    err(`${insideId} does not have its reviewed local resident and one-tile activity radius`);
  }
}
if (ordinaryInteriorTargets.size !== Object.keys(reviewedOrdinaryInteriors).length || ordinaryInteriorTargets.has('guesthouse')) {
  err('ordinary exterior doors still share or reuse an interior destination');
}
for (const outsideId of ['hometown', 'stonegate', 'brightgear', 'everbloom']) {
  if (Object.values(MAPS[outsideId].warps || {}).some(warp => warp.map === 'guesthouse')) {
    err(`${outsideId} still routes a public door to the legacy shared guesthouse`);
  }
}
const reviewedCorePaths = {
  player: 'assets/Graphics/Characters/boy_run.png',
  player_bike: 'assets/Graphics/Characters/boy_bike.png',
  parent: 'assets/Graphics/Characters/NPC 19.png',
  prof: 'assets/Graphics/Characters/trainer_PROFESSOR.png',
  nurse: 'assets/Graphics/Characters/NPC 16.png',
  hiker: 'assets/Graphics/Characters/trainer_HIKER.png',
};
for (const [kind, expected] of Object.entries(reviewedCorePaths)) {
  if (characterPath(kind) !== expected) err(`${kind} character path was replaced with an unreviewed role mismatch`);
}
for (const [id, expected] of Object.entries({
  healstone: 'nurse', healglass: 'nurse', healgear: 'nurse', healbloom: 'nurse',
})) {
  const nurse = MAPS[id].npcs.find(npc => npc.special === 'nurse');
  if (!nurse || nurse.visual !== expected || nurse.wander !== false) {
    err(`${id} does not use its reviewed stationary nurse character`);
  }
}
for (const id of ['shop1', 'shop2', 'shopgear', 'shopbloom']) {
  const clerk = MAPS[id].npcs.find(npc => npc.special === 'shop');
  if (!clerk || clerk.wander !== false) err(`${id} clerk is not fixed behind the checkout`);
}

// Exact whole-object source groups. These checks intentionally reject the old
// y=5472 wall fragments and other partial furniture slices even though those
// rectangles were technically inside the PNG.
const furnitureSources = {
  m: ['mansionInterior', 112, 736, 64, 40, 'exit_mat'],
  D: ['mansionInterior', 112, 736, 64, 40, 'exit_mat'],
  B: ['interiorGeneral', 0, 4832, 64, 64, 'single_bed'],
  b: ['interiorGeneral', 0, 4480, 64, 96, 'bookcase'],
  h: ['mansionInterior', 96, 672, 96, 64, 'wall_staircase'],
  G: ['martInterior', 160, 416, 96, 64, 'goods_shelf'],
  H: ['pokeCenter', 128, 768, 128, 64, 'healing_station'],
  P: ['pokeCenter', 224, 864, 32, 64, 'storage_terminal'],
  k: ['martInterior', 0, 448, 160, 32, 'checkout_counter'],
  K: ['interiorGeneral', 96, 4736, 128, 64, 'kitchen_counter'],
  J: ['interiorGeneral', 64, 5632, 64, 64, 'lab_console'],
  Y: ['bikeInterior', 64, 192, 128, 64, 'bike_rack'],
  n: ['interiorGeneral', 64, 5024, 96, 64, 'blue_sofa'],
  V: ['interiorGeneral', 0, 5856, 64, 32, 'television'],
  p: ['interiorGeneral', 64, 5536, 32, 64, 'potted_plant'],
  d: ['interiorGeneral', 0, 6784, 96, 64, 'writing_desk'],
  s: ['interiorGeneral', 160, 5024, 96, 64, 'brown_sofa'],
  1: ['interiorGeneral', 128, 5344, 32, 64, 'starter_pedestal'],
  2: ['interiorGeneral', 128, 5344, 32, 64, 'starter_pedestal'],
  3: ['interiorGeneral', 128, 5344, 32, 64, 'starter_pedestal'],
};
for (const [ch, expected] of Object.entries(furnitureSources)) {
  const entry = TILE_SRC_IN[ch];
  const actual = entry && [entry.s, entry.x, entry.y, entry.w, entry.h, entry.object];
  if (!actual || actual.some((value, i) => value !== expected[i])) {
    err(`interior '${ch}' does not use its reviewed complete ${expected[5]} source group`);
    continue;
  }
  const footprint = INTERIOR_FURNITURE_FOOTPRINTS[ch];
  if (!footprint || footprint[2] !== Math.ceil(entry.w / 32) || footprint[3] !== Math.ceil(entry.h / 32)) {
    err(`interior '${ch}' footprint does not match complete source dimensions`);
  }
}
for (const [ch, expected] of Object.entries({
  m: [0, 0], D: [0, 0], h: [16, 0], n: [16, 16], s: [16, 16],
})) {
  const entry = TILE_SRC_IN[ch];
  if (!entry || (entry.ox || 0) !== expected[0] || (entry.oy || 0) !== expected[1]) {
    err(`interior '${ch}' lost its reviewed whole-object grid anchor`);
  }
}
if (TILE_SRC_IN.h?.parts) {
  err('compact wall staircase unexpectedly reverted to a stitched foyer staircase');
}
for (const ch of ['1', '2', '3']) {
  const entry = TILE_SRC_IN[ch];
  const part = entry && entry.parts && entry.parts[0];
  if (!entry?.ball || entry.parts.length !== 1 || !part ||
      [part.x, part.y, part.w, part.h, part.dx || 0, part.dy || 0]
        .some((value, i) => value !== [128, 5376, 32, 32, 0, 32][i])) {
    err(`starter pedestal '${ch}' does not use the reviewed display base with a local Poké Ball icon`);
  }
}

const starterStations = ['1', '2', '3'].map(ch => {
  for (let y = 0; y < MAPS.lab.rows.length; y++) {
    const x = MAPS.lab.rows[y].indexOf(ch);
    if (x >= 0) return { ch, x, y };
  }
  return null;
});
const expectedStarterStations = { '1': 'bulbasaur', '2': 'charmander', '3': 'squirtle' };
if (JSON.stringify(STARTER_STATIONS) !== JSON.stringify(expectedStarterStations) ||
    new Set(Object.values(STARTER_STATIONS)).size !== 3) {
  err('laboratory pedestals do not map one-to-one to the three starter candidates');
}
if (starterStations.some(station => !station) ||
    new Set(starterStations.filter(Boolean).map(station => station.y)).size !== 1 ||
    starterStations.filter(Boolean).some((station, i, all) => i > 0 && station.x - all[i - 1].x !== 4)) {
  err('lab starter pedestals are not three evenly spaced stations');
} else {
  for (const station of starterStations) {
    if (mapTileIsSolid(MAPS.lab, station.x, station.y + 1)) {
      err(`lab starter pedestal ${station.ch} has no clear inspection tile below it`);
    }
  }
}

for (const id of ['shop1', 'shop2', 'shopgear', 'shopbloom']) {
  const clerk = MAPS[id].npcs.find(n => n.special === 'shop');
  const counter = MAPS[id].furniture.find(item => item.ch === 'k');
  if (!clerk || !counter || clerk.x !== counter.x || clerk.y !== counter.y - 1 ||
      mapTileIsSolid(MAPS[id], counter.x, counter.y + 1)) {
    err(`${id} checkout is not usable from a clear tile with the clerk behind it`);
  }
}

for (const id of ['healstone', 'healglass', 'healgear', 'healbloom']) {
  const machine = MAPS[id].furniture.find(item => item.ch === 'H');
  const terminal = MAPS[id].furniture.find(item => item.ch === 'P');
  const nurse = MAPS[id].npcs.find(n => n.special === 'nurse');
  const pcKey = Object.keys(MAPS[id].pcs || {})[0];
  if (!machine || !nurse || nurse.x < machine.x || nurse.x >= machine.x + 4 ||
      nurse.y !== machine.y + 3) {
    err(`${id} nurse is not centred below the complete healing station with a service gap`);
  }
  if (!terminal || pcKey !== `${terminal.x},${terminal.y}`) {
    err(`${id} storage interaction is not anchored to its complete terminal`);
  }
}

// Town service rooms may share a visual language, but cloning the same rows
// made every destination feel like an unreviewed placeholder. Keep the four
// centre plans and four shop plans structurally distinct.
const requireDistinctLayouts = (ids, label) => {
  const signatures = new Map();
  for (const id of ids) {
    const m = MAPS[id];
    const signature = `${m.rows[0].length}x${m.rows.length}:` +
      (m.furniture || []).map(item => `${item.ch}@${item.x},${item.y}`).sort().join('|');
    if (signatures.has(signature)) err(`${id} duplicates ${signatures.get(signature)} ${label} layout`);
    else signatures.set(signature, id);
  }
};
requireDistinctLayouts(['healstone', 'healglass', 'healgear', 'healbloom'], 'healing-centre');
requireDistinctLayouts(['shop1', 'shop2', 'shopgear', 'shopbloom'], 'shop');
requireDistinctLayouts([
  'bedroom', 'house', 'rexhouse',
  'willowworkshop', 'willowhall', 'stoneworkshop', 'gearworkshop',
  'gearhome', 'bloomnursery', 'bloomstudy',
], 'residential and ordinary-building');

// 2. Species: learnset moves exist, evolutions exist, sprite art exists, types exist
for (const [id, sp] of Object.entries(SPECIES)) {
  for (const e of sp.learnset) if (!MOVES[e.move]) err(`${id} learnset unknown move ${e.move}`);
  if (sp.evolve && !SPECIES[sp.evolve.to]) err(`${id} evolves to unknown ${sp.evolve.to}`);
  for (const t of sp.types) if (!TYPES[t]) err(`${id} unknown type ${t}`);
  if (sp.generation !== undefined && !(sp.generation >= 1 && sp.generation <= 9)) err(`${id} bad generation ${sp.generation}`);
  if (!CREATURE_ART[id] && !GRAPHICS_SPECIES_FILE[id]) err(`${id} has no sprite art`);
  if (sp.learnset.filter(e => e.lv === 1).length === 0) err(`${id} has no level-1 moves`);
}
for (const id of Object.keys(CREATURE_ART)) if (!SPECIES[id]) err(`art for unknown species ${id}`);

const route1Generations = new Set(MAPS.route1.encounters.table.map(([id]) => SPECIES[id].generation || 1));
for (let generation = 1; generation <= 9; generation++) {
  if (!route1Generations.has(generation)) err(`route1 has no Generation ${generation} encounter`);
}

// User-supplied Graphics species need every normal/shiny battle and storage
// image committed locally. Runtime still has drawn fallbacks for failures.
for (const [id, file] of Object.entries(GRAPHICS_SPECIES_FILE)) {
  if (!SPECIES[id]) err(`Graphics sprite for unknown species ${id}`);
  for (const dir of ['Front', 'Back', 'Front shiny', 'Back shiny', 'Icons', 'Icons shiny']) {
    const asset = path.join(__dirname, 'assets', 'Graphics', 'Pokemon', dir, `${file}.png`);
    requirePng(asset, `${id} Graphics/Pokemon/${dir}/${file}.png`);
  }
}
for (const [theme, file] of Object.entries(BATTLE_BG_FILE)) {
  requirePng(path.join(__dirname, 'assets', 'Graphics', 'Battlebacks', file), `battle background ${theme} ${file}`);
}
for (const [key, file] of Object.entries(SHEET_FILE)) {
  requirePng(path.join(__dirname, file), `overworld sheet ${key}`);
}
for (const id of Object.keys(ITEM_ICON_FILE)) {
  requirePng(path.join(__dirname, itemIconPath(id)), `item icon ${id}`);
}
const sheetDimensions = {};
for (const [key, file] of Object.entries(SHEET_FILE)) {
  const bytes = fs.readFileSync(path.join(__dirname, file));
  if (bytes.length >= 24) sheetDimensions[key] = { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
const checkTileSource = (entry, label) => {
  if (entry.variants) {
    entry.variants.forEach((variant, i) => checkTileSource(variant, `${label} variant ${i}`));
    return;
  }
  const size = sheetDimensions[entry.s];
  if (!size) { err(`${label} uses unknown sheet ${entry.s}`); return; }
  if (![entry.x, entry.y, entry.w, entry.h].every(Number.isFinite) || entry.w <= 0 || entry.h <= 0 ||
      entry.x < 0 || entry.y < 0 || entry.x + entry.w > size.width || entry.y + entry.h > size.height) {
    err(`${label} source ${entry.x},${entry.y},${entry.w},${entry.h} exceeds ${entry.s} ${size.width}x${size.height}`);
  }
  for (const [i, part] of (entry.parts || []).entries()) {
    if (![part.x, part.y, part.w, part.h, part.dx || 0, part.dy || 0].every(Number.isFinite) ||
        part.w <= 0 || part.h <= 0 || part.x < 0 || part.y < 0 ||
        part.x + part.w > size.width || part.y + part.h > size.height) {
      err(`${label} part ${i} exceeds ${entry.s} ${size.width}x${size.height}`);
    }
    if ((part.dx || 0) < 0 || (part.dy || 0) < 0 ||
        (part.dx || 0) + part.w > entry.w || (part.dy || 0) + part.h > entry.h) {
      err(`${label} part ${i} exceeds its ${entry.w}x${entry.h} destination group`);
    }
  }
};
for (const [ch, entry] of Object.entries(TILE_SRC_OUT)) checkTileSource(entry, `outdoor '${ch}'`);
for (const [ch, entry] of Object.entries(TILE_SRC_IN)) checkTileSource(entry, `interior '${ch}'`);
for (const [theme, entries] of Object.entries(TILE_SRC_THEME)) {
  for (const [ch, entry] of Object.entries(entries)) checkTileSource(entry, `${theme} '${ch}'`);
}
for (const ch of Object.keys(TILE_SRC_IN)) {
  if (!TILE_ART[ch] && !INDOOR_TILE_ART[ch]) err(`interior '${ch}' has no code-drawn fallback`);
}
for (const [key, visual] of Object.entries(TRAINER_VISUALS)) {
  for (const [part, file] of Object.entries(visual)) {
    requirePng(path.join(__dirname, file), `trainer visual ${key} ${part}`);
  }
}
for (const kind of CHAR_FILES) {
  const file = path.join(__dirname, characterPath(kind));
  requirePng(file, `character sheet ${kind}`);
  const bytes = fs.readFileSync(file);
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  const expectedFrameWidth = ['player_bike', 'trainer_biker'].includes(kind) ? 48 : 32;
  if (width !== expectedFrameWidth * 4 || height !== 48 * 4) {
    err(`character sheet ${kind} is ${width}x${height}; expected four ${expectedFrameWidth}x48 frames in four directions`);
  }
}
requirePng(path.join(__dirname, 'assets/Graphics/Characters/trainer_LEADER_Brock.png'), 'Mason overworld sheet');
requirePng(path.join(__dirname, 'assets/Graphics/Characters/trainer_LEADER_Misty.png'), 'Seira overworld sheet');
requirePng(path.join(__dirname, 'assets/Graphics/Characters/trainer_LEADER_Surge.png'), 'Toren overworld sheet');
requirePng(path.join(__dirname, 'assets/Graphics/Characters/trainer_LEADER_Erika.png'), 'Eloa overworld sheet');
const checkedBgmSources = new Set();
for (const [key, track] of Object.entries(BGM_TRACKS)) {
  if (!Array.isArray(track.sources) || !track.sources.length) {
    err(`BGM ${key} has no sources`);
    continue;
  }
  for (const source of track.sources) {
    if (path.extname(source).toLowerCase() !== '.ogg') {
      err(`BGM ${key} uses browser-incompatible runtime source ${source}`);
    }
    if (checkedBgmSources.has(source)) continue;
    checkedBgmSources.add(source);
    requireAudio(path.join(__dirname, source), `BGM ${key} ${source}`);
  }
}
if (Object.keys(GRAPHICS_SPECIES_FILE).length !== 80) {
  err(`Graphics species mapping count ${Object.keys(GRAPHICS_SPECIES_FILE).length} != 80`);
}
for (const file of [
  'assets/Graphics/UI/Storage/bg.png',
  'assets/Graphics/UI/Storage/box_0.png',
  'assets/Graphics/UI/Storage/overlay_main.png',
  'assets/Graphics/UI/Summary/bg_1.png',
]) {
  requirePng(path.join(__dirname, file), `UI asset ${file}`);
}

// 3b. Mystery hint database: exactly 27 clues for every playable species.
if (HINT_DEFINITIONS.length !== 27) err(`hint definition count ${HINT_DEFINITIONS.length} != 27`);
for (const type of DEFENSE_HINT_TYPES) if (!TYPES[type]) err(`hint type ${type} missing from TYPES`);
for (const [id, sp] of Object.entries(SPECIES)) {
  const h = HINT_DATA[id];
  if (!h) { err(`${id} has no hint data`); continue; }
  if (h.catchRate !== sp.catchRate) err(`${id} hint catch rate ${h.catchRate} != species ${sp.catchRate}`);
  if (!(h.height > 0 && h.weight > 0)) err(`${id} has invalid hint dimensions`);
  if (!HINT_COLOR_NAMES[h.color]) err(`${id} has unknown hint color ${h.color}`);
  if (!HINT_SHAPE_NAMES[h.shape]) err(`${id} has unknown hint shape ${h.shape}`);
  if (!HINT_GROWTH_NAMES[h.growth]) err(`${id} has unknown hint growth ${h.growth}`);
  if (!/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/.test(h.gender)) err(`${id} has malformed hint gender ${h.gender}`);
  if (h.previous && !SPECIES[h.previous]) err(`${id} hint previous ${h.previous} missing`);
  if (h.next && !SPECIES[h.next]) err(`${id} hint next ${h.next} missing`);
  if (h.next && HINT_DATA[h.next]?.previous !== id) err(`${id} hint next ${h.next} does not link back`);
  if (sp.evolve && (h.next !== sp.evolve.to || h.nextLevel !== sp.evolve.at)) {
    err(`${id} evolution and hint next stage disagree`);
  }
}
for (const id of Object.keys(HINT_DATA)) if (!SPECIES[id]) err(`hint data for unknown species ${id}`);

// 3. Sprite art rows: 16 rows of 8 chars (or 16 chars when wide: true)
for (const [id, a] of Object.entries(CREATURE_ART)) {
  const want = a.wide ? 16 : 8;
  if (a.rows.length !== 16) err(`${id} art has ${a.rows.length} rows`);
  a.rows.forEach((r, i) => { if (r.length !== want) err(`${id} art row ${i} length ${r.length} != ${want}: "${r}"`); });
}

// 4. Moves reference valid types; type chart rows valid
for (const [id, mv] of Object.entries(MOVES)) {
  if (!TYPES[mv.type]) err(`move ${id} unknown type ${mv.type}`);
  if (mv.effect && mv.effect.status && !['PSN','BRN','PAR','SLP','FRZ'].includes(mv.effect.status)) err(`move ${id} bad status`);
}
for (const [atk, row] of Object.entries(TYPE_CHART)) {
  if (!TYPES[atk]) err(`chart unknown attacker ${atk}`);
  for (const d of Object.keys(row)) if (!TYPES[d]) err(`chart unknown defender ${d} (under ${atk})`);
}

// 5. Shop stock items exist
for (const id of SHOP_STOCK) if (!ITEMS[id]) err(`shop stock unknown item ${id}`);
if (!ITEMS.scanner || ITEMS.scanner.kind !== 'scanner') err('scanner item missing or malformed');
if (!ITEMS.rarecandy || ITEMS.rarecandy.kind !== 'level') err('Rare Candy item missing or malformed');
requirePng(path.join(__dirname, 'assets/Graphics/Items/RARECANDY.png'), 'Rare Candy icon');

// 6. makeCreature smoke test for every species
for (const id of Object.keys(SPECIES)) {
  const c = makeCreature(id, 10);
  if (!(c.maxHp > 10 && c.moves.length >= 1 && c.moves.length <= 4 && c.identified === false && c.nickname === '')) err(`makeCreature(${id}) bad: hp=${c.maxHp} moves=${c.moves.length}`);
  c.nickname = '틀린 추측';
  if (creatureName(c) !== '틀린 추측') err(`unidentified ${id} does not keep its guess name`);
  c.identified = true;
  if (creatureName(c) !== speciesName(c)) err(`Scanner name/sprite identity mismatch for ${id}`);
}

console.log(errors === 0 ? 'ALL CHECKS PASSED' : `${errors} ERRORS`);
process.exit(errors ? 1 : 0);
}
