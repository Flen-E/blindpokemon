// ===== WILDVALE — synthesized sound effects + local background music =====
// M toggles both SFX and BGM.
const Sfx = (() => {
  let ctx = null;
  let enabled = true;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Basic oscillator tone. slide = target frequency to glide to over dur.
  function tone(freq, dur, type = 'square', vol = 0.06, when = 0, slide = 0) {
    if (!enabled) return;
    const a = ac(); if (!a) return;
    const t = a.currentTime + when;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.linearRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + dur + 0.03);
  }

  // White-noise burst for impacts.
  function noise(dur, vol = 0.1, when = 0, lowpass = 0) {
    if (!enabled) return;
    const a = ac(); if (!a) return;
    const t = a.currentTime + when;
    const len = Math.max(1, Math.floor(a.sampleRate * dur));
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource();
    src.buffer = buf;
    const g = a.createGain();
    g.gain.setValueAtTime(vol, t);
    let node = src;
    if (lowpass) {
      const f = a.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = lowpass;
      src.connect(f); node = f;
    }
    node.connect(g); g.connect(a.destination);
    src.start(t);
  }

  function jingle(notes, step = 0.11, type = 'square', vol = 0.06) {
    notes.forEach((n, i) => tone(n, step * 0.92, type, vol, i * step));
  }

  return {
    toggle() {
      enabled = !enabled;
      if (typeof Bgm !== 'undefined') Bgm.setEnabled(enabled);
      return enabled;
    },
    isOn() { return enabled; },
    unlock() {
      ac();
      if (typeof Bgm !== 'undefined') Bgm.unlock();
    },

    blip()      { tone(900, 0.025, 'square', 0.018); },          // typewriter tick
    cursor()    { tone(540, 0.045, 'square', 0.04); },           // menu move
    select()    { tone(740, 0.07, 'square', 0.05); },            // confirm
    cancel()    { tone(360, 0.07, 'square', 0.04); },            // back
    bump()      { tone(120, 0.06, 'triangle', 0.05); },          // wall bump
    door()      { tone(300, 0.12, 'triangle', 0.06, 0, 180); },
    versus()    { jingle([196, 294, 392, 587, 784], 0.07, 'sawtooth', 0.055); },

    hit()       { noise(0.13, 0.12, 0, 1800); },
    superHit()  { noise(0.2, 0.16, 0, 1200); tone(120, 0.22, 'sawtooth', 0.08); },
    weakHit()   { noise(0.08, 0.06, 0, 2600); },
    statusFx()  { tone(330, 0.16, 'sine', 0.06, 0, 180); },
    statUp()    { jingle([392, 523, 659], 0.07, 'square', 0.05); },
    statDown()  { jingle([659, 523, 392], 0.07, 'square', 0.05); },
    faint()     { tone(420, 0.45, 'sawtooth', 0.09, 0, 55); },
    heal()      { jingle([523, 659, 784, 1047], 0.1); },
    levelUp()   { jingle([523, 659, 784, 1047, 1319], 0.09); },
    evolve()    { jingle([392, 494, 587, 784, 988, 1175], 0.12, 'triangle', 0.07); },
    expTick()   { tone(1100, 0.03, 'square', 0.02); },

    thrown()    { tone(420, 0.25, 'sine', 0.06, 0, 980); },
    shake()     { tone(620, 0.05, 'square', 0.09); tone(340, 0.1, 'square', 0.07, 0.06); },
    catchClick(){ tone(1250, 0.1, 'square', 0.07); tone(620, 0.18, 'square', 0.05, 0.08); },
    breakout()  { noise(0.16, 0.12, 0, 2000); tone(500, 0.15, 'square', 0.05, 0, 300); },
    caught()    { jingle([784, 784, 880, 1047, 1319], 0.12); },

    run()       { noise(0.22, 0.07, 0, 900); },
    encounter() { tone(220, 0.1, 'sawtooth', 0.07); tone(220, 0.1, 'sawtooth', 0.07, 0.13); },
    // Title-screen dragon roar: layered descending growls + a breathy rumble.
    roar() {
      tone(170, 0.75, 'sawtooth', 0.12, 0, 52);
      tone(96, 0.85, 'sawtooth', 0.1, 0.05, 38);
      tone(250, 0.3, 'square', 0.05, 0, 120);
      noise(0.8, 0.09, 0.05, 600);
      noise(0.35, 0.06, 0.55, 300);
    },
    badge()     { jingle([523, 659, 784, 659, 784, 1047, 1319], 0.13, 'triangle', 0.08); },
    buy()       { jingle([880, 1175], 0.08); },
  };
})();

// Browsers do not reliably decode MIDI, especially when the game is opened
// directly through file://. Runtime tracks therefore use the supplied OGG
// files exclusively. The original MIDI files remain development references,
// but can never strand the player on a silent first source.
const BGM_TRACKS = Object.freeze({
  title:         { sources: ['assets/Audio/BGM/Title.ogg'], volume: 0.3 },
  home:          { sources: ['assets/Audio/BGM/Title.ogg'], volume: 0.22 },
  town:          { sources: ['assets/Audio/BGM/Title.ogg'], volume: 0.24 },
  city:          { sources: ['assets/Audio/BGM/Title.ogg'], volume: 0.24 },
  lab:           { sources: ['assets/Audio/BGM/Title.ogg'], volume: 0.21 },
  route1:        { sources: ['assets/Audio/BGM/Title.ogg'], volume: 0.25 },
  forest:        { sources: ['assets/Audio/BGM/Title.ogg'], volume: 0.22 },
  route2:        { sources: ['assets/Audio/BGM/Title.ogg'], volume: 0.25 },
  route3:        { sources: ['assets/Audio/BGM/Title.ogg'], volume: 0.25 },
  cave:          { sources: ['assets/Audio/BGM/Surfing.ogg'], volume: 0.22 },
  lake:          { sources: ['assets/Audio/BGM/Surfing.ogg'], volume: 0.23 },
  center:        { sources: ['assets/Audio/BGM/Title.ogg'], volume: 0.2 },
  mart:          { sources: ['assets/Audio/BGM/Title.ogg'], volume: 0.21 },
  gym:           { sources: ['assets/Audio/BGM/B2W2 212 PWT Final Round!.ogg'], volume: 0.25 },
  battleWild:    { sources: ['assets/Audio/BGM/Battle wild.ogg'], volume: 0.3 },
  battleTrainer: { sources: ['assets/Audio/BGM/Battle trainer.ogg'], volume: 0.3 },
  battleLeader:  { sources: ['assets/Audio/BGM/B2W2 212 PWT Final Round!.ogg'], volume: 0.3 },
  victoryWild:   { sources: ['assets/Audio/BGM/Battle victory wild.ogg'], volume: 0.3, loop: false },
  victoryTrainer:{ sources: ['assets/Audio/BGM/Battle victory trainer.ogg'], volume: 0.3, loop: false },
  victoryLeader: { sources: ['assets/Audio/BGM/B2W2 213 Winning in the PWT!.ogg'], volume: 0.3, loop: false },
});

const Bgm = (() => {
  let audio = null;
  let currentKey = null;
  let sourceIndex = 0;
  let enabled = true;
  let unlocked = false;

  function safePlay() {
    if (!audio || !enabled || !unlocked || !currentKey) return;
    const result = audio.play();
    if (result && typeof result.catch === 'function') result.catch(() => {});
  }

  function loadCurrentSource() {
    const track = BGM_TRACKS[currentKey];
    if (!audio || !track || !track.sources[sourceIndex]) return;
    audio.pause();
    audio.loop = track.loop !== false;
    audio.volume = track.volume === undefined ? 0.25 : track.volume;
    audio.src = track.sources[sourceIndex];
    audio.load();
    safePlay();
  }

  function ensureAudio() {
    if (audio) return;
    audio = new Audio();
    audio.preload = 'auto';
    // A source may finish loading after the gesture which unlocked audio.
    // Retrying here prevents that race from leaving the current scene silent.
    audio.addEventListener('canplay', safePlay);
    audio.addEventListener('canplaythrough', safePlay);
    audio.addEventListener('loadeddata', safePlay);
    audio.addEventListener('error', () => {
      const track = BGM_TRACKS[currentKey];
      if (!track || sourceIndex + 1 >= track.sources.length) return;
      sourceIndex++;
      loadCurrentSource();
    });
  }

  function play(key) {
    const nextTrack = BGM_TRACKS[key];
    if (!nextTrack) return;
    ensureAudio();
    const currentTrack = BGM_TRACKS[currentKey];
    const currentSource = currentTrack && currentTrack.sources[sourceIndex];
    const sharedSourceIndex = currentSource ? nextTrack.sources.indexOf(currentSource) : -1;
    // Theme keys also carry per-scene volume, but several maps intentionally
    // share one audio file. Keep its playhead when only that metadata changes.
    if (audio.src && sharedSourceIndex >= 0) {
      currentKey = key;
      sourceIndex = sharedSourceIndex;
      audio.loop = nextTrack.loop !== false;
      audio.volume = nextTrack.volume === undefined ? 0.25 : nextTrack.volume;
      if (audio.ended) audio.currentTime = 0;
      safePlay();
      return;
    }
    currentKey = key;
    sourceIndex = 0;
    loadCurrentSource();
  }

  return {
    play,
    playMap(theme) { play(theme || 'route1'); },
    playBattle(isWild, isLeader) { play(isLeader ? 'battleLeader' : (isWild ? 'battleWild' : 'battleTrainer')); },
    playVictory(isWild, isLeader) { play(isLeader ? 'victoryLeader' : (isWild ? 'victoryWild' : 'victoryTrainer')); },
    unlock() { unlocked = true; safePlay(); },
    setEnabled(on) {
      enabled = !!on;
      if (!audio) return;
      if (enabled) safePlay(); else audio.pause();
    },
    stop() {
      currentKey = null;
      if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
    },
  };
})();

// Mobile browsers commonly suspend media while the tab is hidden. Continue
// the selected scene theme when the player returns without requiring another
// map transition.
if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) Bgm.unlock();
  });
}
