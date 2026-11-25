// Sizzle & Serve: all sound is synthesized with WebAudio — no audio files.
// A short blip for adding, a two-note ding for serving, a buzz for a wrong
// move, and a soft sizzle loop while anything cooks. Nothing plays until the
// player first interacts, and M or the ♪ button mutes everything.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let sizzleGain = null;
  let sizzleSource = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      // Looping filtered noise for the grill sizzle, silent until cooking.
      const length = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      sizzleSource = ctx.createBufferSource();
      sizzleSource.buffer = buffer;
      sizzleSource.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 4200;
      filter.Q.value = 0.6;
      sizzleGain = ctx.createGain();
      sizzleGain.gain.value = 0;
      sizzleSource.connect(filter).connect(sizzleGain).connect(ctx.destination);
      sizzleSource.start();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, at, dur, type, vol) {
    if (!ctx || muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + at);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + at);
    osc.stop(ctx.currentTime + at + dur + 0.05);
  }

  function play(name) {
    if (muted) return;
    const audio = ensure();
    if (!audio) return;
    if (audio.state === 'suspended') void audio.resume();
    if (name === 'add') tone(520, 0, 0.07, 'square', 0.05);
    else if (name === 'cooked') tone(880, 0, 0.12, 'sine', 0.08);
    else if (name === 'served') {
      tone(660, 0, 0.12, 'sine', 0.1);
      tone(990, 0.09, 0.2, 'sine', 0.1);
    } else if (name === 'wrong') tone(140, 0, 0.18, 'sawtooth', 0.07);
    else if (name === 'expired') {
      tone(320, 0, 0.16, 'triangle', 0.09);
      tone(210, 0.14, 0.24, 'triangle', 0.09);
    } else if (name === 'burnt') tone(180, 0, 0.22, 'sawtooth', 0.06);
    else if (name === 'click') tone(700, 0, 0.05, 'square', 0.04);
  }

  /** Set the sizzle loop level from how many things are cooking (0 to 2). */
  function setSizzle(count) {
    if (!ctx || !sizzleGain || muted) return;
    const target = count === 0 ? 0 : 0.012 + count * 0.008;
    sizzleGain.gain.setTargetAtTime(target, ctx.currentTime, 0.2);
  }

  function setMuted(value) {
    muted = value;
    if (sizzleGain && ctx) sizzleGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
  }

  function isMuted() {
    return muted;
  }

  function unlock() {
    ensure();
  }

  return { play, setSizzle, setMuted, isMuted, unlock };
}
