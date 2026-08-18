// ===== Battle system (Gen-3-style mechanics) =====

const STAGE_NAMES = {
  atk: '공격', def: '방어', spa: '특수공격', spd: '특수방어', spe: '스피드',
  acc: '명중률', eva: '회피율',
};

function stageMul(s) { return s >= 0 ? (2 + s) / 2 : 2 / (2 - s); }
function accStageMul(s) { return s >= 0 ? (3 + s) / 3 : 3 / (3 - s); }
function freshStages() { return { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 }; }
function freshVolatiles() { return { flinch: false, confuse: 0, seeded: false }; }

// Use the standard Gen 3 damage pace. Keeping every damage source behind the
// same boundary preserves the minimum-one rule for fixed/status/recoil damage.
const BATTLE_DAMAGE_SCALE = 1;
function battleDamage(raw) { return Math.max(1, Math.floor(raw * BATTLE_DAMAGE_SCALE)); }

// The opponent occupies a smaller front-view slot than the player's close-up
// rear view, matching the usual battle-camera perspective.
const BATTLE_ENEMY_SPRITE_SIZE = 76;

// Gen 3 damage formula: ((2L/5+2) * Power * A/D) / 50 + 2, then
// crit x2, STAB x1.5, type effectiveness, random 85-100%.
function calcDamage(user, target, move, uStages, tStages, crit) {
  const phys = move.cat === 'phys';
  let aStage = uStages[phys ? 'atk' : 'spa'];
  let dStage = tStages[phys ? 'def' : 'spd'];
  if (crit) { aStage = Math.max(0, aStage); dStage = Math.min(0, dStage); }
  let A = Math.floor((phys ? user.atk : user.spa) * stageMul(aStage));
  let D = Math.max(1, Math.floor((phys ? target.def : target.spd) * stageMul(dStage)));
  if (phys && user.status === 'BRN') A = Math.max(1, Math.floor(A / 2));
  let dmg = Math.floor(Math.floor(Math.floor(2 * user.level / 5 + 2) * move.power * A / D) / 50) + 2;
  if (crit) dmg *= 2;
  if (creatureTypes(user).includes(move.type)) dmg = Math.floor(dmg * 1.5);
  dmg = Math.floor(dmg * typeEffectiveness(move.type, creatureTypes(target)));
  dmg = Math.floor(dmg * randInt(85, 100) / 100);
  return battleDamage(dmg);
}

// Confusion self-hit: 40-power typeless physical against own Defense.
function confusionSelfDamage(c) {
  const dmg = Math.floor(Math.floor(Math.floor(2 * c.level / 5 + 2) * 40 * c.atk / Math.max(1, c.def)) / 50) + 2;
  return battleDamage(Math.floor(dmg * randInt(85, 100) / 100));
}

// Effective speed for turn order (paralysis quarters it).
function battleSpeed(c, stages) {
  let s = Math.floor(c.spe * stageMul(stages.spe));
  if (c.status === 'PAR') s = Math.floor(s / 4);
  return s;
}

function pickMultiHits(multi) {
  if (multi === 2) return 2;
  // Gen 3 distribution: 2 (3/8), 3 (3/8), 4 (1/8), 5 (1/8)
  const r = randInt(1, 8);
  if (r <= 3) return 2;
  if (r <= 6) return 3;
  if (r === 7) return 4;
  return 5;
}

const Battle = {
  active: null,
  // opts: { wild: creature } | { trainer: trainerDef }  ->  'win'|'lose'|'ran'|'catch'
  async start(opts) {
    const session = new BattleSession(opts);
    Battle.active = session;
    const result = await session.run();
    Battle.active = null;
    return result;
  },
};

class BattleSession {
  constructor(opts) {
    this.wild = !!opts.wild;
    this.trainer = opts.trainer || null;
    const currentMap = MAPS[Game.player.map];
    this.battleBg = opts.battleBg || (currentMap && currentMap.battleBg)
      || (currentMap && currentMap.outdoor ? 'field' : 'indoor1');
    this.party = Game.player.party;
    if (this.wild) {
      this.enemyParty = [opts.wild];
    } else {
      this.enemyParty = this.trainer.party.map(([sp, lv]) => makeCreature(sp, lv));
    }
    this.enemyIdx = 0;
    this.playerIdx = this.party.findIndex(c => c.hp > 0);
    this.pStages = freshStages();
    this.eStages = freshStages();
    this.vol = { player: freshVolatiles(), enemy: freshVolatiles() };
    this.runAttempts = 0;
    this.revealedHints = Array.isArray(this.enemy.revealedHints)
      ? [...new Set(this.enemy.revealedHints)] : [];
    this.playerSkillUses = 0;
    // Trainer opponents are mystery targets too; every enemy in the party
    // remains anonymous so hints are useful in both battle types.
    for (const c of this.enemyParty) c.unknown = true;
    // Hidden battlers use their JSON-classified body-shape silhouette. The
    // real creature objects remain the sole source of mechanics and hints.
    this.participants = new Set();
    this.evoQueue = [];
    this.over = false;
    this.result = null;
    // canvas scene state (the player keeps the close-up 96px rear view)
    this.fx = {
      p: { x: 18, y: 32, vis: false, flash: 0, dy: 0 },
      e: { x: 124, y: -6, vis: false, flash: 0, dy: 0, scale: 1 },
      orb: { x: 0, y: 0, vis: false, rot: 0 },
    };
    this.particles = [];
    this.shake = 0;
  }

  // ---------- per-type hit effects ----------
  impactFx(moveType, targetSide, typeMult) {
    const fx = targetSide === 'enemy' ? this.fx.e : this.fx.p;
    const cx = fx.x + 48, cy = fx.y + fx.dy + 52;
    this.spawnEffect(moveType, cx, cy);
    this.shake = Math.max(this.shake, typeMult > 1 ? 14 : 9);
  }

  spawnEffect(type, cx, cy) {
    const P = this.particles;
    const add = (n, make) => { for (let i = 0; i < n; i++) P.push(make(i)); };
    const r = (a, b) => a + Math.random() * (b - a);
    switch (type) {
      case 'FIRE':
        add(16, () => ({ kind: 'rect', x: cx + r(-14, 14), y: cy + r(-6, 10), vx: r(-0.5, 0.5), vy: r(-1.8, -0.6), g: -0.01,
          life: r(18, 30), age: 0, size: r(2, 4), color: ['#f86830', '#f8a838', '#f8d030'][randInt(0, 2)] }));
        break;
      case 'WATER': case 'ICE':
        add(16, () => ({ kind: 'rect', x: cx + r(-12, 12), y: cy + r(-12, 0), vx: r(-1.4, 1.4), vy: r(-2.2, -0.6), g: 0.16,
          life: r(20, 32), age: 0, size: r(2, 3), color: ['#4890e8', '#78c0f8', '#d8f0ff'][randInt(0, 2)] }));
        break;
      case 'ELECTRIC':
        add(10, () => ({ kind: 'streak', x: cx + r(-16, 16), y: cy + r(-16, 16), vx: r(-2.5, 2.5), vy: r(-2.5, 2.5), g: 0,
          life: r(8, 14), age: 0, size: r(5, 9), color: ['#f8d030', '#fff8a0'][randInt(0, 1)] }));
        break;
      case 'GRASS': case 'BUG':
        add(14, () => ({ kind: 'rect', x: cx + r(-16, 16), y: cy + r(-14, 2), vx: r(-0.8, 0.8), vy: r(0.2, 1.1), g: 0.01,
          life: r(22, 36), age: 0, size: r(2, 3), color: ['#58b84c', '#88d870', '#c8e858'][randInt(0, 2)] }));
        break;
      case 'POISON':
        add(12, () => ({ kind: 'ring', x: cx + r(-12, 12), y: cy + r(-4, 10), vx: r(-0.3, 0.3), vy: r(-1.2, -0.4), g: 0,
          life: r(20, 30), age: 0, size: r(2, 5), color: ['#a040a0', '#c878c8'][randInt(0, 1)] }));
        break;
      case 'PSYCHIC':
        add(4, (i) => ({ kind: 'ring', x: cx, y: cy, vx: 0, vy: 0, g: 0, grow: 1.2,
          life: 18 + i * 4, age: 0, size: 3, color: ['#f85888', '#f8a8c8'][i % 2] }));
        break;
      case 'GROUND': case 'ROCK': case 'STEEL':
        add(12, () => ({ kind: 'rect', x: cx + r(-14, 14), y: cy + r(-6, 6), vx: r(-1.6, 1.6), vy: r(-2.6, -1), g: 0.22,
          life: r(18, 28), age: 0, size: r(2, 4), color: ['#b8a038', '#8a8278', '#d8d0c0'][randInt(0, 2)] }));
        break;
      case 'GHOST': case 'DARK':
        add(10, () => ({ kind: 'ring', x: cx + r(-14, 14), y: cy + r(-8, 8), vx: r(-0.4, 0.4), vy: r(-0.9, -0.2), g: 0,
          life: r(24, 36), age: 0, size: r(2, 5), color: ['#705898', '#483868'][randInt(0, 1)] }));
        break;
      case 'DRAGON':
        add(14, () => ({ kind: 'rect', x: cx + r(-16, 16), y: cy + r(-16, 16), vx: r(-1.5, 1.5), vy: r(-1.5, 1.5), g: 0,
          life: r(14, 24), age: 0, size: r(2, 3), color: ['#7038f8', '#58c8e8'][randInt(0, 1)] }));
        break;
      case 'CAUGHT_STARS':
        add(8, (i) => ({ kind: 'rect', x: cx, y: cy, vx: Math.cos(i * Math.PI / 4) * 1.6, vy: Math.sin(i * Math.PI / 4) * 1.6 - 0.8, g: 0.06,
          life: 26, age: 0, size: 3, color: ['#f8d030', '#fff8b0'][i % 2] }));
        break;
      case 'BALL_BREAK':
        // white pop flash + red/white shell fragments flying apart
        add(6, (i) => ({ kind: 'ring', x: cx, y: cy, vx: 0, vy: 0, g: 0, grow: 1.8,
          life: 10 + i * 2, age: 0, size: 2, color: '#ffffff' }));
        add(12, (i) => ({ kind: 'rect', x: cx, y: cy,
          vx: Math.cos(i * Math.PI / 6) * r(1.4, 2.4), vy: Math.sin(i * Math.PI / 6) * r(1.4, 2.4) - 1, g: 0.12,
          life: r(16, 26), age: 0, size: r(2, 4), color: i % 2 ? '#e04838' : '#f0f0f0' }));
        break;
      default: // NORMAL, FLYING, FIGHTING - white slash streaks
        add(5, (i) => ({ kind: 'streak', x: cx - 14 + i * 7, y: cy - 14 + i * 5, vx: 2.2, vy: 1.6, g: 0,
          life: 10, age: 0, size: 10, color: '#ffffff' }));
        add(6, () => ({ kind: 'rect', x: cx + r(-10, 10), y: cy + r(-10, 10), vx: r(-1, 1), vy: r(-1, 1), g: 0,
          life: r(10, 16), age: 0, size: 2, color: '#f0f0f0' }));
    }
  }

  drawParticles(ctx) {
    const P = this.particles;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.age++;
      if (p.age >= p.life) { P.splice(i, 1); continue; }
      p.x += p.vx; p.y += p.vy; p.vy += p.g || 0;
      const fade = 1 - p.age / p.life;
      ctx.globalAlpha = Math.max(0.15, fade);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      if (p.kind === 'rect') {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      } else if (p.kind === 'ring') {
        const rad = p.grow ? p.size + p.age * p.grow : p.size;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.stroke();
      } else if (p.kind === 'streak') {
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * p.size, p.y + p.vy * p.size); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  get active() { return this.party[this.playerIdx]; }
  get enemy() { return this.enemyParty[this.enemyIdx]; }

  battlerName(side, c) {
    const prefix = side === 'enemy' && this.wild && c.identified ? '야생 ' : '';
    return prefix + creatureName(c);
  }

  // ---------- main flow ----------
  async run() {
    Game.mode = 'battle';
    Bgm.playBattle(this.wild, !!(this.trainer && this.trainer.badge));
    Sfx.encounter();
    if (!this.wild && this.trainer && this.trainer.trainerVisual) {
      await UI.leaderVsIntro(this.trainer.trainerVisual, this.trainer.name);
    } else {
      await UI.flashScreen(3);
      await UI.fadeOut(250);
      await UI.fadeIn(200);
    }

    // slide in
    this.fx.e.vis = true; this.fx.e.x = 260;
    this.tween(this.fx.e, 'x', 124, 450);
    this.revealOpeningHint();
    if (this.wild) {
      await UI.say('정체를 알 수 없는 야생 포켓몬이 나타났다!');
      if (this.enemy.shiny) {
        Sfx.statUp();
        this.spawnEffect('CAUGHT_STARS', this.fx.e.x + 48, this.fx.e.y + 40);
        await UI.say('우와... 색이 다르다. 색이 다른 포켓몬이다!');
      }
    } else {
      await UI.say(`${this.trainer.name}이(가) 배틀을 원한다!`);
      await UI.say(`${this.trainer.name}이(가) ${creatureName(this.enemy)}을(를) 내보냈다!`);
    }
    UI.setBox('enemy', this.enemy);
    UI.setHints(this.enemy, this.revealedHints);
    UI.setEnemyBalls(this.wild ? null : this.enemyParty);

    await UI.say(`가랏! ${creatureName(this.active)}!`);
    this.fx.p.vis = true; this.fx.p.x = -110;
    await this.tween(this.fx.p, 'x', 18, 350);
    UI.setBox('player', this.active);
    this.participants.add(this.active.uid);

    while (!this.over) {
      await this.turn();
    }

    // post-battle evolutions (from battle EXP)
    await this.handleEvolutions();

    UI.hideBoxes();
    UI.hideDialog();
    Game.mode = 'overworld';
    Bgm.playMap(MAPS[Game.player.map].bgm);
    Input.clearPressed();
    return this.result;
  }

  async turn() {
    const action = await this.playerAction();

    if (action.kind === 'run') {
      if (await this.tryRun()) return;
      await this.enemyTurnOnly();
      return;
    }
    if (action.kind === 'switch') {
      await this.doSwitch(action.idx);
      await this.enemyTurnOnly();
      return;
    }
    if (action.kind === 'item') {
      await this.useBagItem(action.id, action.target);
      await this.enemyTurnOnly();
      return;
    }
    if (action.kind === 'hint') {
      await this.useHintItem(action.id);
      if (await this.resolveFaints()) return;
      await this.enemyTurnOnly();
      return;
    }
    if (action.kind === 'scanner') {
      await this.useScannerItem(action.id);
      if (await this.resolveFaints()) return;
      await this.enemyTurnOnly();
      return;
    }
    if (action.kind === 'orb') {
      const caught = await this.throwOrb(action.id);
      if (caught) return;
      await this.enemyTurnOnly();
      return;
    }

    // FIGHT: resolve both moves in speed/priority order.
    const pMove = action.struggle ? MOVES.struggle : MOVES[this.active.moves[action.moveIdx].id];
    const pSlot = action.struggle ? null : this.active.moves[action.moveIdx];
    const eSlot = this.enemyMoveChoice();
    const eMove = eSlot ? MOVES[eSlot.id] : MOVES.struggle;

    const pPrio = pMove.prio || 0, ePrio = eMove.prio || 0;
    let playerFirst;
    if (pPrio !== ePrio) playerFirst = pPrio > ePrio;
    else {
      const ps = battleSpeed(this.active, this.pStages);
      const es = battleSpeed(this.enemy, this.eStages);
      playerFirst = ps === es ? Math.random() < 0.5 : ps > es;
    }

    const order = playerFirst
      ? [['player', pMove, pSlot], ['enemy', eMove, eSlot]]
      : [['enemy', eMove, eSlot], ['player', pMove, pSlot]];

    for (const [side, move, slot] of order) {
      if (this.over) return;
      const user = side === 'player' ? this.active : this.enemy;
      if (user.hp <= 0) continue;
      const targetUid = this.enemy.uid;
      await this.useMove(side, move, slot);
      if (await this.resolveFaints()) return;
      if (side === 'player' && this.enemy.uid === targetUid && !this.isHintExemptMove(move)) {
        await this.playerSkillUsed();
      }
    }
    await this.endOfTurn();
  }

  async enemyTurnOnly() {
    if (this.over || this.enemy.hp <= 0) return;
    const slot = this.enemyMoveChoice();
    await this.useMove('enemy', slot ? MOVES[slot.id] : MOVES.struggle, slot);
    if (await this.resolveFaints()) return;
    await this.endOfTurn();
  }

  // ---------- player action selection ----------
  async playerAction() {
    while (true) {
      UI.setPrompt(`${creatureName(this.active)}은(는) 무엇을 할까?`);
      const a = await UI.choose(['싸운다', '가방', '교체', '도망간다'], {
        cols: 2, canCancel: false,
        style: { right: '10px', bottom: '10px', width: '290px', height: '108px', padding: '20px 18px' },
      });

      if (a === 0) { // FIGHT
        if (this.active.moves.every(m => m.pp <= 0)) {
          await UI.say(`${creatureName(this.active)}은(는) 사용할 기술이 없다!`);
          return { kind: 'fight', struggle: true };
        }
        const mi = await UI.moveMenu(this.active);
        if (mi === -1) continue;
        return { kind: 'fight', moveIdx: mi };
      }
      if (a === 1) { // BAG
        const id = await UI.bagScreen({ inBattle: true });
        if (!id) continue;
        if (ITEMS[id].kind === 'orb') {
          if (!this.wild) {
            await UI.say('다른 트레이너의 파트너는 잡을 수 없다!');
            continue;
          }
          return { kind: 'orb', id };
        }
        if (ITEMS[id].kind === 'hint') {
          if (this.enemy.identified) {
            await UI.say('정체가 밝혀져서 더 볼 힌트가 없다!');
            continue;
          }
          if (!this.hasHiddenHints()) {
            await UI.say('이미 모든 힌트를 확인했다!');
            continue;
          }
          return { kind: 'hint', id };
        }
        if (ITEMS[id].kind === 'scanner') {
          if (this.enemy.identified) {
            await UI.say('이미 정체가 밝혀진 포켓몬이다!');
            continue;
          }
          return { kind: 'scanner', id };
        }
        if (ITEMS[id].kind === 'level') {
          await UI.say('\uC774\uC0C1\uD55C\uC0AC\uD0D5\uC740 \uBC30\uD2C0 \uC911\uC5D0 \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uB2E4!');
          continue;
        }
        const t = await UI.partyScreen({ title: '누구에게 사용할까요?' });
        if (t === -1) continue;
        if (!this.itemWouldWork(id, this.party[t])) {
          await UI.say('아무 효과도 없다.');
          continue;
        }
        return { kind: 'item', id, target: t };
      }
      if (a === 2) { // SWITCH
        const idx = await UI.partyScreen({ title: '누구와 교체할까요?' });
        if (idx === -1) continue;
        if (idx === this.playerIdx) { await UI.say(`${creatureName(this.active)}은(는) 이미 배틀 중이다!`); continue; }
        if (this.party[idx].hp <= 0) { await UI.say(`${creatureName(this.party[idx])}은(는) 배틀할 힘이 없다!`); continue; }
        return { kind: 'switch', idx };
      }
      return { kind: 'run' };
    }
  }

  itemWouldWork(id, c) {
    const it = ITEMS[id];
    if (c.hp <= 0) return false;
    if (it.kind === 'heal') return c.hp < c.maxHp;
    if (it.kind === 'cure') return c.status && (it.cures.includes('ALL') || it.cures.includes(c.status));
    return false;
  }

  hasHiddenHints() {
    return this.revealedHints.length < HINT_DEFINITIONS.length;
  }

  rememberRevealedHints() {
    this.enemy.revealedHints = [...new Set(this.revealedHints)];
  }

  revealHint(id) {
    if (!HINT_DEFINITIONS.some(def => def.id === id) || this.revealedHints.includes(id)) return null;
    this.revealedHints.push(id);
    this.rememberRevealedHints();
    UI.setHints(this.enemy, this.revealedHints);
    return id;
  }

  revealOpeningHint() {
    return this.revealHint('color') || this.revealRandomHint();
  }

  revealRandomHint() {
    const locked = HINT_DEFINITIONS.filter(h => !this.revealedHints.includes(h.id));
    if (!locked.length) return null;
    const picked = locked[randInt(0, locked.length - 1)].id;
    return this.revealHint(picked);
  }

  revealRandomHints(count) {
    const picked = [];
    for (let i = 0; i < count; i++) {
      const id = this.revealRandomHint();
      if (!id) break;
      picked.push(id);
    }
    return picked;
  }

  async playerSkillUsed() {
    if (this.enemy.identified) return;
    this.playerSkillUses++;
    if (this.playerSkillUses % 2 !== 0) return;
    const picked = this.revealRandomHint();
    if (!picked) return;
    Sfx.statUp();
    await UI.say('싸우다 보니 상대 포켓몬의 특징이 조금 드러났다!');
  }

  async useHintItem(id) {
    if (!ITEMS[id].unlimited) Game.player.bag[id]--;
    const count = 2;
    const picked = this.revealRandomHints(count);
    if (!picked.length) {
      await UI.say('더 공개할 힌트가 없다!');
      return;
    }
    Sfx.statUp();
    const details = picked.map(id => `${hintLabel(id)}: ${hintValue(this.enemy, id)}`).join('\n');
    await UI.say(`힌트 ${picked.length}개 공개!\n${details}`);
    // The clue gets its own weaker, recoil-free attack so using it is not
    // punished like Struggle while still giving the enemy its normal turn.
    await this.useMove('player', MOVES.hintstrike, null);
  }

  async useScannerItem(id) {
    Game.player.bag[id]--;
    identifyCreature(this.enemy);
    UI.setBox('enemy', this.enemy);
    UI.setHints(null, []);
    Sfx.statUp();
    await UI.say(`스캐너 작동! 정체는 ${speciesName(this.enemy)}이다!`);
  }

  isHintExemptMove(move) {
    return move.special === 'falseSwipe' || move.special === 'falseswipe'
      || move.name === '\uCE7C\uB4F1\uCE58\uAE30';
  }

  revealKnownTypeHint(move, targetSide) {
    if (targetSide !== 'enemy' || this.enemy.identified || this.isHintExemptMove(move)) return;
    const id = `def_${move.type}`;
    this.revealHint(id);
  }

  async useBagItem(id, targetIdx) {
    const it = ITEMS[id];
    const c = this.party[targetIdx];
    Game.player.bag[id]--;
    if (it.kind === 'heal') {
      const from = c.hp;
      c.hp = Math.min(c.maxHp, c.hp + it.amount);
      Sfx.heal();
      await UI.say(`${creatureName(c)}의 체력이 ${c.hp - from} 회복되었다!`, { noWait: true, keep: true });
      if (targetIdx === this.playerIdx) await UI.animateHp('player', from, c.hp, c.maxHp);
      await wait(300);
      UI.hideDialog();
    } else {
      c.status = null; c.sleepTurns = 0;
      Sfx.heal();
      if (targetIdx === this.playerIdx) UI.setStatusChip('player', null);
      await UI.say(`${creatureName(c)}의 상태 이상이 사라졌다!`);
    }
  }

  // ---------- switching ----------
  async doSwitch(idx, recallMsg = true) {
    if (recallMsg && this.active && this.active.hp > 0) {
      await UI.say(`${creatureName(this.active)}, 돌아와!`);
    }
    this.fx.p.vis = false;
    this.playerIdx = idx;
    this.pStages = freshStages();
    this.vol.player = freshVolatiles();
    await UI.say(`가랏! ${creatureName(this.active)}!`);
    this.fx.p.vis = true; this.fx.p.x = -110; this.fx.p.dy = 0;
    await this.tween(this.fx.p, 'x', 18, 300);
    UI.setBox('player', this.active);
    if (this.enemy.hp > 0) this.participants.add(this.active.uid);
  }

  // ---------- running ----------
  async tryRun() {
    if (!this.wild) {
      await UI.say('안 돼! 트레이너 배틀에서는 도망칠 수 없다!');
      return false; // counts as the player's turn anyway (enemy attacks)
    }
    this.runAttempts++;
    const ps = battleSpeed(this.active, this.pStages);
    const es = Math.max(1, battleSpeed(this.enemy, this.eStages));
    const f = Math.floor(ps * 128 / es) + 30 * this.runAttempts;
    if (f > 255 || randInt(0, 255) < f) {
      Sfx.run();
      await UI.say('안전하게 도망쳤다!');
      this.over = true; this.result = 'ran';
      return true;
    }
    await UI.say('도망칠 수 없다!');
    return false;
  }

  // ---------- enemy AI ----------
  enemyMoveChoice() {
    const usable = this.enemy.moves.filter(m => m.pp > 0);
    if (!usable.length) return null; // struggle
    const damaging = usable.filter(m => MOVES[m.id].power > 0);
    const superEff = damaging.filter(m =>
      typeEffectiveness(MOVES[m.id].type, creatureTypes(this.active)) > 1);
    if (superEff.length && Math.random() < 0.6) return superEff[randInt(0, superEff.length - 1)];
    return usable[randInt(0, usable.length - 1)];
  }

  // ---------- move execution ----------
  async useMove(side, move, slot) {
    const user = side === 'player' ? this.active : this.enemy;
    const target = side === 'player' ? this.enemy : this.active;
    const targetSide = side === 'player' ? 'enemy' : 'player';
    const uStages = side === 'player' ? this.pStages : this.eStages;
    const tStages = side === 'player' ? this.eStages : this.pStages;
    const uVol = this.vol[side];
    const name = this.battlerName(side, user);

    // Pre-move status / volatile checks
    if (user.status === 'SLP') {
      user.sleepTurns--;
      if (user.sleepTurns > 0) {
        Sfx.statusFx();
        await UI.say(`${name}은(는) 깊이 잠들어 있다.`);
        return;
      }
      user.status = null;
      UI.setStatusChip(side, null);
        await UI.say(`${name}이(가) 깨어났다!`);
    }
    if (user.status === 'FRZ') {
      if (Math.random() < 0.2) {
        user.status = null;
        UI.setStatusChip(side, null);
        await UI.say(`${name}이(가) 얼음에서 녹았다!`);
      } else {
        Sfx.statusFx();
        await UI.say(`${name}은(는) 꽁꽁 얼어 움직일 수 없다!`);
        return;
      }
    }
    if (uVol.flinch) {
      uVol.flinch = false;
      Sfx.statusFx();
      await UI.say(`${name}은(는) 풀이 죽어 움직일 수 없다!`);
      return;
    }
    if (uVol.confuse > 0) {
      uVol.confuse--;
      if (uVol.confuse === 0) {
        await UI.say(`${name}이(가) 혼란에서 벗어났다!`);
      } else {
        Sfx.statusFx();
        await UI.say(`${name}은(는) 혼란 상태다!`);
        if (Math.random() < 0.5) {
          const dmg = confusionSelfDamage(user);
          const from = user.hp;
          user.hp = Math.max(0, user.hp - dmg);
          Sfx.hit();
          const fx = side === 'player' ? this.fx.p : this.fx.e;
          fx.flash = 14;
          await UI.say('혼란으로 자신을 공격했다!', { noWait: true, keep: true });
          await UI.animateHp(side, from, user.hp, user.maxHp);
          UI.hideDialog();
          return;
        }
      }
    }
    if (user.status === 'PAR' && Math.random() < 0.25) {
      Sfx.statusFx();
      await UI.say(`${name}은(는) 몸이 완전히 마비되어 움직일 수 없다!`);
      return;
    }

    if (slot) slot.pp = Math.max(0, slot.pp - 1);
    await UI.say(`${name}은(는) ${move.name}을(를) 사용했다!`, { noWait: true, keep: true });
    await wait(350);

    // Accuracy check (with accuracy/evasion stages)
    if (move.acc !== true) {
      const stage = Math.max(-6, Math.min(6, uStages.acc - tStages.eva));
      const chance = move.acc * accStageMul(stage);
      if (randInt(1, 100) > chance) {
        await UI.say(`${name}의 공격이 빗나갔다!`);
        return;
      }
    }

    if (move.cat === 'status') {
      if (move.special === 'leechseed') {
        await this.applyLeechSeed(targetSide, target);
      } else {
        await this.applyEffect(side, move.effect, user, target, uStages, tStages);
      }
      UI.hideDialog();
      return;
    }

    // Damaging move
    const typeMult = typeEffectiveness(move.type, creatureTypes(target));
    // A player who tests a type learns that defensive clue directly. It is
    // not spent as a random reveal, so later clues still remain independent.
    if (side === 'player') this.revealKnownTypeHint(move, targetSide);
    if (typeMult === 0) {
      await UI.say(`${creatureName(target)}에게는 효과가 없다...`);
      return;
    }

    const atkFx = side === 'player' ? this.fx.p : this.fx.e;
    const defFx = side === 'player' ? this.fx.e : this.fx.p;
    const dir = side === 'player' ? 1 : -1;

    // Super Fang: fixed damage, no crit/STAB/type math beyond immunity.
    if (move.special === 'superfang') {
      const dmg = battleDamage(Math.floor(target.hp / 2));
      await this.tween(atkFx, 'x', atkFx.x + 14 * dir, 90);
      this.tween(atkFx, 'x', atkFx.x - 14 * dir, 140);
      defFx.flash = 18;
      this.impactFx(move.type, targetSide, 1);
      Sfx.hit();
      const from = target.hp;
      target.hp = Math.max(0, target.hp - dmg);
      await UI.animateHp(targetSide, from, target.hp, target.maxHp);
      UI.hideDialog();
      return;
    }

    const hits = move.multi ? pickMultiHits(move.multi) : 1;
    let landed = 0;
    let totalDamage = 0;
    let lastCrit = false;
    for (let h = 0; h < hits && target.hp > 0; h++) {
      const crit = Math.random() < (move.hiCrit ? 1 / 8 : 1 / 16);
      const dmg = calcDamage(user, target, move, uStages, tStages, crit);
      lastCrit = crit;
      await this.tween(atkFx, 'x', atkFx.x + 14 * dir, 90);
      this.tween(atkFx, 'x', atkFx.x - 14 * dir, 140);
      defFx.flash = 18;
      this.impactFx(move.type, targetSide, typeMult);
      if (typeMult > 1) Sfx.superHit(); else if (typeMult < 1) Sfx.weakHit(); else Sfx.hit();
      const from = target.hp;
      target.hp = Math.max(0, target.hp - dmg);
      totalDamage += from - target.hp;
      await UI.animateHp(targetSide, from, target.hp, target.maxHp);
      landed++;
      // per-hit secondary for multi-hit moves with effects (e.g. Twineedle)
      if (move.effect && move.multi && target.hp > 0 && Math.random() < move.effect.chance) {
        await this.applyEffect(side, move.effect, user, target, uStages, tStages);
      }
    }

    if (lastCrit) await UI.say('급소에 맞았다!');
    if (move.multi) await UI.say(`${landed}회 연속으로 맞았다!`);
    if (typeMult > 1) await UI.say('효과가 굉장했다!');
    else if (typeMult < 1) await UI.say('효과가 별로인 듯하다...');

    // Fire moves thaw a frozen target.
    if (move.type === 'FIRE' && target.status === 'FRZ' && target.hp > 0) {
      target.status = null;
      UI.setStatusChip(targetSide, null);
      await UI.say(`${creatureName(target)}이(가) 얼음에서 녹았다!`);
    }

    if (move.drain && totalDamage > 0 && user.hp > 0 && user.hp < user.maxHp) {
      const healed = Math.max(1, Math.floor(totalDamage * move.drain));
      const uFrom = user.hp;
      user.hp = Math.min(user.maxHp, user.hp + healed);
      await UI.say(`${name}은(는) 체력을 흡수했다!`, { noWait: true, keep: true });
      await UI.animateHp(side, uFrom, user.hp, user.maxHp);
      UI.hideDialog();
    }

    // Recoil (Struggle)
    if (move.recoil && landed > 0) {
      const rec = battleDamage(Math.floor(user.maxHp / 8));
      const uFrom = user.hp;
      user.hp = Math.max(0, user.hp - rec);
      await UI.say(`${name}은(는) 반동 데미지를 입었다!`, { noWait: true, keep: true });
      await UI.animateHp(side, uFrom, user.hp, user.maxHp);
      UI.hideDialog();
    }

    // Secondary effect (single-hit moves)
    if (move.effect && !move.multi && target.hp > 0 && Math.random() < move.effect.chance) {
      await this.applyEffect(side, move.effect, user, target, uStages, tStages);
    }
    UI.hideDialog();
  }

  async applyEffect(side, eff, user, target, uStages, tStages) {
    if (!eff) return;
    const targetSide = side === 'player' ? 'enemy' : 'player';
    if (eff.status) {
      await this.inflictStatus(targetSide, target, eff.status);
      return;
    }
    if (eff.volatile === 'flinch') {
      this.vol[targetSide].flinch = true; // silent until it procs
      return;
    }
    if (eff.volatile === 'confuse') {
      if (this.vol[targetSide].confuse > 0 || target.hp <= 0) {
        await UI.say('하지만 실패했다!');
        return;
      }
      this.vol[targetSide].confuse = randInt(2, 5);
      Sfx.statusFx();
      await UI.say(`${this.battlerName(targetSide, target)}이(가) 혼란 상태가 되었다!`);
      return;
    }
    // stat stage change
    const self = eff.target === 'self';
    const who = self ? user : target;
    const stages = self ? uStages : tStages;
    const stat = eff.stat;
    const cur = stages[stat];
    const next = Math.max(-6, Math.min(6, cur + eff.stages));
    const name = creatureName(who);
    if (next === cur) {
      await UI.say(`${name}의 ${STAGE_NAMES[stat]}은(는) 더 이상 ${eff.stages > 0 ? '오르지' : '내려가지'} 않는다!`);
      return;
    }
    stages[stat] = next;
    if (eff.stages > 0) Sfx.statUp(); else Sfx.statDown();
    const adv = Math.abs(eff.stages) >= 2 ? '크게 ' : '';
    await UI.say(`${name}의 ${STAGE_NAMES[stat]}이(가) ${adv}${eff.stages > 0 ? '올랐다' : '떨어졌다'}!`);
  }

  async applyLeechSeed(targetSide, target) {
    if (creatureTypes(target).includes('GRASS')) {
      await UI.say(`${creatureName(target)}에게는 효과가 없다...`);
      return;
    }
    if (this.vol[targetSide].seeded) {
      await UI.say('하지만 실패했다!');
      return;
    }
    this.vol[targetSide].seeded = true;
    Sfx.statusFx();
    await UI.say(`${this.battlerName(targetSide, target)}에게 씨앗이 심어졌다!`);
  }

  async inflictStatus(targetSide, target, status) {
    if (target.status || target.hp <= 0) {
      await UI.say('하지만 실패했다!');
      return;
    }
    const types = creatureTypes(target);
    if (status === 'BRN' && types.includes('FIRE')) { await UI.say(`${creatureName(target)}에게는 효과가 없다...`); return; }
    if (status === 'PSN' && (types.includes('POISON') || types.includes('STEEL'))) { await UI.say(`${creatureName(target)}에게는 효과가 없다...`); return; }
    target.status = status;
    if (status === 'SLP') target.sleepTurns = randInt(2, 4);
    Sfx.statusFx();
    UI.setStatusChip(targetSide, status);
    await UI.say(`${this.battlerName(targetSide, target)}이(가) ${STATUS_INFO[status].text} 상태가 되었다!`);
  }

  // ---------- end of turn ----------
  async endOfTurn() {
    if (this.over) return;
    for (const side of ['player', 'enemy']) {
      const c = side === 'player' ? this.active : this.enemy;
      if (c.hp <= 0) continue;
      if (c.status === 'PSN' || c.status === 'BRN') {
        const dmg = battleDamage(Math.floor(c.maxHp / 8));
        const from = c.hp;
        c.hp = Math.max(0, c.hp - dmg);
        Sfx.statusFx();
        const verb = c.status === 'PSN' ? '독의 데미지를 입었다' : '화상의 데미지를 입었다';
        await UI.say(`${creatureName(c)}은(는) ${verb}!`, { noWait: true, keep: true });
        await UI.animateHp(side, from, c.hp, c.maxHp);
        UI.hideDialog();
        if (await this.resolveFaints()) return;
      }
      // Leech Seed drain
      if (this.vol[side].seeded && c.hp > 0) {
        const other = side === 'player' ? this.enemy : this.active;
        const dmg = battleDamage(Math.floor(c.maxHp / 8));
        const from = c.hp;
        c.hp = Math.max(0, c.hp - dmg);
        Sfx.statusFx();
        await UI.say(`${creatureName(c)}은(는) 씨뿌리기로 체력을 빼앗겼다!`, { noWait: true, keep: true });
        await UI.animateHp(side, from, c.hp, c.maxHp);
        if (other && other.hp > 0) {
          const oFrom = other.hp;
          other.hp = Math.min(other.maxHp, other.hp + dmg);
          await UI.animateHp(side === 'player' ? 'enemy' : 'player', oFrom, other.hp, other.maxHp);
        }
        UI.hideDialog();
        if (await this.resolveFaints()) return;
      }
    }
    this.vol.player.flinch = false;
    this.vol.enemy.flinch = false;
  }

  // Returns true if the battle ended (or flow should stop this turn).
  async resolveFaints() {
    // Enemy faint
    if (this.enemy.hp <= 0 && !this.over) {
      // Defeating a mystery opponent is itself a full identification event.
      // Reveal the real sprite while it is still visible, then play the faint
      // animation so the result never disappears behind an already-fallen
      // silhouette. Scanner-identified opponents skip the duplicate reveal.
      if (!this.enemy.identified) {
        identifyCreature(this.enemy);
        UI.setBox('enemy', this.enemy);
        UI.clearHints();
        Sfx.statUp();
        await UI.flashScreen(2);
        await UI.say(`쓰러진 상대의 정체는 ${speciesName(this.enemy)}였다!`);
      }
      Sfx.faint();
      await this.faintAnim(this.fx.e);
      if (!this.wild) UI.setEnemyBalls(this.enemyParty); // darken the fallen one
      await UI.say(`${this.battlerName('enemy', this.enemy)}은(는) 쓰러졌다!`);
      const next = this.enemyParty.findIndex(c => c.hp > 0);
      if (this.wild || next === -1) {
        Bgm.playVictory(this.wild, !!(this.trainer && this.trainer.badge));
      }
      await this.awardExp();
      if (!this.wild && next !== -1) {
        this.enemyIdx = next;
        this.revealedHints = Array.isArray(this.enemy.revealedHints)
          ? [...new Set(this.enemy.revealedHints)] : [];
        this.playerSkillUses = 0;
        this.revealOpeningHint();
        this.eStages = freshStages();
        this.vol.enemy = freshVolatiles();
        this.participants = new Set(this.active.hp > 0 ? [this.active.uid] : []);
        await UI.say(`${this.trainer.name}이(가) ${creatureName(this.enemy)}을(를) 내보냈다!`);
        this.fx.e.vis = true; this.fx.e.dy = 0; this.fx.e.x = 260; this.fx.e.scale = 1;
        await this.tween(this.fx.e, 'x', 124, 350);
        UI.setBox('enemy', this.enemy);
        UI.setEnemyBalls(this.enemyParty);
      } else {
        if (!this.wild) {
          await UI.say(`${this.trainer.name}에게 승리했다!`);
          Game.player.money += this.trainer.prize;
          await UI.say(`승리해서 상금 $${this.trainer.prize}을(를) 받았다!`);
        }
        this.over = true; this.result = 'win';
        return true;
      }
    }
    // Player faint
    if (this.active.hp <= 0 && !this.over) {
      this.active.status = null; this.active.sleepTurns = 0;
      this.vol.player = freshVolatiles();
      Sfx.faint();
      await this.faintAnim(this.fx.p);
      UI.setStatusChip('player', null);
      await UI.say(`${creatureName(this.active)}은(는) 쓰러졌다!`);
      const anyLeft = this.party.some(c => c.hp > 0);
      if (!anyLeft) {
        this.over = true; this.result = 'lose';
        return true;
      }
      let idx;
      do {
        idx = await UI.partyScreen({ title: '다음 동료를 선택하세요.', forced: true });
      } while (this.party[idx].hp <= 0);
      await this.doSwitch(idx, false);
      return true; // faint interrupts remaining actions this turn
    }
    return this.over;
  }

  async faintAnim(fx) {
    await this.tween(fx, 'dy', 30, 250);
    fx.vis = false;
    fx.dy = 0;
  }

  // ---------- EXP / levels ----------
  // Later-gen style EXP Share: every able party member earns experience —
  // battle participants get the full amount, benchwarmers get half.
  async awardExp() {
    if (this.enemyIsCaught) return;
    const sp = SPECIES[this.enemy.species];
    let base = Math.floor(sp.expYield * this.enemy.level / 7);
    if (!this.wild) base = Math.floor(base * 1.5);
    base = Math.max(1, base);
    for (const c of this.party) {
      if (c.hp <= 0 || c.level >= 100) continue;
      const amount = this.participants.has(c.uid) ? base : Math.max(1, Math.floor(base / 2));
      await this.gainExp(c, amount);
    }
  }

  async gainExp(c, amount) {
    if (c.level >= 100) return;
    Sfx.expTick();
    await UI.say(`${creatureName(c)}이(가) 경험치를 ${amount} 얻었다!`);
    const isActive = c === this.active;
    while (c.level < 100) {
      const next = expForLevel(c.level + 1);
      if (c.exp + amount < next) {
        c.exp += amount;
        amount = 0;
        if (isActive) await UI.animateExp(0, expProgress(c));
        break;
      }
      amount -= (next - c.exp);
      c.exp = next;
      if (isActive) await UI.animateExp(expProgress(c), 1);
      await this.levelUp(c);
    }
  }

  async levelUp(c) {
    c.level++;
    const oldMax = c.maxHp;
    calcStats(c);
    c.hp = Math.min(c.maxHp, c.hp + (c.maxHp - oldMax));
    Sfx.levelUp();
    if (c === this.active) UI.setBox('player', this.active);
    await UI.say(`${creatureName(c)}의 레벨이 ${c.level}(으)로 올랐다!`);
    // new moves at this level
    const sp = SPECIES[c.species];
    for (const entry of sp.learnset.filter(e => e.lv === c.level)) {
      await this.learnMove(c, entry.move);
    }
    // queue evolution
    if (sp.evolve && c.level >= sp.evolve.at && !this.evoQueue.includes(c)) {
      this.evoQueue.push(c);
    }
  }

  async learnMove(c, moveId) {
    if (c.moves.some(m => m.id === moveId)) return;
    const mv = MOVES[moveId];
    if (c.moves.length < 4) {
      c.moves.push({ id: moveId, pp: mv.pp, maxPp: mv.pp });
      Sfx.statUp();
      await UI.say(`${creatureName(c)}이(가) ${mv.name}을(를) 배웠다!`);
      return;
    }
    await UI.say(`${creatureName(c)}이(가) ${mv.name}을(를) 배우고 싶어 한다. 하지만 이미 기술을 4개 알고 있다.`);
    const yes = await UI.yesNo(`${mv.name}을(를) 배울 자리를 만들기 위해 기술 하나를 잊을까요?`);
    if (!yes) {
      await UI.say(`${creatureName(c)}은(는) ${mv.name}을(를) 배우지 않았다.`);
      return;
    }
    UI.setPrompt('어떤 기술을 잊을까요?');
    const pick = await UI.choose(c.moves.map(m => MOVES[m.id].name).concat('취소'),
      { style: { right: '14px', bottom: '126px' } });
    UI.hideDialog();
    if (pick === -1 || pick === 4) {
      await UI.say(`${creatureName(c)}은(는) ${mv.name}을(를) 배우지 않았다.`);
      return;
    }
    const old = MOVES[c.moves[pick].id].name;
    c.moves[pick] = { id: moveId, pp: mv.pp, maxPp: mv.pp };
    await UI.say(`하나... 둘... 뿅! ${creatureName(c)}은(는) ${old}을(를) 잊고 ${mv.name}을(를) 배웠다!`);
  }

  async handleEvolutions() {
    for (const c of this.evoQueue) {
      const sp = SPECIES[c.species];
      if (!sp.evolve || c.level < sp.evolve.at) continue;
      const oldName = creatureName(c);
      await UI.say('뭐지? 진화하려고 한다!');
      Sfx.evolve();
      await UI.flashScreen(4);
      const oldMax = c.maxHp;
      c.species = sp.evolve.to;
      c.revealedHints = [];
      calcStats(c);
      c.hp = Math.min(c.maxHp, c.hp + (c.maxHp - oldMax));
      if (c === this.active && this.fx.p.vis) UI.setBox('player', this.active);
      await UI.say(`축하합니다! ${oldName}이(가) ${creatureName(c)}으로 진화했다!`);
      // check for moves learnable at this exact level in the new form
      for (const entry of SPECIES[c.species].learnset.filter(e => e.lv === c.level)) {
        await this.learnMove(c, entry.move);
      }
    }
    this.evoQueue = [];
  }

  // ---------- capture ----------
  async throwOrb(id) {
    Game.player.bag[id]--;
    await UI.say(`${ITEMS[id].name}을(를) 던졌다!`, { noWait: true, keep: true });
    Sfx.thrown();
    // clear the HUD so the ball takes center stage during the attempt
    UI.hideBoxes();

    // ball arc to the enemy
    const orb = this.fx.orb;
    orb.vis = true;
    await this.arcTween(orb, 60, 110, 172, 36, 450);
    // enemy gets pulled into the ball (shrink + flash)
    this.fx.e.flash = 12;
    Sfx.statusFx();
    await this.tween(this.fx.e, 'scale', 0, 320);
    this.fx.e.vis = false;
    this.fx.e.scale = 1;
    await this.tween(orb, 'y', 76, 250);

    // Gen 3 catch formula
    const en = this.enemy;
    const rate = SPECIES[en.species].catchRate;
    const ball = ITEMS[id].rate;
    const statusMul = (en.status === 'SLP' || en.status === 'FRZ') ? 2 : en.status ? 1.5 : 1;
    let a = Math.floor((3 * en.maxHp - 2 * en.hp) * rate * ball / (3 * en.maxHp)) * statusMul;
    a = Math.max(1, Math.floor(a));
    let shakes = 0;
    if (a >= 255) shakes = 4;
    else {
      const b = Math.floor(1048560 / Math.sqrt(Math.sqrt(Math.floor(16711680 / a))));
      for (let i = 0; i < 4; i++) {
        if (randInt(0, 65535) < b) shakes++;
        else break;
      }
    }

    // shake animation: up to 3 distinct wobbles, each with its own beep
    for (let i = 0; i < Math.min(shakes, 3); i++) {
      await wait(480);
      Sfx.shake();
      await this.tween(orb, 'rot', -1.6, 110);
      await this.tween(orb, 'rot', 1.6, 170);
      await this.tween(orb, 'rot', 0, 110);
    }
    await wait(480);

    if (shakes === 4) {
      // the lock click + a burst of stars
      Sfx.catchClick();
      this.spawnEffect('CAUGHT_STARS', orb.x, orb.y - 6);
      await wait(550);
      Sfx.caught();
      Bgm.playVictory(true, false);
      UI.hideDialog();
      // A caught creature keeps its mystery status unless the Scanner was
      // used first; this makes Scanners useful for both wild encounters and
      // already-caught party members.
      en.unknown = !en.identified;
      await UI.say(`${creatureName(en)}을(를) 잡았다!`);
      orb.vis = false;
      this.enemyIsCaught = true;
      if (Game.player.party.length < 6) {
        Game.player.party.push(en);
        await UI.say(`${creatureName(en)}이(가) 동료가 되었다!`);
      } else {
        Game.player.vault.push(en);
        await UI.say('팀이 가득 찼다.');
        await UI.say(`${creatureName(en)}은(는) 보관소로 보내졌다!`);
      }
      this.over = true;
      this.result = 'catch';
      return true;
    }

    // breakout: the ball bursts open with a flash and flying shell pieces
    Sfx.breakout();
    this.spawnEffect('BALL_BREAK', orb.x, orb.y);
    this.shake = Math.max(this.shake, 10);
    orb.vis = false;
    this.fx.e.vis = true;
    this.fx.e.flash = 10;
    UI.setBox('enemy', this.enemy);
    UI.setBox('player', this.active);
    UI.setHints(this.enemy, this.revealedHints);
    UI.hideDialog();
    const msgs = [
      '이런! 빠져나왔다!',
      '아아! 잡힌 줄 알았는데!',
      '아악! 거의 잡을 뻔했는데!',
      '이런! 정말 아까웠다!',
    ];
    await UI.say(msgs[shakes]);
    return false;
  }

  // ---------- animations / drawing ----------
  tween(obj, prop, to, ms) {
    const from = obj[prop];
    return new Promise(res => {
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / ms);
        obj[prop] = from + (to - from) * k;
        if (k < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
  }

  arcTween(orb, x0, y0, x1, y1, ms) {
    return new Promise(res => {
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / ms);
        orb.x = x0 + (x1 - x0) * k;
        orb.y = y0 + (y1 - y0) * k - 46 * Math.sin(Math.PI * k);
        if (k < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
  }

  draw(ctx) {
    ctx.save();
    if (this.shake > 0) {
      this.shake--;
      const m = Math.min(3, this.shake * 0.45);
      ctx.translate((Math.random() * 2 - 1) * m, (Math.random() * 2 - 1) * m);
    }
    // backdrop fills the whole (possibly widened) viewport, cover-scaled so
    // the painted ground sits where the sprites stand; the 240px-wide scene
    // composition is centered inside it
    const W = Game.viewW;
    const bg = GameAssets.battleBackground(this.battleBg);
    if (bg) {
      const s = Math.max((W + 8) / bg.width, 168 / bg.height);
      const bw = bg.width * s, bh = bg.height * s;
      ctx.drawImage(bg, (W - bw) / 2, (160 - bh) / 2, bw, bh);
    } else {
      ctx.fillStyle = '#a8d8f0';
      ctx.fillRect(-4, -4, W + 8, 120);
      ctx.fillStyle = '#90c878';
      ctx.fillRect(-4, 112, W + 8, 56);
    }
    ctx.translate((W - 240) / 2, 0);

    const e = this.fx.e, p = this.fx.p, orb = this.fx.orb;
    if (e.flash > 0) e.flash--;
    if (p.flash > 0) p.flash--;

    // soft ground shadows anchored under each combatant (kills the
    // floating-in-air look and moves with lunge animations)
    const shadow = (cx, cy, rx) => {
      ctx.fillStyle = 'rgba(24,48,24,.28)';
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, rx * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    };
    if (e.vis) shadow(e.x + 48, 90, 26);
    if (p.vis) shadow(p.x + 48, 127, 36);
    if (orb.vis) shadow(orb.x, 84, 9);

    if (e.vis && (e.flash <= 0 || Math.floor(e.flash / 3) % 2 === 0)) {
      const sc = e.scale === undefined ? 1 : e.scale;
      const sz = BATTLE_ENEMY_SPRITE_SIZE * sc;
      const x = e.x + (96 - sz) / 2, y = e.y + e.dy + (96 - sz);
      if (this.enemy.identified) {
        const img = GameAssets.frontFor(this.enemy.species, this.enemy.shiny) || Sprites.creature(this.enemy.species);
        ctx.drawImage(img, x, y, sz, sz);
      } else {
        GameAssets.drawMysterySilhouette(ctx, this.enemy.species, x, y, sz);
      }
    }
    if (p.vis && (p.flash <= 0 || Math.floor(p.flash / 3) % 2 === 0)) {
      if (this.active.identified) {
        const img = GameAssets.backFor(this.active.species, this.active.shiny) || Sprites.creature(this.active.species);
        ctx.drawImage(img, p.x, p.y + p.dy, 96, 96);
      } else {
        GameAssets.drawMysterySilhouette(ctx, this.active.species, p.x, p.y + p.dy, 96, 96, 'back');
      }
    }
    if (orb.vis) {
      ctx.save();
      // tilt + sideways rock so the wobble reads clearly at GBA scale
      ctx.translate(orb.x + orb.rot * 3, orb.y);
      ctx.rotate(orb.rot * 0.45);
      ctx.fillStyle = '#303038';
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e04838';
      ctx.beginPath(); ctx.arc(0, -0.5, 4, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#f0f0f0';
      ctx.beginPath(); ctx.arc(0, 0.8, 4, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    }

    this.drawParticles(ctx);
    ctx.restore();
  }

}
