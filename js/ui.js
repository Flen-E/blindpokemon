// ===== WILDVALE — input + UI layer (dialog, menus, screens, battle HUD) =====

const wait = ms => new Promise(r => setTimeout(r, ms));
const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1)); // inclusive

// ---------------- Input ----------------
const Input = (() => {
  const held = {};
  const pressed = {};
  const listeners = [];

  function mapKey(key) {
    switch (key) {
      case 'ArrowUp': case 'w': case 'W': return 'up';
      case 'ArrowDown': case 's': case 'S': return 'down';
      case 'ArrowLeft': case 'a': case 'A': return 'left';
      case 'ArrowRight': case 'd': case 'D': return 'right';
      case 'z': case 'Z': case ' ': return 'a';
      case 'x': case 'X': case 'Escape': case 'Backspace': return 'b';
      case 'Enter': return 'start';
      case 'r': case 'R': return 'bike';
      case 'm': case 'M': return 'mute';
      default: return null;
    }
  }

  // Shared entry point for keyboard AND touch controls — both produce the
  // exact same press/release semantics (held state + one-shot dispatch).
  function press(name) {
    held[name] = true;
    Sfx.unlock();
    if (name === 'mute') { UI.toast(Sfx.toggle() ? '소리: 켜짐' : '소리: 꺼짐'); return; }
    // A waiting async flow consumes the press first.
    for (let i = 0; i < listeners.length; i++) {
      const li = listeners[i];
      if (!li.keys || li.keys.includes(name)) {
        listeners.splice(i, 1);
        li.resolve(name);
        return;
      }
    }
    pressed[name] = true;
  }
  function release(name) {
    held[name] = false;
  }

  window.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'TEXTAREA' && e.key !== 'Escape') return;
    const name = mapKey(e.key);
    if (!name) return;
    e.preventDefault();
    if (e.repeat) { held[name] = true; return; }
    press(name);
  });
  window.addEventListener('keyup', (e) => {
    const name = mapKey(e.key);
    if (name) release(name);
  });

  return {
    held,
    dirHeld() {
      for (const d of ['up', 'down', 'left', 'right']) if (held[d]) return d;
      return null;
    },
    consume(name) {
      if (pressed[name]) { pressed[name] = false; return true; }
      return false;
    },
    clearPressed() { for (const k of Object.keys(pressed)) pressed[k] = false; },
    waitButton(...keys) {
      return new Promise(resolve => listeners.push({ keys: keys.length ? keys : null, resolve }));
    },
    // Register a one-shot listener; returns an unsubscribe function.
    listen(keys, cb) {
      const li = { keys, resolve: cb };
      listeners.push(li);
      return () => { const i = listeners.indexOf(li); if (i >= 0) listeners.splice(i, 1); };
    },
    // Touch-control entry points (same semantics as keydown/keyup).
    press, release,
  };
})();

// ---------------- UI ----------------
const UI = (() => {
  const $ = id => document.getElementById(id);
  let dlg, dlgText, dlgArrow, menuLayer, fadeEl, hintPanel, hintGrid, hintCount, hintToggle, vsIntro;

  function init() {
    dlg = $('dialog'); dlgText = $('dialog-text'); dlgArrow = $('dialog-arrow');
    menuLayer = $('menu-layer'); fadeEl = $('fade');
    vsIntro = $('vs-intro');
    hintPanel = $('battle-hints'); hintGrid = $('hint-grid'); hintCount = $('hints-count');
    hintToggle = $('hints-toggle');
    if (hintToggle) hintToggle.addEventListener('click', () => toggleHintsSize());
    window.addEventListener('keydown', (e) => {
      if (e.repeat || (e.key !== 'g' && e.key !== 'G')) return;
      if (e.target && e.target.tagName === 'TEXTAREA') return;
      if (typeof Game !== 'undefined' && Game.mode === 'battle') {
        e.preventDefault();
        toggleHintsSize();
      }
    });
  }

  // Creature thumbnail: real front sprite if loaded, else the drawn fallback.
  function creatureThumb(species, px, shiny) {
    const img = GameAssets.frontFor(species, shiny);
    if (img) {
      const el = document.createElement('img');
      el.src = img.src;
      el.style.cssText = `width:${px}px;height:${px}px;image-rendering:pixelated;object-fit:contain`;
      return el;
    }
    const cv = document.createElement('canvas');
    cv.width = 16; cv.height = 16;
    cv.getContext('2d').drawImage(Sprites.creature(species), 0, 0);
    cv.style.cssText = `width:${px}px;height:${px}px;image-rendering:pixelated`;
    return cv;
  }

  // Starter candidates use an unrelated species silhouette as a visual decoy
  // so the real candidate cannot be identified from its body outline.
  function creatureSilhouetteThumb(species, px) {
    const decoy = mysterySilhouetteSpecies(species);
    const source = GameAssets.frontFor(decoy) || Sprites.creature(decoy);
    const cv = document.createElement('canvas');
    cv.width = source.width; cv.height = source.height;
    const x = cv.getContext('2d');
    x.drawImage(source, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = '#090b10';
    x.fillRect(0, 0, cv.width, cv.height);
    x.globalCompositeOperation = 'source-over';
    cv.style.cssText = `width:${px}px;height:${px}px;image-rendering:pixelated`;
    return cv;
  }

  // Storage icons use the supplied two-frame icon sheets when available.
  // Unidentified creatures deliberately keep the unrelated silhouette used
  // everywhere else, so opening the PC cannot reveal their real outline.
  function creatureStorageThumb(c, px) {
    if (!c.identified) return creatureSilhouetteThumb(c.species, px);
    const img = GameAssets.iconFor(c.species, c.shiny);
    if (!img) return creatureThumb(c.species, px, c.shiny);
    const cv = document.createElement('canvas');
    cv.width = 64; cv.height = 64;
    cv.getContext('2d').drawImage(img, 0, 0, img.width / 2, img.height, 0, 0, 64, 64);
    cv.style.cssText = `width:${px}px;height:${px}px;image-rendering:pixelated`;
    return cv;
  }

  // Item icon HTML (empty string when no icon is available).
  function itemIconHtml(itemId) {
    const url = GameAssets.itemIconUrl(itemId);
    if (url) return `<img src="${url}" class="item-icon" onerror="this.remove()" alt="">`;
    if (itemId === 'hint') return '<span class="item-question">?</span>';
    if (itemId === 'scanner') return '<span class="item-scanner">S</span>';
    return '';
  }

  function htmlSafe(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));
  }

  // ----- dialog / typewriter -----
  async function say(text, opts = {}) {
    dlg.classList.remove('hidden');
    dlgArrow.classList.add('hidden');
    dlgText.textContent = '';
    let i = 0, skipped = false;
    const unsub = Input.listen(['a', 'b', 'start'], () => { skipped = true; });
    while (i < text.length) {
      if (skipped) { dlgText.textContent = text; break; }
      i += 2;
      dlgText.textContent = text.slice(0, i);
      if (i % 6 === 0) Sfx.blip();
      await wait(26);
    }
    unsub();
    if (opts.noWait) { if (!opts.keep) dlg.classList.add('hidden'); return; }
    dlgArrow.classList.remove('hidden');
    await Input.waitButton('a', 'b', 'start');
    Sfx.select();
    dlgArrow.classList.add('hidden');
    if (!opts.keep) { dlg.classList.add('hidden'); dlgText.textContent = ''; }
  }

  async function sayLines(lines, opts = {}) {
    for (let i = 0; i < lines.length; i++) {
      await say(lines[i], { keep: opts.keep || i < lines.length - 1 });
    }
  }

  function setPrompt(text) {
    dlg.classList.remove('hidden');
    dlgArrow.classList.add('hidden');
    dlgText.textContent = text;
  }

  function hideDialog() {
    dlg.classList.add('hidden');
    dlgText.textContent = '';
    dlgArrow.classList.add('hidden');
  }

  // ----- generic menu -----
  // options: array of strings (or {label, dim}). opts: {style, cols, canCancel, startIdx}
  async function choose(options, opts = {}) {
    const box = document.createElement('div');
    box.className = 'menu gba-box' + (opts.cols === 2 ? ' grid-menu' : '');
    Object.assign(box.style, opts.style || { right: '14px', bottom: '126px' });
    const items = options.map(o => {
      const d = document.createElement('div');
      d.className = 'mi' + ((o && o.dim) ? ' dim' : '');
      d.textContent = typeof o === 'string' ? o : o.label;
      box.appendChild(d);
      return d;
    });
    menuLayer.appendChild(box);
    let idx = opts.startIdx || 0;
    const cols = opts.cols || 1;
    const paint = () => items.forEach((d, i) => d.classList.toggle('sel', i === idx));
    paint();
    try {
      while (true) {
        const k = await Input.waitButton('up', 'down', 'left', 'right', 'a', 'b', 'start');
        if (k === 'a' || k === 'start') { Sfx.select(); return idx; }
        if (k === 'b') {
          if (opts.canCancel === false) continue;
          Sfx.cancel(); return -1;
        }
        const n = options.length;
        let next = idx;
        if (cols === 1) {
          if (k === 'up') next = (idx - 1 + n) % n;
          if (k === 'down') next = (idx + 1) % n;
        } else {
          if (k === 'left' && idx % cols > 0) next = idx - 1;
          if (k === 'right' && idx % cols < cols - 1 && idx + 1 < n) next = idx + 1;
          if (k === 'up' && idx - cols >= 0) next = idx - cols;
          if (k === 'down' && idx + cols < n) next = idx + cols;
        }
        if (next !== idx) { idx = next; Sfx.cursor(); paint(); }
      }
    } finally {
      box.remove();
    }
  }

  async function yesNo(prompt) {
    if (prompt) await say(prompt, { noWait: true, keep: true });
    const r = await choose(['예', '아니요'], { style: { right: '14px', bottom: '126px' } });
    hideDialog();
    return r === 0;
  }

  // ----- toast -----
  let toastTimer = null;
  function toast(text) {
    let t = document.getElementById('ui-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'ui-toast';
      t.className = 'gba-box';
      Object.assign(t.style, {
        position: 'absolute', left: '12px', top: '12px', padding: '10px 14px',
        fontSize: '11px', zIndex: 95,
      });
      menuLayer.appendChild(t);
    }
    t.textContent = text;
    t.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.style.display = 'none'; }, 1200);
  }

  // ----- fades / flashes -----
  function fadeOut(ms = 300) {
    fadeEl.classList.remove('flash');
    fadeEl.style.transition = `opacity ${ms}ms linear`;
    fadeEl.classList.add('on');
    return wait(ms + 30);
  }
  function fadeIn(ms = 300) {
    fadeEl.classList.remove('flash');
    fadeEl.style.transition = `opacity ${ms}ms linear`;
    fadeEl.classList.remove('on');
    return wait(ms + 30);
  }
  async function flashScreen(times = 3) {
    fadeEl.classList.add('flash');
    for (let i = 0; i < times; i++) {
      fadeEl.classList.add('on'); await wait(70);
      fadeEl.classList.remove('on'); await wait(70);
    }
    fadeEl.classList.remove('flash');
  }

  function setVsImage(id, source) {
    const el = $(id);
    if (!el) return;
    el.classList.remove('failed');
    el.onerror = () => el.classList.add('failed');
    if (source) el.src = source;
    else el.classList.add('failed');
  }

  async function leaderVsIntro(visualKey, trainerName) {
    const visual = GameAssets.trainerVisual(visualKey);
    if (!vsIntro || !visual) {
      await flashScreen(3);
      return;
    }
    hideDialog();
    setVsImage('vs-leader-full', visual.full);
    setVsImage('vs-player-face', visual.player);
    setVsImage('vs-leader-face', visual.face);
    setVsImage('vs-mark', visual.mark);
    $('vs-leader-title').textContent = trainerName;
    $('vs-leader-name').textContent = trainerName;
    vsIntro.classList.remove('hidden', 'match', 'sucked');
    vsIntro.setAttribute('aria-hidden', 'false');
    // Force a fresh transition even when retrying the same leader after losing.
    void vsIntro.offsetWidth;
    await wait(680);
    Sfx.versus();
    vsIntro.classList.add('match');
    await wait(980);
    vsIntro.classList.add('sucked');
    await wait(520);
    vsIntro.classList.add('hidden');
    vsIntro.classList.remove('match', 'sucked');
    vsIntro.setAttribute('aria-hidden', 'true');
  }

  // ----- battle HUD -----
  function hpClass(frac) { return frac > 0.5 ? '' : frac > 0.2 ? 'mid' : 'low'; }

  function boxEls(side) {
    const root = $(side === 'player' ? 'player-box' : 'enemy-box');
    return {
      root,
      name: root.querySelector('.ib-name'),
      lv: root.querySelector('.ib-lv'),
      st: root.querySelector('.ib-status'),
      fill: root.querySelector('.hp-fill'),
      hpnum: root.querySelector('.ib-hpnum'),
      exp: root.querySelector('.exp-fill'),
    };
  }

  function setBox(side, c) {
    const e = boxEls(side);
    e.root.classList.remove('hidden');
    e.name.textContent = creatureName(c);
    e.lv.textContent = '레벨 ' + c.level;
    setStatusChip(side, c.status);
    const frac = Math.max(0, c.hp / c.maxHp);
    e.fill.style.width = (frac * 100) + '%';
    e.fill.className = 'hp-fill ' + hpClass(frac);
    if (e.hpnum) e.hpnum.textContent = `${Math.max(0, c.hp)}/ ${c.maxHp}`;
    if (e.exp && side === 'player') e.exp.style.width = (expProgress(c) * 100) + '%';
  }

  function setStatusChip(side, status) {
    const e = boxEls(side);
    e.st.className = 'ib-status' + (status ? ` on st-${status}` : '');
    e.st.textContent = status ? (STATUS_INFO[status] ? STATUS_INFO[status].name : status) : '';
  }

  // Trainer battles: show the opponent's team as ball icons, darkening each
  // one as it faints. Pass null (or a wild battle) to hide the row.
  function setEnemyBalls(party) {
    const row = document.querySelector('#enemy-box .ib-balls');
    if (!row) return;
    row.innerHTML = '';
    if (!party) return;
    const url = GameAssets.itemIconUrl('pokeball');
    for (const c of party) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      if (c.hp <= 0) img.classList.add('down');
      row.appendChild(img);
    }
  }

  function hideBoxes() {
    $('player-box').classList.add('hidden');
    $('enemy-box').classList.add('hidden');
    clearHints();
  }

  // Render all 27 slots at once so the player can see which clues remain
  // locked. The panel itself is passive; the hint item is used through Bag.
  function setHints(c, revealed) {
    if (!hintPanel || !c || !c.unknown) { clearHints(); return; }
    const open = new Set(revealed || []);
    hintPanel.classList.remove('hidden');
    hintCount.textContent = `${open.size}/${HINT_DEFINITIONS.length}`;
    hintGrid.innerHTML = '';
    for (const def of HINT_DEFINITIONS) {
      const card = document.createElement('div');
      const isOpen = open.has(def.id);
      card.className = 'hint-card' + (isOpen ? ' open' : '');
      const label = document.createElement('span');
      label.className = 'hint-key';
      label.textContent = def.label;
      const value = document.createElement('span');
      value.className = 'hint-value';
      value.textContent = isOpen ? hintValue(c, def.id) : '?';
      const light = document.createElement('span');
      light.className = 'hint-light' + (isOpen ? ' on' : '');
      light.setAttribute('aria-label', isOpen ? 'hint revealed' : 'hint locked');
      card.appendChild(label); card.appendChild(value); card.appendChild(light);
      hintGrid.appendChild(card);
    }
  }

  function clearHints() {
    if (!hintPanel) return;
    hintPanel.classList.add('hidden');
    hintPanel.classList.remove('expanded');
    if (hintToggle) hintToggle.textContent = 'G';
    if (hintGrid) hintGrid.innerHTML = '';
  }

  function toggleHintsSize() {
    if (!hintPanel || hintPanel.classList.contains('hidden')) return false;
    const expanded = hintPanel.classList.toggle('expanded');
    if (hintToggle) hintToggle.textContent = expanded ? 'G-' : 'G+';
    return expanded;
  }

  // Tween HP from -> to over ~600ms.
  function animateHp(side, from, to, max) {
    const e = boxEls(side);
    return new Promise(res => {
      const dur = Math.min(900, 250 + Math.abs(from - to) * 14);
      const t0 = performance.now();
      function step(t) {
        const k = Math.min(1, (t - t0) / dur);
        const hp = Math.round(from + (to - from) * k);
        const frac = Math.max(0, hp / max);
        e.fill.style.width = (frac * 100) + '%';
        e.fill.className = 'hp-fill ' + hpClass(frac);
        if (e.hpnum) e.hpnum.textContent = `${Math.max(0, hp)}/ ${max}`;
        if (k < 1) requestAnimationFrame(step); else res();
      }
      requestAnimationFrame(step);
    });
  }

  function animateExp(fromFrac, toFrac) {
    const e = boxEls('player');
    return new Promise(res => {
      const dur = 500;
      const t0 = performance.now();
      function step(t) {
        const k = Math.min(1, (t - t0) / dur);
        e.exp.style.width = ((fromFrac + (toFrac - fromFrac) * k) * 100) + '%';
        if (k < 1) requestAnimationFrame(step); else res();
      }
      requestAnimationFrame(step);
    });
  }

  // ----- battle move menu -----
  async function moveMenu(c) {
    const box = document.createElement('div');
    box.className = 'menu gba-box grid-menu';
    Object.assign(box.style, {
      left: '10px', bottom: '10px', width: '486px', height: '108px',
      padding: '18px 20px',
    });
    const panel = document.createElement('div');
    panel.className = 'gba-box';
    panel.id = 'move-panel';
    menuLayer.appendChild(box);
    menuLayer.appendChild(panel);
    const items = c.moves.map(m => {
      const d = document.createElement('div');
      d.className = 'mi';
      d.textContent = MOVES[m.id].name;
      box.appendChild(d);
      return d;
    });
    let idx = 0;
    const paint = () => {
      items.forEach((d, i) => d.classList.toggle('sel', i === idx));
      const m = c.moves[idx];
      panel.innerHTML = `PP&nbsp; ${m.pp}/${m.maxPp}<br>타입/${TYPES[MOVES[m.id].type].name}`;
    };
    paint();
    try {
      while (true) {
        const k = await Input.waitButton('up', 'down', 'left', 'right', 'a', 'b', 'start');
        if (k === 'a' || k === 'start') {
          if (c.moves[idx].pp <= 0) { Sfx.cancel(); setPrompt('이 기술은 PP가 모두 떨어졌다!'); await wait(900); continue; }
          Sfx.select(); return idx;
        }
        if (k === 'b') { Sfx.cancel(); return -1; }
        const n = items.length;
        let next = idx;
        if (k === 'left' && idx % 2 === 1) next = idx - 1;
        if (k === 'right' && idx % 2 === 0 && idx + 1 < n) next = idx + 1;
        if (k === 'up' && idx >= 2) next = idx - 2;
        if (k === 'down' && idx + 2 < n) next = idx + 2;
        if (next !== idx) { idx = next; Sfx.cursor(); paint(); }
      }
    } finally {
      box.remove(); panel.remove();
    }
  }

  // ----- party screen -----
  // mode: 'view' | 'switch' | 'target'  forced: can't cancel
  async function partyScreen(opts = {}) {
    const party = Game.player.party;
    const scr = document.createElement('div');
    scr.className = 'full-screen';
    scr.innerHTML = `<div class="fs-title">${opts.title || '동료'}</div>
      <div class="fs-foot">${opts.forced ? 'Z: 선택' : 'Z: 선택 &nbsp; X: 뒤로'}</div>`;
    const list = document.createElement('div');
    scr.appendChild(list);
    menuLayer.appendChild(scr);

    if (!party.length) {
      list.innerHTML = '<div style="font-size:12px;color:#9ab;padding:20px;line-height:1.8">동료가 없습니다.<br>메이플 박사님의 연구소에서 첫 파트너를 만나 보세요!</div>';
      await Input.waitButton('a', 'b', 'start');
      Sfx.cancel();
      scr.remove();
      return -1;
    }

    function render(sel) {
      list.innerHTML = '';
      party.forEach((c, i) => {
        const slot = document.createElement('div');
        slot.className = 'party-slot' + (i === sel ? ' sel' : '') + (c.hp <= 0 ? ' fainted' : '');
        // Mystery creatures use unrelated silhouettes until a Scanner
        // identifies them. This applies to party management, healing-center
        // flows, item targets, and battle switching alike.
        const revealed = c.identified === true;
        const cv = revealed ? creatureThumb(c.species, 48, c.shiny) : creatureSilhouetteThumb(c.species, 48);
        const frac = Math.max(0, c.hp / c.maxHp);
        const cls = frac > 0.5 ? '' : frac > 0.2 ? 'mid' : 'low';
        const stTag = c.hp <= 0 ? 'FNT' : c.status;
        const stText = c.hp <= 0 ? '기절' : (STATUS_INFO[c.status] ? STATUS_INFO[c.status].name : '');
        slot.appendChild(cv);
        const info = document.createElement('div');
        info.className = 'ps-info';
        info.innerHTML = `<div class="ps-name">${htmlSafe(creatureName(c))} <span style="color:#9ab">레벨 ${c.level}</span>
            ${stTag ? `<span class="ps-st st-${stTag}">${stText}</span>` : ''}</div>
          <div class="ps-hpline"><div class="ps-hptrack"><div class="ps-hpfill ${cls}" style="width:${frac * 100}%"></div></div>
          <span>${Math.max(0, c.hp)}/${c.maxHp}</span></div>`;
        slot.appendChild(info);
        const partyName = info.querySelector('.ps-name');
        if (partyName && !revealed && !String(c.nickname || '').trim()) partyName.firstChild.textContent = '??? ';
        list.appendChild(slot);
      });
    }

    let idx = 0;
    render(idx);
    try {
      while (true) {
        const k = await Input.waitButton('up', 'down', 'a', 'b', 'start');
        if (k === 'up') { idx = (idx - 1 + party.length) % party.length; Sfx.cursor(); render(idx); }
        else if (k === 'down') { idx = (idx + 1) % party.length; Sfx.cursor(); render(idx); }
        else if (k === 'b') {
          if (opts.forced) { Sfx.cancel(); continue; }
          Sfx.cancel(); return -1;
        }
        else if (k === 'a' || k === 'start') { Sfx.select(); return idx; }
      }
    } finally {
      scr.remove();
    }
  }

  // ----- summary screen -----
  async function summaryScreen(c) {
    const scr = document.createElement('div');
    scr.className = 'full-screen summary-screen';
    const revealed = c.identified === true;
    const status = c.hp <= 0 ? '기절' : (c.status && STATUS_INFO[c.status] ? STATUS_INFO[c.status].name : '정상');
    const types = revealed
      ? creatureTypes(c).map(type => TYPES[type].name).join(' / ')
      : '???';
    const moveRows = c.moves.map(slot => {
      const move = MOVES[slot.id];
      return `<div class="summary-move"><span>${htmlSafe(move.name)}</span><span>${htmlSafe(TYPES[move.type].name)} &nbsp; PP ${slot.pp}/${slot.maxPp}</span></div>`;
    }).join('');
    scr.innerHTML = `
      <div class="summary-title">동료 요약</div>
      <div class="summary-identity">
        <div id="summary-sprite"></div>
        <div><div class="summary-name">${htmlSafe(creatureName(c))}</div>
        <div class="summary-scan ${revealed ? 'done' : ''}">${revealed ? '스캔 완료' : '정체 미확인'}</div>
        <div class="summary-line">레벨 ${c.level} &nbsp; 상태 ${status}</div>
        <div class="summary-line">타입 ${htmlSafe(types)}</div></div>
      </div>
      <div class="summary-body">
        <section class="summary-stats">
          <h3>능력치</h3>
          <div><span>HP</span><b>${Math.max(0, c.hp)} / ${c.maxHp}</b></div>
          <div><span>공격</span><b>${c.atk}</b></div>
          <div><span>방어</span><b>${c.def}</b></div>
          <div><span>특수공격</span><b>${c.spa}</b></div>
          <div><span>특수방어</span><b>${c.spd}</b></div>
          <div><span>스피드</span><b>${c.spe}</b></div>
          <div><span>다음 레벨</span><b>${expToNext(c)} EXP</b></div>
        </section>
        <section class="summary-moves"><h3>기술</h3>${moveRows}</section>
      </div>
      <div class="fs-foot">Z / X: 돌아가기</div>`;
    scr.querySelector('#summary-sprite').appendChild(
      revealed ? creatureThumb(c.species, 150, c.shiny) : creatureSilhouetteThumb(c.species, 150)
    );
    menuLayer.appendChild(scr);
    try {
      await Input.waitButton('a', 'b', 'start');
      Sfx.cancel();
    } finally {
      scr.remove();
    }
  }

  // ----- PC storage -----
  async function storageScreen() {
    const party = Game.player.party;
    const vault = Game.player.vault || (Game.player.vault = []);
    const scr = document.createElement('div');
    scr.className = 'full-screen storage-screen';
    scr.innerHTML = `
      <div class="storage-title">포켓몬 보관 시스템</div>
      <div class="storage-layout">
        <section class="storage-party"><h3>동료 <span id="storage-party-count"></span></h3><div id="storage-party-list"></div></section>
        <section class="storage-box"><h3>BOX 1 <span id="storage-box-count"></span></h3><div id="storage-box-list"></div></section>
      </div>
      <div class="storage-help" id="storage-help"></div>
      <div class="fs-foot">방향키: 이동 &nbsp; Z: 메뉴 &nbsp; X: 종료</div>`;
    const partyList = scr.querySelector('#storage-party-list');
    const boxList = scr.querySelector('#storage-box-list');
    const help = scr.querySelector('#storage-help');
    menuLayer.appendChild(scr);

    let area = party.length ? 'party' : 'vault';
    let index = 0;

    function activeList() { return area === 'party' ? party : vault; }
    function selected() { return activeList()[index] || null; }

    function makeCard(c, selectedCard, compact) {
      const card = document.createElement('div');
      card.className = `storage-card${selectedCard ? ' sel' : ''}${compact ? ' compact' : ''}`;
      card.appendChild(creatureStorageThumb(c, compact ? 52 : 58));
      const info = document.createElement('div');
      info.innerHTML = `<strong>${htmlSafe(creatureName(c))}</strong><span>Lv.${c.level}</span>`;
      card.appendChild(info);
      return card;
    }

    function render() {
      if (area === 'party' && !party.length) { area = 'vault'; index = 0; }
      if (area === 'vault' && !vault.length && party.length) { area = 'party'; index = Math.min(index, party.length - 1); }
      index = Math.max(0, Math.min(index, Math.max(0, activeList().length - 1)));
      scr.querySelector('#storage-party-count').textContent = `${party.length}/6`;
      scr.querySelector('#storage-box-count').textContent = `${vault.length}`;
      partyList.innerHTML = '';
      boxList.innerHTML = '';
      party.forEach((c, i) => partyList.appendChild(makeCard(c, area === 'party' && i === index, false)));
      vault.forEach((c, i) => boxList.appendChild(makeCard(c, area === 'vault' && i === index, true)));
      if (!vault.length) boxList.innerHTML = '<div class="storage-empty">보관된 동료가 없습니다.</div>';
      const c = selected();
      help.textContent = c
        ? `${creatureName(c)} · ${c.identified ? '정체 확인됨' : '정체 미확인'} · HP ${Math.max(0, c.hp)}/${c.maxHp}`
        : '동료가 없습니다.';
    }

    render();
    try {
      while (true) {
        const k = await Input.waitButton('up', 'down', 'left', 'right', 'a', 'b', 'start');
        const list = activeList();
        if (k === 'b') { Sfx.cancel(); return; }
        if (k === 'up' && list.length) {
          index = area === 'vault' ? Math.max(0, index - 4) : (index - 1 + list.length) % list.length;
          Sfx.cursor(); render(); continue;
        }
        if (k === 'down' && list.length) {
          index = area === 'vault' ? Math.min(list.length - 1, index + 4) : (index + 1) % list.length;
          Sfx.cursor(); render(); continue;
        }
        if (k === 'left') {
          if (area === 'vault' && index % 4 > 0) index--;
          else if (area === 'vault' && party.length) { area = 'party'; index = Math.min(index, party.length - 1); }
          else continue;
          Sfx.cursor(); render(); continue;
        }
        if (k === 'right') {
          if (area === 'party' && vault.length) { area = 'vault'; index = Math.min(index, vault.length - 1); }
          else if (area === 'vault' && index % 4 < 3 && index + 1 < vault.length) index++;
          else continue;
          Sfx.cursor(); render(); continue;
        }
        if (k !== 'a' && k !== 'start') continue;
        const c = selected();
        if (!c) { Sfx.cancel(); continue; }
        Sfx.select();
        const transferLabel = area === 'party' ? 'BOX에 보관' : '동료로 데려오기';
        const scannerCount = Game.player.bag.scanner || 0;
        const scanLabel = c.identified ? '스캐너 사용 (확인 완료)' : `스캐너 사용 (${scannerCount}개)`;
        const action = await choose(['요약 보기', transferLabel, scanLabel, '취소'], {
          style: { right: '18px', bottom: '40px', width: '240px', zIndex: 72 },
        });
        if (action === 0) {
          await summaryScreen(c);
        } else if (action === 1 && area === 'party') {
          if (party.length <= 1) { toast('마지막 동료는 보관할 수 없습니다!'); }
          else {
            vault.push(party.splice(index, 1)[0]);
            index = Math.min(index, party.length - 1);
            toast('BOX 1에 보관했습니다.');
          }
        } else if (action === 1) {
          if (party.length >= 6) { toast('동료가 가득 찼습니다!'); }
          else {
            party.push(vault.splice(index, 1)[0]);
            index = Math.min(index, Math.max(0, vault.length - 1));
            if (!vault.length) area = 'party';
            toast('동료로 데려왔습니다.');
          }
        } else if (action === 2) {
          if (c.identified) toast('이미 정체를 확인한 동료입니다.');
          else if (scannerCount <= 0) toast('스캐너가 없습니다.');
          else {
            Game.player.bag.scanner--;
            c.identified = true;
            Sfx.statUp();
            toast(`스캔 완료: ${speciesName(c)}`);
          }
        }
        render();
      }
    } finally {
      scr.remove();
    }
  }

  // ----- bag screen -----
  // Returns itemId or null. opts: {inBattle}
  async function bagScreen(opts = {}) {
    const bag = Game.player.bag || {};
    const entries = Object.entries(bag).filter(([id, n]) => ITEMS[id] && (n > 0 || ITEMS[id].unlimited));
    if (ITEMS.hint && !entries.some(([id]) => id === 'hint')) entries.push(['hint', 1]);
    const scr = document.createElement('div');
    scr.className = 'full-screen';
    scr.innerHTML = `<div class="fs-title">가방</div>
      <div class="fs-foot">Z: 사용 &nbsp; X: 뒤로</div>`;
    const list = document.createElement('div');
    const desc = document.createElement('div');
    desc.className = 'bag-desc';
    scr.appendChild(list); scr.appendChild(desc);
    menuLayer.appendChild(scr);

    if (!entries.length) {
      list.innerHTML = '<div style="font-size:12px;color:#9ab;padding:20px">가방이 비어 있습니다.</div>';
      await Input.waitButton('a', 'b', 'start');
      Sfx.cancel();
      scr.remove();
      return null;
    }

    let idx = 0;
    const render = () => {
      list.innerHTML = '';
      entries.forEach(([id, n], i) => {
        const row = document.createElement('div');
        row.className = 'bag-row' + (i === idx ? ' sel' : '');
        const quantity = ITEMS[id].unlimited ? '\u221E' : `x${String(n).padStart(2, ' ')}`;
        row.innerHTML = `<span>${itemIconHtml(id)}${ITEMS[id].name}</span><span>${quantity}</span>`;
        list.appendChild(row);
      });
      desc.textContent = ITEMS[entries[idx][0]].desc;
    };
    render();
    try {
      while (true) {
        const k = await Input.waitButton('up', 'down', 'a', 'b', 'start');
        if (k === 'up') { idx = (idx - 1 + entries.length) % entries.length; Sfx.cursor(); render(); }
        else if (k === 'down') { idx = (idx + 1) % entries.length; Sfx.cursor(); render(); }
        else if (k === 'b') { Sfx.cancel(); return null; }
        else if (k === 'a' || k === 'start') { Sfx.select(); return entries[idx][0]; }
      }
    } finally {
      scr.remove();
    }
  }

  // ----- shop -----
  async function shopScreen() {
    const scr = document.createElement('div');
    scr.className = 'full-screen';
    scr.innerHTML = `<div class="fs-title">포켓몬마트</div>
      <div class="money-chip gba-box">$<span id="shop-money"></span></div>
      <div class="fs-foot">Z: 구매 &nbsp; 좌/우: 수량 &nbsp; X: 나가기</div>`;
    const list = document.createElement('div');
    const desc = document.createElement('div');
    desc.className = 'bag-desc';
    scr.appendChild(list); scr.appendChild(desc);
    menuLayer.appendChild(scr);

    let idx = 0, qty = 1;
    const render = () => {
      document.getElementById('shop-money').textContent = Game.player.money;
      list.innerHTML = '';
      SHOP_STOCK.forEach((id, i) => {
        const row = document.createElement('div');
        row.className = 'bag-row' + (i === idx ? ' sel' : '');
        const q = i === idx ? ` x${qty} = $${ITEMS[id].price * qty}` : '';
        row.innerHTML = `<span>${itemIconHtml(id)}${ITEMS[id].name}</span><span>$${ITEMS[id].price}${q}</span>`;
        list.appendChild(row);
      });
      desc.textContent = ITEMS[SHOP_STOCK[idx]].desc;
    };
    render();
    try {
      while (true) {
        const k = await Input.waitButton('up', 'down', 'left', 'right', 'a', 'b', 'start');
        if (k === 'up') { idx = (idx - 1 + SHOP_STOCK.length) % SHOP_STOCK.length; qty = 1; Sfx.cursor(); render(); }
        else if (k === 'down') { idx = (idx + 1) % SHOP_STOCK.length; qty = 1; Sfx.cursor(); render(); }
        else if (k === 'left') { qty = Math.max(1, qty - 1); Sfx.cursor(); render(); }
        else if (k === 'right') { qty = Math.min(99, qty + 1); Sfx.cursor(); render(); }
        else if (k === 'b') { Sfx.cancel(); return; }
        else if (k === 'a' || k === 'start') {
          const id = SHOP_STOCK[idx];
          const cost = ITEMS[id].price * qty;
          if (Game.player.money < cost) { Sfx.cancel(); toast('돈이 부족합니다!'); continue; }
          Game.player.money -= cost;
          Game.player.bag[id] = (Game.player.bag[id] || 0) + qty;
          Sfx.buy(); toast(`${ITEMS[id].name} ${qty}개를 샀습니다!`);
          qty = 1; render();
        }
      }
    } finally {
      scr.remove();
    }
  }

  // ----- starter choice -----
  async function starterChoice(candidateId = null) {
    const allIds = ['bulbasaur', 'charmander', 'squirtle'];
    const ids = candidateId && allIds.includes(candidateId) ? [candidateId] : allIds;
    const browsing = ids.length > 1;
    const scr = document.createElement('div');
    scr.className = 'full-screen';
    scr.innerHTML = `<div class="fs-title" style="text-align:center;margin-top:20px">${browsing ? '파트너를 선택하세요!' : '이 장치의 파트너 후보'}</div>
      <div id="starter-row"></div>
      <div class="fs-foot">${browsing ? '좌/우: 살펴보기 &nbsp; ' : ''}Z: 이 후보 선택 &nbsp; X/ESC: 뒤로</div>`;
    menuLayer.appendChild(scr);
    const row = scr.querySelector('#starter-row');
    const cards = ids.map((id, candidateIndex) => {
      const sp = SPECIES[id];
      const card = document.createElement('div');
      card.className = 'starter-card';
      card.setAttribute('aria-label', `파트너 후보 ${candidateIndex + 1}`);
      card.appendChild(creatureSilhouetteThumb(id, 96));
      card.insertAdjacentHTML('beforeend',
        `<div class="sc-blurb">${sp.blurb}</div>`);
      row.appendChild(card);
      return card;
    });
    let idx = browsing ? 1 : 0;
    const paint = () => cards.forEach((c, i) => c.classList.toggle('sel', i === idx));
    paint();
    try {
      while (true) {
        const k = await Input.waitButton('left', 'right', 'a', 'b', 'start');
        if (!browsing && (k === 'left' || k === 'right')) continue;
        if (k === 'left' && browsing) { idx = (idx - 1 + ids.length) % ids.length; Sfx.cursor(); paint(); }
        else if (k === 'right' && browsing) { idx = (idx + 1) % ids.length; Sfx.cursor(); paint(); }
        else if (k === 'b') { Sfx.cancel(); return null; }
        else { Sfx.select(); return ids[idx]; }
      }
    } finally {
      scr.remove();
    }
  }

  // ----- save / import modals -----
  function saveModal(code) {
    return new Promise((resolve) => {
      const scr = document.createElement('div');
      scr.className = 'full-screen save-modal';
      scr.innerHTML = `<div class="fs-title">저장 코드</div>
        <div style="font-size:10px;line-height:1.8;color:#b8c4cc;margin-bottom:10px">
          이 코드를 안전한 곳에 복사해 두세요. 타이틀 화면의 저장 코드 불러오기로 복원할 수 있습니다.<br>
          (이 브라우저에도 저장되었습니다.)</div>
        <textarea readonly></textarea>
        <div class="modal-btns">
          <button id="sm-copy">복사</button>
          <button id="sm-close">닫기</button>
        </div>
        <div class="fs-foot">X: 닫기</div>`;
      const ta = scr.querySelector('textarea');
      ta.value = code;
      menuLayer.appendChild(scr);
      ta.focus(); ta.select();
      const unsub = Input.listen(['b'], () => done());
      function done() {
        unsub();
        Sfx.cancel();
        scr.remove();
        resolve();
      }
      scr.querySelector('#sm-copy').onclick = () => {
        ta.focus(); ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { /* fall through */ }
        if (!ok && navigator.clipboard) navigator.clipboard.writeText(code).then(() => {}, () => {});
        Sfx.select();
        toast('클립보드에 복사했습니다!');
      };
      scr.querySelector('#sm-close').onclick = done;
    });
  }

  function importModal() {
    return new Promise((resolve) => {
      const scr = document.createElement('div');
      scr.className = 'full-screen save-modal';
      scr.innerHTML = `<div class="fs-title">저장 코드 불러오기</div>
        <div style="font-size:10px;line-height:1.8;color:#b8c4cc;margin-bottom:10px">
          저장 코드를 아래에 붙여 넣고 불러오기를 누르세요.</div>
        <textarea></textarea>
        <div class="modal-btns">
          <button id="im-load">불러오기</button>
          <button id="im-cancel">취소</button>
        </div>
        <div class="fs-foot">ESC: 취소</div>`;
      const ta = scr.querySelector('textarea');
      menuLayer.appendChild(scr);
      ta.focus();
      const done = (val) => {
        unsub();
        scr.remove();
        resolve(val);
      };
      const unsub = Input.listen(['b'], () => { Sfx.cancel(); done(null); });
      scr.querySelector('#im-load').onclick = () => {
        const code = ta.value.trim();
        if (!code) { Sfx.cancel(); toast('먼저 저장 코드를 붙여 넣으세요!'); ta.focus(); return; }
        Sfx.select();
        done(code);
      };
      scr.querySelector('#im-cancel').onclick = () => { Sfx.cancel(); done(null); };
    });
  }

  function nicknameModal(c) {
    return new Promise((resolve) => {
      const old = typeof c.nickname === 'string' ? c.nickname : '';
      const scr = document.createElement('div');
      scr.className = 'full-screen save-modal nickname-modal';
      scr.innerHTML = `<div class="fs-title">이름 추측하기</div>
        <div style="font-size:10px;line-height:1.8;color:#b8c4cc;margin-bottom:10px">
          이 포켓몬의 이름을 추측해서 입력하세요.<br>
          비워 두면 다시 ???로 표시됩니다.</div>
        <input id="nm-input" type="text" maxlength="12" autocomplete="off" value="${htmlSafe(old)}">
        <div class="modal-btns">
          <button id="nm-ok">확인</button>
          <button id="nm-cancel">취소</button>
        </div>
        <div class="fs-foot">Enter: 확인 &nbsp; X/Esc: 취소</div>`;
      const input = scr.querySelector('#nm-input');
      menuLayer.appendChild(scr);
      input.focus(); input.select();
      const done = (value) => {
        unsub();
        scr.remove();
        resolve(value);
      };
      const unsub = Input.listen(['b'], () => { Sfx.cancel(); done(null); });
      scr.querySelector('#nm-ok').onclick = () => { Sfx.select(); done(input.value.trim().slice(0, 12)); };
      scr.querySelector('#nm-cancel').onclick = () => { Sfx.cancel(); done(null); };
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); Sfx.select(); done(input.value.trim().slice(0, 12)); }
        if (e.key === 'Escape') { e.preventDefault(); Sfx.cancel(); done(null); }
      });
    });
  }

  return {
    init, say, sayLines, setPrompt, hideDialog, choose, yesNo, toast,
    fadeOut, fadeIn, flashScreen, leaderVsIntro,
    setBox, setStatusChip, setEnemyBalls, hideBoxes, animateHp, animateExp,
    moveMenu, partyScreen, summaryScreen, storageScreen, bagScreen, shopScreen, starterChoice,
    setHints, clearHints, toggleHintsSize,
    saveModal, importModal, nicknameModal,
  };
})();
