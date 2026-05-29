(function () {
  let audioContext = null;
  let scheduledNodes = [];
  let playbackTimers = [];

  function ensureAudioContext() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") return audioContext.resume().then(() => audioContext);
    return Promise.resolve(audioContext);
  }

  async function playSequence(events, bpm) {
    stopPlayback();
    if (!events.length) return;
    const ctx = await ensureAudioContext();
    const beatSeconds = 60 / bpm;
    const startTime = ctx.currentTime + 0.08;
    events.forEach((event, eventIndex) => {
      const eventStart = startTime + eventIndex * beatSeconds;
      event.notes.forEach(note => {
        if (note.hz && Number.isFinite(note.hz) && note.hz > 0) {
          playTone(ctx, note.hz, eventStart, beatSeconds * 1.1, event.notes.length);
        }
      });
    });
    const totalMs = (events.length * beatSeconds + 1.0) * 1000;
    playbackTimers.push(setTimeout(stopPlayback, totalMs));
  }

  function playTone(ctx, frequency, startTime, duration, voiceCount = 1) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const peak = Math.min(0.16, 0.24 / Math.sqrt(Math.max(1, voiceCount)));
    const sustain = peak * 0.62;
    const attackEnd = startTime + 0.045;
    const decayEnd = startTime + 0.24;
    const releaseStart = startTime + Math.max(0.12, duration);
    const releaseEnd = releaseStart + 0.55;

    osc1.type = "triangle";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(frequency, startTime);
    osc2.frequency.setValueAtTime(frequency, startTime);
    osc2.detune.setValueAtTime(4, startTime);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.min(4200, Math.max(900, frequency * 6)), startTime);
    filter.Q.setValueAtTime(0.7, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peak, attackEnd);
    gain.gain.exponentialRampToValueAtTime(sustain, decayEnd);
    gain.gain.setValueAtTime(sustain, releaseStart);
    gain.gain.exponentialRampToValueAtTime(0.0001, releaseEnd);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain).connect(ctx.destination);
    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(releaseEnd + 0.04);
    osc2.stop(releaseEnd + 0.04);
    scheduledNodes.push(osc1, osc2, filter, gain);
  }

  function stopPlayback() {
    playbackTimers.forEach(timer => clearTimeout(timer));
    playbackTimers = [];
    scheduledNodes.forEach(node => {
      try {
        if (typeof node.stop === "function") node.stop(0);
        if (typeof node.disconnect === "function") node.disconnect();
      } catch (error) {}
    });
    scheduledNodes = [];
  }

  window.AudioPlayback = {
    playSequence,
    stopPlayback
  };
})();
