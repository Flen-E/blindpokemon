// ===== WILDVALE — save / load (browser slot + portable save code) =====
const SaveSys = (() => {
  const SLOT = 'wildvale_save_v8';
  const LEGACY_SLOTS = ['wildvale_save_v7', 'wildvale_save_v6', 'wildvale_save_v5', 'wildvale_save_v4', 'wildvale_save_v3', 'wildvale_save_v2'];
  const MAGIC = 'WV8';
  const LEGACY_MAGICS = ['WV7', 'WV6', 'WV5', 'WV4', 'WV3', 'WV2'];

  function snapshot() {
    return {
      v: 7,
      player: Game.player,
    };
  }

  // Portable save code: MAGIC + base64(JSON), unicode-safe.
  function exportCode() {
    const json = JSON.stringify(snapshot());
    return MAGIC + btoa(unescape(encodeURIComponent(json)));
  }

  function decode(code) {
    // tolerate line-wraps / stray whitespace from pasting
    code = (code || '').replace(/\s+/g, '');
    const magic = [MAGIC, ...LEGACY_MAGICS].find(prefix => code.startsWith(prefix));
    if (!magic) throw new Error('bad magic');
    const json = decodeURIComponent(escape(atob(code.slice(magic.length))));
    const data = JSON.parse(json);
    if (!data.player || !Array.isArray(data.player.party)) throw new Error('bad shape');
    return data;
  }

  // Map redesigns may turn an older save's once-walkable coordinate into
  // water, a tree canopy, or a building body. Validate against static decal
  // geometry (image loading is asynchronous) and move only stranded saves to
  // the nearest safe tile. The save shape and map IDs remain unchanged.
  function normalizeLoadedPoint(point, player) {
    if (!point || !MAPS[point.map]) throw new Error('unknown map in save: ' + (point && point.map));
    if (!Number.isFinite(Number(point.x)) || !Number.isFinite(Number(point.y))) {
      throw new Error('bad map coordinates in save');
    }
    const m = MAPS[point.map];
    point.x = Math.trunc(Number(point.x));
    point.y = Math.trunc(Number(point.y));

    const safe = (x, y) => {
      const ch = m.rows[y]?.[x];
      if (ch === undefined) return false;
      const gateFlag = m.puzzle && m.puzzle.gates && m.puzzle.gates[`${x},${y}`];
      if (!(gateFlag && player.flags && player.flags[gateFlag]) && mapTileIsSolid(m, x, y)) return false;
      if (ch !== 'D') {
        for (const d of (MAP_DECALS[point.map] || [])) {
          const body = BUILDING_BODY[d.img];
          if (!body) continue;
          const cx = ((d.x0 + d.x1 + 1) / 2) * 16;
          const x0 = Math.floor((cx - body.w / 2 + 8) / 16);
          const x1 = Math.floor((cx + body.w / 2 - 8) / 16);
          const y0 = d.y1 - Math.ceil((body.h - 8) / 16) + 1;
          if (x >= x0 && x <= x1 && y >= y0 && y <= d.y1) return false;
        }
      }
      return !(m.npcs || []).some(n => n.x === x && n.y === y && !(n.hiddenIf && player.flags && player.flags[n.hiddenIf]));
    };

    if (safe(point.x, point.y)) return;
    let best = null;
    for (let y = 0; y < m.rows.length; y++) {
      for (let x = 0; x < m.rows[y].length; x++) {
        if (!safe(x, y)) continue;
        const distance = Math.abs(x - point.x) + Math.abs(y - point.y);
        const roadBias = ':=_qv'.includes(m.rows[y][x]) ? 0 : 1;
        const warpBias = m.warps && m.warps[`${x},${y}`] ? 2 : 0;
        const score = distance * 10 + roadBias + warpBias;
        if (!best || score < best.score) best = { x, y, score };
      }
    }
    if (!best) throw new Error('save map has no safe landing: ' + point.map);
    point.x = best.x;
    point.y = best.y;
  }

  function normalizePuzzleFlags(player) {
    for (const m of Object.values(MAPS)) {
      const puzzle = m.puzzle || {};
      const sequence = puzzle.sequence;
      if (sequence) {
        const progress = Number(player.flags[sequence.stateFlag]);
        if (!Number.isInteger(progress) || progress < 0 || progress > sequence.order.length) {
          delete player.flags[sequence.stateFlag];
        }
      }
      const push = puzzle.push;
      if (push && Object.prototype.hasOwnProperty.call(player.flags, push.stateFlag)) {
        const state = player.flags[push.stateFlag];
        const valid = state && typeof state === 'object' && push.blocks.every(block => {
          const pos = state[block.id];
          return pos && Number.isInteger(pos.x) && Number.isInteger(pos.y) &&
            m.rows[pos.y]?.[pos.x] !== undefined && !mapTileIsSolid(m, pos.x, pos.y);
        });
        if (!valid) delete player.flags[push.stateFlag];
      }
      const rotors = puzzle.rotors;
      if (rotors && Object.prototype.hasOwnProperty.call(player.flags, rotors.stateFlag)) {
        const state = player.flags[rotors.stateFlag];
        const valid = state && typeof state === 'object' && Object.values(rotors.devices).every(device =>
          Number.isInteger(state[device.id]) && state[device.id] >= 0 && state[device.id] < 4);
        if (!valid) delete player.flags[rotors.stateFlag];
      }
    }
  }

  function applyLoaded(data) {
    for (const c of data.player.party.concat(data.player.vault || [])) {
      if (!SPECIES[c.species]) throw new Error('unknown species in save: ' + c.species);
    }
    if (!data.player.flags || typeof data.player.flags !== 'object') data.player.flags = {};
    normalizePuzzleFlags(data.player);
    normalizeLoadedPoint(data.player, data.player);
    if (data.player.respawn) normalizeLoadedPoint(data.player.respawn, data.player);
    Game.player = data.player;
    if (!Game.player.bag || typeof Game.player.bag !== 'object') Game.player.bag = {};
    // Hint is a reusable tool. Add its presence when loading older saves.
    if (!(Game.player.bag.hint > 0)) Game.player.bag.hint = 1;
    // Scanner is a new finite tool. Older saves receive the opening supply.
    if (!Object.prototype.hasOwnProperty.call(Game.player.bag, 'scanner')) Game.player.bag.scanner = 3;
    // Existing test saves receive the Rare Candy supply once; a saved zero is preserved.
    if (!Object.prototype.hasOwnProperty.call(Game.player.bag, 'rarecandy')) Game.player.bag.rarecandy = 100;
    // The bicycle is now a player state rather than a bag item. Older saves
    // simply start on foot, while legacy item copies cannot resurrect a bag
    // flow that no longer exists.
    delete Game.player.bag.bicycle;
    Game.player.ridingBike = Game.player.ridingBike === true;
    // Saves made before the staged opening flags existed may already have a
    // starter. Treat that completed scene as proof that both tutorials ran so
    // the restored house exit and professor briefing cannot block them later.
    if (Game.player.flags.starter) {
      Game.player.flags.sent_off = true;
      Game.player.flags.prof_briefed = true;
    }
    // Older creatures had no persistent identity flag; keep them mysterious
    // until the player spends a Scanner on them.
    for (const c of Game.player.party.concat(Game.player.vault || [])) {
      c.identified = c.identified === true;
      c.unknown = !c.identified;
      // Old free-form guesses are not valid under the new all-or-release rule.
      c.nickname = '';
      const savedHints = Array.isArray(c.revealedHints) ? c.revealedHints : [];
      c.revealedHints = [...new Set(savedHints.filter(id =>
        HINT_DEFINITIONS.some(def => def.id === id)
      ))];
    }
    if (Game.player.flags.starter && Game.player.party[0]) {
      if (Game.player.flags.starter_uid === undefined) {
        Game.player.flags.starter_uid = Game.player.party[0].uid;
      }
      const starter = Game.player.party.find(c => c.uid === Game.player.flags.starter_uid) || Game.player.party[0];
      if (starter.identified) {
        Game.player.flags.first_partner_scanned = true;
        Game.player.flags.guess_unlocked = true;
      } else if (Game.player.flags.guess_unlocked !== true) {
        Game.player.flags.first_partner_scanned = false;
        Game.player.flags.guess_unlocked = false;
      }
    }
    // Migrate the old English badge label so loaded saves stay Korean too.
    if (Array.isArray(Game.player.badges)) {
      Game.player.badges = Game.player.badges.map(b => b === 'GRANITE BADGE' ? '화강암 배지' : b);
    }
    // Re-derive computed stats in case data predates formula tweaks.
    for (const c of Game.player.party) {
      const hpFrac = c.maxHp ? c.hp / c.maxHp : 1;
      calcStats(c);
      c.hp = Math.min(c.maxHp, Math.max(0, Math.round(c.maxHp * hpFrac)));
    }
  }

  function toLocal() {
    try { localStorage.setItem(SLOT, exportCode()); return true; }
    catch (e) { return false; }
  }

  function hasLocal() {
    try { return [SLOT, ...LEGACY_SLOTS].some(key => !!localStorage.getItem(key)); } catch (e) { return false; }
  }

  function fromLocal() {
    const code = [SLOT, ...LEGACY_SLOTS].map(key => localStorage.getItem(key)).find(Boolean);
    if (!code) return false;
    applyLoaded(decode(code));
    return true;
  }

  function fromCode(code) {
    applyLoaded(decode(code)); // throws on invalid input
    return true;
  }

  return { exportCode, toLocal, hasLocal, fromLocal, fromCode };
})();
