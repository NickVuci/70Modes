const EDO = 31;
const CENTS_PER_STEP = 1200 / EDO;
const UI_FONT_FAMILY = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
const MUSIC_FONT_FAMILY = "\"Bravura\", \"Bravura Text\", serif";
const NATURAL_STEPS = { C: 0, D: 5, E: 10, F: 13, G: 18, A: 23, B: 28 };
const DIATONIC_INDEX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const UPDOWN_DISPLAY = new Map([
  [-10, "𝄫𝄫↓"], [-9, "↓𝄫𝄫"], [-8, "𝄫𝄫"], [-7, "↓𝄫↓"], [-6, "𝄫↓"], [-5, "↓𝄫"], [-4, "𝄫"], [-3, "↓♭"], [-2, "♭"], [-1, "↓"], [0, ""],
  [1, "↑"], [2, "♯"], [3, "↑♯"], [4, "𝄪"], [5, "↑𝄪"], [6, "𝄪↑"], [7, "↑𝄪↑"], [8, "𝄪𝄪"], [9, "↑𝄪𝄪"], [10, "𝄪𝄪↑"]
]);

const BASIC_MODES_31EDO = [["Ionian / Major","C4 D4 E4 F4 G4 A4 B4 C5"],["Dorian","C4 D4 Eb4 F4 G4 A4 Bb4 C5"],["Phrygian","C4 Db4 Eb4 F4 G4 Ab4 Bb4 C5"],["Lydian","C4 D4 E4 F#4 G4 A4 B4 C5"],["Mixolydian","C4 D4 E4 F4 G4 A4 Bb4 C5"],["Aeolian / Minor","C4 D4 Eb4 F4 G4 Ab4 Bb4 C5"],["Locrian","C4 Db4 Eb4 F4 Gb4 Ab4 Bb4 C5"],["Supermajor","C4 D4 Et4 F4 G4 At4 Bt4 C5"],["Colrian b3 b7","C4 Dt4 Eb4 F4 Gt4 At4 Bb4 C5"],["Subphrygian","C4 Ddb4 Edb4 F4 G4 Adb4 Bdb4 C5"],["Rodian #t4","C4 D4 Et4 F#t4 G4 A4 Bt4 C5"],["Gryphian b7","C4 Dt4 Et4 F4 G4 At4 Bb4 C5"],["Subminor d4","C4 D4 Edb4 Fd4 G4 Adb4 Bdb4 C5"],["Sublocrian b7","C4 Ddb4 Edb4 F4 Gdb4 Adb4 Bb4 C5"],["Subminor","C4 D4 Edb4 F4 G4 Adb4 Bdb4 C5"],["Sublocrian b3 b7","C4 Ddb4 Eb4 F4 Gdb4 Adb4 Bb4 C5"],["Gryphian","C4 Dt4 Et4 F4 G4 At4 Bt4 C5"],["Subdorian d4","C4 D4 Edb4 Fd4 G4 A4 Bdb4 C5"],["Subphrygian b7","C4 Ddb4 Edb4 F4 G4 Adb4 Bb4 C5"],["Supermajor #t4","C4 D4 Et4 F#t4 G4 At4 Bt4 C5"],["Colrian b7","C4 Dt4 Et4 F4 Gt4 At4 Bb4 C5"],["Subdorian","C4 D4 Edb4 F4 G4 A4 Bdb4 C5"],["Phrygian db2 db6","C4 Ddb4 Eb4 F4 G4 Adb4 Bb4 C5"],["Gryphian #t4","C4 Dt4 Et4 F#t4 G4 At4 Bt4 C5"],["Submixolydian d4","C4 D4 E4 Fd4 G4 A4 Bdb4 C5"],["Subminor (b7)","C4 D4 Edb4 F4 G4 Adb4 Bb4 C5"],["Locrian db2 db5","C4 Ddb4 Eb4 F4 Gdb4 Ab4 Bb4 C5"],["Colrian","C4 Dt4 Et4 F4 Gt4 At4 Bt4 C5"],["Rodian","C4 D4 Et4 F4 G4 A4 Bt4 C5"],["Dorian t2 t6","C4 Dt4 Eb4 F4 G4 At4 Bb4 C5"],["Subphrygian d4","C4 Ddb4 Edb4 Fd4 G4 Adb4 Bdb4 C5"],["Superlydian t7","C4 D4 E4 F#t4 G4 A4 Bt4 C5"],["Supermajor b7","C4 D4 Et4 F4 G4 At4 Bb4 C5"],["Minor t2 t5","C4 Dt4 Eb4 F4 Gt4 Ab4 Bb4 C5"],["Sublocrian","C4 Ddb4 Edb4 F4 Gdb4 Adb4 Bdb4 C5"],["Submixolydian","C4 D4 E4 F4 G4 A4 Bdb4 C5"],["Minor db6","C4 D4 Eb4 F4 G4 Adb4 Bb4 C5"],["Locrian db5","C4 Db4 Eb4 F4 Gdb4 Ab4 Bb4 C5"],["Dylian","C4 D4 E4 Fd4 G4 A4 B4 C5"],["Dorian db3","C4 D4 Edb4 F4 G4 A4 Bb4 C5"],["Phrygian db2","C4 Ddb4 Eb4 F4 G4 Ab4 Bb4 C5"],["Colrian #t4","C4 Dt4 Et4 F#t4 Gt4 At4 Bt4 C5"],["Superlydian","C4 D4 E4 F#t4 G4 A4 B4 C5"],["Mixolydian t3","C4 D4 Et4 F4 G4 A4 Bb4 C5"],["Minor / Aeolian t2","C4 Dt4 Eb4 F4 G4 Ab4 Bb4 C5"],["Sublocrian d4","C4 Ddb4 Edb4 Fd4 Gdb4 Adb4 Bdb4 C5"],["Moxidylian","C4 D4 E4 F4 G4 A4 Bt4 C5"],["Dorian t6","C4 D4 Eb4 F4 G4 At4 Bb4 C5"],["Phrygian t5","C4 Db4 Eb4 F4 Gt4 Ab4 Bb4 C5"],["Neutral / Mohajira / Mosh (4L3s)","C4 D4 Ed4 F4 G4 Ad4 Bd4 C5"],["Half Locrian b3 b7","C4 Dd4 Eb4 F4 Gd4 Ad4 Bb4 C5"],["Half Phrygian","C4 Dd4 Ed4 F4 G4 Ad4 Bd4 C5"],["Half Dorian t4","C4 D4 Ed4 Ft4 G4 A4 Bd4 C5"],["Half Phrygian b7","C4 Dd4 Ed4 F4 G4 Ad4 Bb4 C5"],["Neutral t4","C4 D4 Ed4 Ft4 G4 Ad4 Bd4 C5"],["Half Locrian b7","C4 Dd4 Ed4 F4 Gd4 Ad4 Bb4 C5"],["Rast / Half Dorian","C4 D4 Ed4 F4 G4 A4 Bd4 C5"],["Phrygian d2 d6","C4 Dd4 Eb4 F4 G4 Ad4 Bb4 C5"],["Half Phrygian t4","C4 Dd4 Ed4 Ft4 G4 Ad4 Bd4 C5"],["Half Lydian Dominant","C4 D4 E4 Ft4 G4 A4 Bd4 C5"],["Neutral b7","C4 D4 Ed4 F4 G4 Ad4 Bb4 C5"],["Locrian d2 d5","C4 Dd4 Eb4 F4 Gd4 Ab4 Bb4 C5"],["Half Locrian","C4 Dd4 Ed4 F4 Gd4 Ad4 Bd4 C5"],["Rosian / Half Lydian","C4 D4 E4 Ft4 G4 A4 B4 C5"],["Dorian d3","C4 D4 Ed4 F4 G4 A4 Bb4 C5"],["Phrygian d2","C4 Dd4 Eb4 F4 G4 Ab4 Bb4 C5"],["Half Locrian t4","C4 Dd4 Ed4 Ft4 Gd4 Ad4 Bd4 C5"],["Half Mixolydian","C4 D4 E4 F4 G4 A4 Bd4 C5"],["Minor / Aeolian d6","C4 D4 Eb4 F4 G4 Ad4 Bb4 C5"],["Locrian d5","C4 Db4 Eb4 F4 Gd4 Ab4 Bb4 C5"]];

const els = {
  referenceNote: document.getElementById("referenceNote"),
  scaleSelect: document.getElementById("scaleSelect"),
  refHz: document.getElementById("refHz"),
  musicInput: document.getElementById("musicInput"),
  scaleWorkshopOutput: document.getElementById("scaleWorkshopOutput"),
  copySwBtn: document.getElementById("copySwBtn"),
  copyStatus: document.getElementById("copyStatus"),
  staffSvg: document.getElementById("staffSvg"),
  errorBox: document.getElementById("errorBox"),
  tempoBpm: document.getElementById("tempoBpm"),
  playBtn: document.getElementById("playBtn"),
  stopBtn: document.getElementById("stopBtn"),
  seasonOptions: document.getElementById("seasonOptions"),
  timeClock: document.getElementById("timeClock"),
  timeClockLabel: document.getElementById("timeClockLabel"),
  affectTerms: document.getElementById("affectTerms"),
  weatherTerms: document.getElementById("weatherTerms"),
  affectSummary: document.getElementById("affectSummary"),
  copyAffectBtn: document.getElementById("copyAffectBtn"),
  affectCopyStatus: document.getElementById("affectCopyStatus")
};

let currentEvents = [];
let audioContext = null;
let scheduledNodes = [];
let playbackTimers = [];

els.playBtn.addEventListener("click", playCurrentSequence);
els.stopBtn.addEventListener("click", stopPlayback);
els.copySwBtn.addEventListener("click", copyScaleWorkshopData);
els.copyAffectBtn.addEventListener("click", copyAffectDescription);
els.seasonOptions.addEventListener("click", event => selectExclusiveOption(event, "season"));
els.timeClock.addEventListener("click", selectClockTime);
els.affectTerms.addEventListener("click", toggleAffectTerm);
els.weatherTerms.addEventListener("click", toggleWeatherTerm);
els.scaleSelect.addEventListener("change", applySelectedScale);
[els.referenceNote, els.refHz, els.musicInput, els.tempoBpm].forEach(el => {
  el.addEventListener("input", debounce(render, 120));
  el.addEventListener("change", debounce(render, 120));
});

function debounce(fn, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

function populateScaleSelect() {
  BASIC_MODES_31EDO.forEach(([name], index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${index + 1}. ${name}`;
    els.scaleSelect.appendChild(option);
  });
}

function applySelectedScale() {
  const index = Number(els.scaleSelect.value);
  if (!Number.isInteger(index) || !BASIC_MODES_31EDO[index]) return;
  const sourceNotes = BASIC_MODES_31EDO[index][1];
  const notes = sourceNotes.split(/\s+/).filter(Boolean).map(convertSourceTokenToUpsDowns).join(" ");
  els.musicInput.value = notes;
  clearCopyStatus();
  render();
}

function convertSourceTokenToUpsDowns(token) {
  const note = parseNote(token);
  if (note.error) return token;
  return `${note.letter}${stepsToInputAccidental(note.accidentalSteps)}${note.octave}`;
}

function stepsToInputAccidental(steps) {
  const inputMap = new Map([[-10, "vbbbb#"], [-9, "vbbbb"], [-8, "bbbb"], [-7, "vbbb"], [-6, "bbb"], [-5, "vbb"], [-4, "bb"], [-3, "vb"], [-2, "b"], [-1, "v"], [0, ""], [1, "^"], [2, "#"], [3, "^#"], [4, "x"], [5, "^x"], [6, "x#"], [7, "^x#"], [8, "xx"], [9, "^xx"], [10, "xx#"]]);
  return inputMap.get(steps) ?? (steps > 0 ? `+${steps}` : `${steps}`);
}

function parseMusic(text) {
  const events = [];
  const errors = [];
  const tokenPattern = /\[[^\]]*\]|\S+/g;
  const matches = text.match(tokenPattern) || [];
  matches.forEach((raw, eventIndex) => {
    if (raw.startsWith("[")) {
      if (!raw.endsWith("]")) {
        errors.push(`Chord token ${raw} is missing a closing bracket.`);
        return;
      }
      const inside = raw.slice(1, -1).trim();
      if (!inside) {
        errors.push(`Empty chord at event ${eventIndex + 1}.`);
        return;
      }
      const noteTokens = inside.split(/[,\s]+/).filter(Boolean);
      const notes = noteTokens.map(token => parseNote(token));
      notes.forEach(note => {
        if (note.error) errors.push(`In chord ${raw}: ${note.error}`);
      });
      if (notes.every(note => !note.error)) events.push({ kind: "chord", raw, notes });
    } else {
      const note = parseNote(raw);
      if (note.error) errors.push(note.error);
      else events.push({ kind: "note", raw, notes: [note] });
    }
  });
  return { events, errors };
}

function parseNote(token) {
  const cleaned = normalizeNoteText(token);
  const match = cleaned.match(/^([A-Ga-g])([^0-9-]*)(-?\d+)?$/);
  if (!match) {
    return { token, error: `Could not parse note token "${token}". Try examples like C4, C^4, C#4, C^#4, Cx4, Cb4, or Cvb4.` };
  }

  const letter = match[1].toUpperCase();
  const accidentalText = match[2] || "";
  const octave = match[3] === undefined ? 4 : Number(match[3]);
  if (!Number.isInteger(octave) || octave < -2 || octave > 10) {
    return { token, error: `Octave in "${token}" is outside the supported MVP range (-2 to 10).` };
  }

  const accidentalSteps = accidentalToSteps(accidentalText);
  if (accidentalSteps.error) {
    return { token, error: `Unsupported accidental in "${token}".` };
  }

  const rawStep = octave * EDO + NATURAL_STEPS[letter] + accidentalSteps.steps;
  const diatonic = octave * 7 + DIATONIC_INDEX[letter];

  return {
    token,
    letter,
    octave,
    accidentalText,
    accidentalSteps: accidentalSteps.steps,
    accidentalDisplay: accidentalDisplay(accidentalSteps.steps),
    rawStep,
    diatonic
  };
}

function normalizeNoteText(token) {
  return token.trim()
    .replaceAll("♯", "#")
    .replaceAll("♭", "b")
    .replaceAll("𝄪", "x")
    .replaceAll("𝄫", "bb")
    .replaceAll("↑", "^")
    .replaceAll("↓", "v")
    .replaceAll("𝄲", "^")
    .replaceAll("𝄳", "v");
}

function accidentalToSteps(text) {
  let steps = 0;
  let i = 0;
  const aliases = [
    ["upsharp", 3], ["up#", 3], ["^#", 3], ["#^", 3], ["#t", 3], ["t#", 3],
    ["downflat", -3], ["downb", -3], ["vb", -3], ["bv", -3], ["db", -3], ["bd", -3],
    ["up", 1], ["down", -1], ["dn", -1], ["bb", -4], ["x", 4], ["#", 2], ["b", -2], ["^", 1], ["v", -1], ["t", 1], ["d", -1], ["+", 1], ["-", -1], ["n", 0]
  ];

  const lower = text.toLowerCase().replaceAll(" ", "").replaceAll("-", "");
  while (i < lower.length) {
    let matched = false;
    for (const [symbol, value] of aliases) {
      if (lower.startsWith(symbol, i)) {
        steps += value;
        i += symbol.length;
        matched = true;
        break;
      }
    }
    if (!matched) return { error: true };
  }
  return { steps };
}

function accidentalDisplay(steps) {
  if (UPDOWN_DISPLAY.has(steps)) return UPDOWN_DISPLAY.get(steps);
  if (steps > 0) return `+${steps}`;
  if (steps < 0) return `${steps}`;
  return "";
}

function enrichEvents(events, referenceNote, refHz) {
  return events.map(event => {
    const notes = event.notes.map(note => {
      const step = note.rawStep - referenceNote.rawStep;
      const cents = step * CENTS_PER_STEP;
      const hz = Number.isFinite(refHz) && refHz > 0 ? refHz * Math.pow(2, cents / 1200) : null;
      return { ...note, step, cents, hz };
    });
    return { ...event, notes };
  });
}

function getTempoBpm() {
  const bpm = Number(els.tempoBpm.value);
  if (!Number.isFinite(bpm)) return 90;
  return Math.min(300, Math.max(20, bpm));
}

function ensureAudioContext() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") return audioContext.resume().then(() => audioContext);
  return Promise.resolve(audioContext);
}

async function playCurrentSequence() {
  render();
  stopPlayback();
  if (!currentEvents.length) return;
  const ctx = await ensureAudioContext();
  const bpm = getTempoBpm();
  const beatSeconds = 60 / bpm;
  const startTime = ctx.currentTime + 0.08;
  currentEvents.forEach((event, eventIndex) => {
    const eventStart = startTime + eventIndex * beatSeconds;
    event.notes.forEach(note => {
      if (note.hz && Number.isFinite(note.hz) && note.hz > 0) playTone(ctx, note.hz, eventStart, beatSeconds * 1.1, event.notes.length);
    });
  });
  const totalMs = (currentEvents.length * beatSeconds + 1.0) * 1000;
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

function selectExclusiveOption(event, key) {
  const button = event.target.closest("button[data-" + key + "]");
  if (!button) return;
  button.parentElement.querySelectorAll("button").forEach(item => item.classList.remove("active"));
  button.classList.add("active");
  updateClockCenter();
  updateAffectSummary();
}

function toggleAffectTerm(event) {
  const button = event.target.closest("button[data-term]");
  if (!button) return;
  button.classList.toggle("active");
  updateAffectSummary();
}

function getActiveButtonValue(container, attribute) {
  const button = container.querySelector("button.active");
  return button ? button.dataset[attribute] : "";
}

function selectClockTime(event) {
  const button = event.target.closest("button[data-time]");
  if (!button) return;
  els.timeClock.querySelectorAll("button[data-time]").forEach(item => item.classList.remove("active"));
  button.classList.add("active");
  updateClockCenter();
  updateAffectSummary();
}

function getSelectedSeason() {
  return getActiveButtonValue(els.seasonOptions, "season") || "Spring";
}

function getSelectedTime() {
  const activeTime = els.timeClock.querySelector("button[data-time].active");
  return activeTime ? activeTime.dataset.time : "Noon";
}

function updateClockCenter() {
  els.timeClockLabel.textContent = `${getSelectedSeason()} ${getSelectedTime()}`;
}

function getSelectedAffectTerms() {
  return Array.from(els.affectTerms.querySelectorAll("button.active")).map(button => button.dataset.term);
}

function toggleWeatherTerm(event) {
  const button = event.target.closest("button[data-weather]");
  if (!button) return;
  button.classList.toggle("active");
  updateAffectSummary();
}

function getSelectedWeatherTerms() {
  return Array.from(els.weatherTerms.querySelectorAll("button.active")).map(button => button.dataset.weather);
}

function getSelectedScaleName() {
  const index = Number(els.scaleSelect.value);
  if (Number.isInteger(index) && BASIC_MODES_31EDO[index]) return BASIC_MODES_31EDO[index][0];
  return "Custom scale";
}

function updateAffectSummary() {
  const scaleName = getSelectedScaleName();
  const season = getSelectedSeason();
  const time = getSelectedTime();
  const weather = getSelectedWeatherTerms();
  const terms = getSelectedAffectTerms();
  const weatherText = weather.length ? weather.join(", ") : "no selected weather terms yet";
  const termsText = terms.length ? terms.join(", ") : "no selected affect terms yet";
  els.affectSummary.value = `${scaleName}
Season: ${season}
Time: ${time}
Weather: ${weatherText}
Affect: ${termsText}`;
  els.affectCopyStatus.textContent = "";
  els.affectCopyStatus.className = "copy-status";
}

async function copyAffectDescription() {
  const text = els.affectSummary.value;
  if (!text.trim()) return;
  const copied = await copyTextSafely(text, els.affectSummary);
  els.affectCopyStatus.textContent = copied ? "Copied." : "Clipboard blocked. Text selected; press Ctrl+C.";
  els.affectCopyStatus.className = `copy-status ${copied ? "good" : "bad"}`;
}

async function copyScaleWorkshopData() {
  const text = els.scaleWorkshopOutput.value;
  if (!text.trim()) {
    setCopyStatus("Nothing to copy.", "bad");
    return;
  }
  const copied = await copyTextSafely(text);
  if (copied) setCopyStatus("Copied.", "good");
  else setCopyStatus("Clipboard blocked. The text is selected; press Ctrl+C.", "bad");
}

async function copyTextSafely(text, target = els.scaleWorkshopOutput) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {}
  }
  return copyTextBySelection(text, target);
}

function copyTextBySelection(text, target = els.scaleWorkshopOutput) {
  target.focus();
  target.select();
  target.setSelectionRange(0, text.length);
  try {
    return document.execCommand("copy");
  } catch (error) {
    return false;
  }
}

function setCopyStatus(message, kind) {
  els.copyStatus.textContent = message;
  els.copyStatus.className = `copy-status ${kind || ""}`;
}

function clearCopyStatus() {
  els.copyStatus.textContent = "";
  els.copyStatus.className = "copy-status";
}

function updateScaleWorkshopOutput(events, isValid) {
  if (!isValid) {
    els.scaleWorkshopOutput.value = "";
    return;
  }
  const steps = [];
  const seen = new Set();
  events.forEach(event => {
    event.notes.forEach(note => {
      const wrapped = ((note.step % EDO) + EDO) % EDO;
      const exportStep = note.step !== 0 && wrapped === 0 ? EDO : wrapped;
      if (exportStep === 0) return;
      if (!seen.has(exportStep)) {
        seen.add(exportStep);
        steps.push(exportStep);
      }
    });
  });
  steps.sort((a, b) => a - b);
  els.scaleWorkshopOutput.value = steps.map(step => `${step}\\31`).join("\n");
}

function render() {
  const ref = parseNote(els.referenceNote.value.trim() || "C4");
  const refHz = Number(els.refHz.value);
  const parsed = parseMusic(els.musicInput.value);
  const errors = [];
  if (ref.error) errors.push(`Reference note error: ${ref.error}`);
  errors.push(...parsed.errors);

  if (errors.length) showErrors(errors);
  else hideErrors();

  const events = ref.error ? [] : enrichEvents(parsed.events, ref, refHz);
  currentEvents = errors.length ? [] : events;
  updateScaleWorkshopOutput(events, errors.length === 0 && !ref.error);
  drawStaff(events, ref);
  updateAffectSummary();
}

function showErrors(errors) {
  els.errorBox.classList.add("show");
  els.errorBox.innerHTML = `<strong>Input issues:</strong><br>${errors.slice(0, 8).map(escapeHTML).join("<br>")}${errors.length > 8 ? "<br>…" : ""}`;
}

function hideErrors() {
  els.errorBox.classList.remove("show");
  els.errorBox.textContent = "";
}

function drawStaff(events, ref) {
  const svg = els.staffSvg;
  const viewportWidth = Math.max(1000, Math.floor((svg.parentElement?.clientWidth || window.innerWidth) - 2));
  const contentWidth = Math.max(520, 170 + events.length * 78);
  const width = contentWidth <= viewportWidth ? contentWidth : Math.max(viewportWidth, contentWidth);
  svg.style.minWidth = contentWidth <= viewportWidth ? "100%" : `${width}px`;
  svg.setAttribute("viewBox", `0 0 ${width} 300`);
  svg.innerHTML = "";

  const staff = {
    left: 72,
    right: width - 32,
    top: 50,
    lineSpacing: 12,
    bottomLineDiatonic: 4 * 7 + DIATONIC_INDEX.E
  };

  for (let i = 0; i < 5; i++) {
    const y = staff.top + i * staff.lineSpacing;
    addLine(svg, staff.left, y, staff.right, y, "#1f1a16", 1.25);
  }

  addText(svg, 28, 118, "𝄞", "70px", "400", "#1f1a16", "start", MUSIC_FONT_FAMILY);
  addLine(svg, staff.left, staff.top, staff.left, staff.top + 4 * staff.lineSpacing, "#1f1a16", 1.4);

  if (!events.length) {
    addText(svg, 102, 185, "Enter note tokens to render notation.", "18px", "650", "#70675c");
    return;
  }

  events.forEach((event, eventIndex) => {
    const x = 116 + eventIndex * 78;
    const avgDiatonic = event.notes.reduce((sum, n) => sum + n.diatonic, 0) / event.notes.length;
    const stemUp = avgDiatonic < staff.bottomLineDiatonic + 3;
    const ys = event.notes.map(note => noteY(note, staff));
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    if (event.kind === "chord") {
      if (stemUp) addLine(svg, x + 9, minY, x + 9, Math.min(minY - 48, 58), "#111", 1.4);
      else addLine(svg, x - 9, maxY, x - 9, Math.max(maxY + 48, 132), "#111", 1.4);
    } else {
      const y = ys[0];
      if (stemUp) addLine(svg, x + 9, y, x + 9, y - 42, "#111", 1.35);
      else addLine(svg, x - 9, y, x - 9, y + 42, "#111", 1.35);
    }

    event.notes
      .slice()
      .sort((a, b) => a.diatonic - b.diatonic || a.rawStep - b.rawStep)
      .forEach(note => {
        const y = noteY(note, staff);
        const xOffset = chordCollisionOffset(event, note);
        const noteX = x + xOffset;
        drawLedgerLines(svg, noteX, note.diatonic, staff);
        if (note.accidentalDisplay) addText(svg, noteX - 27, y, note.accidentalDisplay, "31px", "400", "#111", "middle", MUSIC_FONT_FAMILY);
        drawNoteHead(svg, noteX, y);
      });

    if (event.kind === "chord") {
      const labelHeight = 54 + Math.max(0, event.notes.length - 3) * 16;
      addRoundedRect(svg, x - 36, 154, 72, labelHeight, 9, "rgba(255,250,240,0.88)", "#e8dccb");
      addText(svg, x, 170, "chord", "11px", "800", "#70675c", "middle");
      event.notes.forEach((note, i) => {
        addText(svg, x, 187 + i * 16, `${note.step}\\31 · ${formatCents(note.cents)}`, "11px", "650", "#241f1a", "middle");
      });
    } else {
      const note = event.notes[0];
      addRoundedRect(svg, x - 36, 154, 72, 48, 9, "rgba(255,250,240,0.88)", "#e8dccb");
      addText(svg, x, 173, `${note.step}\\31`, "12px", "800", "#241f1a", "middle");
      addText(svg, x, 190, formatCents(note.cents), "11px", "650", "#70675c", "middle");
    }

    if ((eventIndex + 1) % 4 === 0) {
      const bx = x + 38;
      addLine(svg, bx, staff.top, bx, staff.top + 4 * staff.lineSpacing, "#7b6f63", 1);
    }
  });
}

function noteY(note, staff) {
  return staff.top + 4 * staff.lineSpacing - (note.diatonic - staff.bottomLineDiatonic) * (staff.lineSpacing / 2);
}

function drawLedgerLines(svg, x, diatonic, staff) {
  const topLine = staff.bottomLineDiatonic + 8;
  const bottomLine = staff.bottomLineDiatonic;
  for (let d = diatonic; d < bottomLine; d += 2) {
    const y = noteY({ diatonic: d }, staff);
    addLine(svg, x - 16, y, x + 16, y, "#1f1a16", 1.1);
  }
  for (let d = diatonic; d > topLine; d -= 2) {
    const y = noteY({ diatonic: d }, staff);
    addLine(svg, x - 16, y, x + 16, y, "#1f1a16", 1.1);
  }
}

function chordCollisionOffset(event, note) {
  if (event.kind !== "chord") return 0;
  const sorted = event.notes.slice().sort((a, b) => a.diatonic - b.diatonic || a.rawStep - b.rawStep);
  const currentIndex = sorted.findIndex(n => n === note);
  const prev = sorted[currentIndex - 1];
  if (prev && Math.abs(prev.diatonic - note.diatonic) === 1) return currentIndex % 2 === 0 ? -7 : 7;
  return 0;
}

function drawNoteHead(svg, x, y) {
  const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  ellipse.setAttribute("cx", x);
  ellipse.setAttribute("cy", y);
  ellipse.setAttribute("rx", 9.5);
  ellipse.setAttribute("ry", 6.8);
  ellipse.setAttribute("transform", `rotate(-18 ${x} ${y})`);
  ellipse.setAttribute("fill", "#111");
  svg.appendChild(ellipse);
}

function formatCents(cents) {
  const sign = cents > 0 ? "+" : "";
  return `${sign}${cents.toFixed(2)}¢`;
}

function addLine(svg, x1, y1, x2, y2, stroke, width) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", stroke);
  line.setAttribute("stroke-width", width);
  svg.appendChild(line);
  return line;
}

function addText(svg, x, y, text, size, weight, fill, anchor = "start", fontFamily = UI_FONT_FAMILY) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "text");
  el.setAttribute("x", x);
  el.setAttribute("y", y);
  el.setAttribute("font-size", size);
  el.setAttribute("font-weight", weight);
  el.setAttribute("fill", fill);
  el.setAttribute("text-anchor", anchor);
  el.setAttribute("font-family", fontFamily);
  el.textContent = text;
  svg.appendChild(el);
  return el;
}

function addRoundedRect(svg, x, y, width, height, radius, fill, stroke) {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", x);
  rect.setAttribute("y", y);
  rect.setAttribute("width", width);
  rect.setAttribute("height", height);
  rect.setAttribute("rx", radius);
  rect.setAttribute("fill", fill);
  rect.setAttribute("stroke", stroke);
  svg.appendChild(rect);
  return rect;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function runTests() {
  const tests = [
    ["C#4", 2],
    ["C^#4", 3],
    ["C#t4", 3],
    ["Ddb4", 2],
    ["Et4", 11],
    ["F#t4", 16],
    ["C4", 0],
    ["Cv4", -1],
    ["Cb4", -2],
    ["Cvb4", -3]
  ];
  tests.forEach(([token, raw]) => {
    const note = parseNote(token);
    console.assert(!note.error && note.rawStep - 4 * EDO === raw, `parse test failed: ${token}`);
  });
  const ref = parseNote("C4");
  const events = enrichEvents(parseMusic("C4 D4 Et4 F4 G4 At4 Bt4 C5").events, ref, 261.625565);
  const prior = els.scaleWorkshopOutput.value;
  updateScaleWorkshopOutput(events, true);
  console.assert(els.scaleWorkshopOutput.value === "5\\31\n11\\31\n13\\31\n18\\31\n24\\31\n29\\31\n31\\31", "Scale Workshop export test failed");
  els.scaleWorkshopOutput.value = prior;
}

window.addEventListener("resize", debounce(render, 120));
populateScaleSelect();
updateClockCenter();
updateAffectSummary();
els.scaleSelect.value = "0";
applySelectedScale();
runTests();
