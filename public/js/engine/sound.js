/* Sound. Most of the game is silent on purpose; this is for the few places a sound is the joke
   (the cabin laughing at you). Everything is synthesized with Web Audio, so there are no audio
   files. Browsers only allow sound after the first tap or key press, so it wakes up then. */

const sfx = (() => {
  let ac = null, out = null, echo = null, noiseBuf = null;

  // everything goes through a loud-ish master and a compressor, so it carries without clipping
  function master(c) {
    const g = c.createGain(); g.gain.value = 5.5;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.2;
    g.connect(comp); comp.connect(c.destination);
    return g;
  }

  function wake() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return;
    try {
      ac = new AC();
      out = master(ac);
      // a little echo, for a cabin that sounds bigger on the inside
      echo = ac.createDelay(1); echo.delayTime.value = 0.19;
      const fb = ac.createGain(); fb.gain.value = 0.32;
      echo.connect(fb); fb.connect(echo); echo.connect(out);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ac = null; }
  }
  if (typeof addEventListener === 'function') for (const t of ['pointerdown', 'keydown', 'touchstart']) addEventListener(t, wake, {passive: true});

  const ready = () => ac && (ac.state === 'running' || typeof ac.startRendering === 'function');
  const noise = (t, dur, type, freq, vol, dest = out) => {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  };

  // one cackling voice: a run of "ha"s, each a breathy h and a buzzy vowel through "ah" formants,
  // the pitch sliding down as the laugh runs out of breath
  function cackle(t0, {pitch = 300, n = 8, gap = 0.16, syl = 0.11, vol = 0.22, drop = 0.35, wave = 'sawtooth', wet = 0.6} = {}) {
    const voice = ac.createGain(); voice.gain.value = vol;
    voice.connect(out);
    const send = ac.createGain(); send.gain.value = wet; voice.connect(send); send.connect(echo);
    const f1 = ac.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 780; f1.Q.value = 5;
    const f2 = ac.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1180; f2.Q.value = 7;
    const f3 = ac.createBiquadFilter(); f3.type = 'bandpass'; f3.frequency.value = 2500; f3.Q.value = 9;
    for (const f of [f1, f2, f3]) f.connect(voice);
    for (let i = 0; i < n; i++) {
      const t = t0 + i * gap * (0.9 + Math.random() * 0.2);
      const p = pitch * (1 - drop * i / n) * (0.97 + Math.random() * 0.06);
      noise(t, 0.05, 'highpass', 1800, 0.25, voice);              // the "h"
      const o = ac.createOscillator(); o.type = wave;
      o.frequency.setValueAtTime(p * 1.18, t + 0.02); o.frequency.exponentialRampToValueAtTime(p * 0.82, t + 0.02 + syl);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t + 0.02); g.gain.exponentialRampToValueAtTime(1, t + 0.035); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.02 + syl);
      o.connect(g); g.connect(f1); g.connect(f2); g.connect(f3);
      o.start(t + 0.02); o.stop(t + 0.06 + syl);
    }
  }

  // record a sound to a buffer instead of playing it (for previews and tests)
  async function record(fn, secs) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const saved = [ac, out, echo, noiseBuf];
    ac = new OAC(1, Math.round(44100 * secs), 44100);
    out = master(ac);
    echo = ac.createDelay(1); echo.delayTime.value = 0.19;
    const fb = ac.createGain(); fb.gain.value = 0.32; echo.connect(fb); fb.connect(echo); echo.connect(out);
    noiseBuf = ac.createBuffer(1, 44100, 44100); const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    try { fn(); return await ac.startRendering(); } finally { [ac, out, echo, noiseBuf] = saved; }
  }

  return {
    wake, record,
    get on() { return ready(); },
    // the cabin's laughing fit: the lamp, then the deer head, then everything
    laugh(who) {
      if (!ready()) return;
      const t = ac.currentTime + 0.02;
      if (who === 'lamp') cackle(t, {pitch: 520, n: 9, gap: 0.13, syl: 0.08, vol: 0.18, wave: 'square'});
      else if (who === 'deer') cackle(t, {pitch: 170, n: 7, gap: 0.2, syl: 0.14, vol: 0.28, drop: 0.25});
      else {
        cackle(t, {pitch: 300, n: 14, gap: 0.14, vol: 0.2});
        cackle(t + 0.07, {pitch: 460, n: 13, gap: 0.12, syl: 0.08, vol: 0.14, wave: 'square'});
        cackle(t + 0.12, {pitch: 150, n: 10, gap: 0.19, syl: 0.14, vol: 0.24, drop: 0.2});
      }
    },
    thunder() {
      if (!ready()) return;
      const t = ac.currentTime + 0.05;
      noise(t, 2.6, 'lowpass', 180, 0.7);
      noise(t + 0.15, 1.6, 'lowpass', 420, 0.25);
    },
    shotgun() {
      if (!ready()) return;
      const t = ac.currentTime;
      noise(t, 0.35, 'lowpass', 1400, 0.6);
      const o = ac.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
      const g = ac.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.3);
      // chk-chk
      noise(t + 0.3, 0.04, 'bandpass', 2600, 0.22); noise(t + 0.42, 0.05, 'bandpass', 2100, 0.22);
    },
  };
})();
