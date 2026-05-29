const {
  EDO,
  CENTS_PER_STEP,
  DIATONIC_INDEX,
  parseMusic,
  parseNote,
  stepsToInputAccidental,
  transposeScaleTokens
} = window.MusicTheory;
const {
  drawStaff,
  getLedgerLineDiatonics
} = window.StaffRenderer;
const {
  playSequence,
  stopPlayback
} = window.AudioPlayback;
const ACCIDENTAL_STYLE = {
  ARROWS: "arrows",
  SAGITTAL: "sagittal",
  STEIN_ZIMMERMANN: "stein-zimmermann"
};
const DEFAULT_REFERENCE_NOTE = "C4";
const DEFAULT_REFERENCE_HZ = 261.63;
const STEIN_ZIMMERMANN_DISPLAY = new Map([
  [-4, String.fromCodePoint(0xE264)],
  [-3, String.fromCodePoint(0xE281)],
  [-2, String.fromCodePoint(0xE260)],
  [-1, String.fromCodePoint(0xE280)],
  [0, String.fromCodePoint(0xE261)],
  [1, String.fromCodePoint(0xE282)],
  [2, String.fromCodePoint(0xE262)],
  [3, String.fromCodePoint(0xE283)],
  [4, String.fromCodePoint(0xE263)]
]);
const SAGITTAL_DISPLAY = new Map([
  [-4, String.fromCodePoint(0xE335)],
  [-3, String.fromCodePoint(0xE327)],
  [-2, String.fromCodePoint(0xE319)],
  [-1, String.fromCodePoint(0xE30B)],
  [0, String.fromCodePoint(0xE261)],
  [1, String.fromCodePoint(0xE30A)],
  [2, String.fromCodePoint(0xE318)],
  [3, String.fromCodePoint(0xE326)],
  [4, String.fromCodePoint(0xE334)]
]);

const BASIC_MODES_31EDO = window.BASIC_MODES_31EDO;

const els = {
  referenceNote: document.getElementById("referenceNote"),
  scaleSelect: document.getElementById("scaleSelect"),
  rootNote: document.getElementById("rootNote"),
  accidentalStyle: document.getElementById("accidentalStyle"),
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
let scaleSelectionError = "";

els.playBtn.addEventListener("click", playCurrentSequence);
els.stopBtn.addEventListener("click", stopPlayback);
els.copySwBtn.addEventListener("click", copyScaleWorkshopData);
els.copyAffectBtn.addEventListener("click", copyAffectDescription);
els.seasonOptions.addEventListener("click", event => selectExclusiveOption(event, "season"));
els.timeClock.addEventListener("click", selectClockTime);
els.affectTerms.addEventListener("click", toggleAffectTerm);
els.weatherTerms.addEventListener("click", toggleWeatherTerm);
els.scaleSelect.addEventListener("change", applySelectedScale);
if (els.rootNote) {
  els.rootNote.addEventListener("input", debounce(applySelectedScale, 120));
  els.rootNote.addEventListener("change", applySelectedScale);
}
els.refHz.addEventListener("change", normalizeReferenceHzDisplay);
els.accidentalStyle.addEventListener("change", render);
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

function normalizeReferenceHzDisplay() {
  const hz = Number(els.refHz.value);
  if (!Number.isFinite(hz) || hz <= 0) return;
  els.refHz.value = hz.toFixed(2);
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
  const sourceTokens = BASIC_MODES_31EDO[index][1].split(/\s+/).filter(Boolean);
  const rootNote = getSelectedRootNote();
  if (rootNote.error) {
    scaleSelectionError = `Root note error: ${rootNote.error}`;
    render();
    return;
  }

  const transposedScale = transposeScaleTokens(sourceTokens, rootNote);
  if (transposedScale.error) {
    scaleSelectionError = transposedScale.error;
    render();
    return;
  }

  scaleSelectionError = "";
  const notes = transposedScale.tokens.join(" ");
  els.musicInput.value = notes;
  clearCopyStatus();
  render();
}

function getSelectedRootNote() {
  const raw = els.rootNote?.value?.trim();
  return parseNote(raw || DEFAULT_REFERENCE_NOTE);
}

function accidentalDisplay(steps, hasExplicitAccidental = true) {
  if (!hasExplicitAccidental && steps === 0) return "";
  if (getAccidentalStyle() === ACCIDENTAL_STYLE.STEIN_ZIMMERMANN) {
    return steinZimmermannDisplay(steps);
  }
  if (getAccidentalStyle() === ACCIDENTAL_STYLE.SAGITTAL) {
    return sagittalDisplay(steps, hasExplicitAccidental);
  }
  return arrowAccidentalDisplay(steps);
}

function arrowAccidentalDisplay(steps) {
  if (steps === 0) return "";

  const direction = steps > 0 ? 1 : -1;
  const repeatedSymbol = direction > 0 ? "𝄪" : "𝄫";
  const remainderDisplay = new Map(direction > 0
    ? [[0, ""], [1, "↑"], [2, "♯"], [3, "↑♯"]]
    : [[0, ""], [1, "↓"], [2, "♭"], [3, "↓♭"]]);

  let remaining = Math.abs(steps);
  let repeatedCount = 0;
  while (remaining >= 4) {
    repeatedCount += 1;
    remaining -= 4;
  }

  const base = remainderDisplay.get(remaining) || "";
  return `${base}${repeatedSymbol.repeat(repeatedCount)}`;
}

function steinZimmermannDisplay(steps) {
  if (STEIN_ZIMMERMANN_DISPLAY.has(steps)) return STEIN_ZIMMERMANN_DISPLAY.get(steps);
  if (steps === 0) return STEIN_ZIMMERMANN_DISPLAY.get(0);

  const direction = steps > 0 ? 1 : -1;
  let remaining = Math.abs(steps);
  const repeatedSymbols = [];

  while (remaining >= 4) {
    repeatedSymbols.push(STEIN_ZIMMERMANN_DISPLAY.get(direction * 4));
    remaining -= 4;
  }

  const symbols = [];
  if (remaining > 0) {
    symbols.push(STEIN_ZIMMERMANN_DISPLAY.get(direction * remaining));
  }
  symbols.push(...repeatedSymbols);

  return symbols.join("");
}

function sagittalDisplay(steps, hasExplicitAccidental = true) {
  if (steps === 0) return hasExplicitAccidental ? SAGITTAL_DISPLAY.get(0) : "";
  if (SAGITTAL_DISPLAY.has(steps)) return SAGITTAL_DISPLAY.get(steps);

  const direction = steps > 0 ? 1 : -1;
  let remaining = Math.abs(steps);
  const repeatedSymbols = [];

  while (remaining >= 4) {
    repeatedSymbols.push(SAGITTAL_DISPLAY.get(direction * 4));
    remaining -= 4;
  }

  const symbols = [];
  if (remaining > 0) {
    symbols.push(SAGITTAL_DISPLAY.get(direction * remaining));
  }
  symbols.push(...repeatedSymbols);

  return symbols.join("");
}

function getAccidentalStyle() {
  return els.accidentalStyle?.value || ACCIDENTAL_STYLE.STEIN_ZIMMERMANN;
}

function enrichEvents(events, referenceNote, refHz) {
  return events.map(event => {
    const notes = event.notes.map(note => {
      const step = note.rawStep - referenceNote.rawStep;
      const cents = step * CENTS_PER_STEP;
      const hz = Number.isFinite(refHz) && refHz > 0 ? refHz * Math.pow(2, cents / 1200) : null;
      const hasExplicitAccidental = note.accidentalText.trim().length > 0;
      const accidentalDisplayText = accidentalDisplay(note.accidentalSteps, hasExplicitAccidental);
      return { ...note, step, cents, hz, accidentalDisplay: accidentalDisplayText };
    });
    return { ...event, notes };
  });
}

function getTempoBpm() {
  const bpm = Number(els.tempoBpm.value);
  if (!Number.isFinite(bpm)) return 90;
  return Math.min(300, Math.max(20, bpm));
}

async function playCurrentSequence() {
  render();
  if (!currentEvents.length) return;
  await playSequence(currentEvents, getTempoBpm());
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
  if (scaleSelectionError) errors.push(scaleSelectionError);
  if (ref.error) errors.push(`Reference note error: ${ref.error}`);
  errors.push(...parsed.errors);

  if (errors.length) showErrors(errors);
  else hideErrors();

  const events = ref.error ? [] : enrichEvents(parsed.events, ref, refHz);
  currentEvents = errors.length ? [] : events;
  updateScaleWorkshopOutput(events, errors.length === 0 && !ref.error);
  drawStaff(els.staffSvg, events);
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
  const staff = { top: 50, lineSpacing: 12, bottomLineDiatonic: 4 * 7 + DIATONIC_INDEX.E };
  console.assert(getLedgerLineDiatonics(parseNote("D4").diatonic, staff).length === 0, "D4 should not draw a ledger line");
  console.assert(getLedgerLineDiatonics(parseNote("C4").diatonic, staff).join(",") === "28", "C4 should draw one ledger line");
  console.assert(getLedgerLineDiatonics(parseNote("G5").diatonic, staff).length === 0, "G5 should not draw a ledger line");
  console.assert(getLedgerLineDiatonics(parseNote("A5").diatonic, staff).join(",") === "40", "A5 should draw one ledger line");

  const supermajorTokens = BASIC_MODES_31EDO[7][1].split(/\s+/).filter(Boolean);
  const dSupermajor = transposeScaleTokens(supermajorTokens, parseNote("D"));
  console.assert(!dSupermajor.error, "D Supermajor should transpose without errors");
  console.assert(dSupermajor.tokens.join(" ") === "D4 E4 F^#4 G4 A4 B^4 C^#5 D5", "D Supermajor transposition failed");

  const cUpSupermajor = transposeScaleTokens(supermajorTokens, parseNote("C^"));
  console.assert(!cUpSupermajor.error, "C^ Supermajor should transpose without errors");
  console.assert(cUpSupermajor.tokens.join(" ") === "C^4 D^4 E#4 F^4 G^4 A#4 B#4 C^5", "C^ Supermajor transposition failed");

  const octaveDefaultRoot = parseNote("Eb");
  console.assert(!octaveDefaultRoot.error && octaveDefaultRoot.octave === 4, "Root parsing should default to octave 4");

  const parseableHighAccidental = `C${stepsToInputAccidental(11)}4`;
  const parsedHighAccidental = parseNote(parseableHighAccidental);
  console.assert(!parsedHighAccidental.error && parsedHighAccidental.rawStep - 4 * EDO === 11, "High accidental fallback should remain parseable");
  console.assert(arrowAccidentalDisplay(5) === "↑𝄪", "Arrow +5 should render as up-arrow then double sharp glyph");
  console.assert(arrowAccidentalDisplay(-5) === "↓𝄫", "Arrow -5 should render as down-arrow then double flat glyph");
  console.assert(accidentalDisplay(5, true) === `${STEIN_ZIMMERMANN_DISPLAY.get(1)}${STEIN_ZIMMERMANN_DISPLAY.get(4)}`, "Stein-Zimmermann +5 should stay in Stein-Zimmermann symbols");
  console.assert(accidentalDisplay(-6, true) === `${STEIN_ZIMMERMANN_DISPLAY.get(-2)}${STEIN_ZIMMERMANN_DISPLAY.get(-4)}`, "Stein-Zimmermann -6 should stay in Stein-Zimmermann symbols");
  console.assert(sagittalDisplay(1) === SAGITTAL_DISPLAY.get(1), "Sagittal +1 should use the dedicated 31-EDO diesis glyph");
  console.assert(sagittalDisplay(2) === SAGITTAL_DISPLAY.get(2), "Sagittal +2 should use the Sagittal sharp glyph");
  console.assert(sagittalDisplay(3) === SAGITTAL_DISPLAY.get(3), "Sagittal +3 should use the dedicated 31-EDO sharp-plus-diesis glyph");
  console.assert(sagittalDisplay(5) === `${SAGITTAL_DISPLAY.get(1)}${SAGITTAL_DISPLAY.get(4)}`, "Sagittal +5 should compose from +1 and +4 glyphs");
  console.assert(sagittalDisplay(-6) === `${SAGITTAL_DISPLAY.get(-2)}${SAGITTAL_DISPLAY.get(-4)}`, "Sagittal -6 should compose from -2 and -4 glyphs");

  const priorScaleSelect = els.scaleSelect.value;
  const priorRootNote = els.rootNote.value;
  const priorMusicInput = els.musicInput.value;
  const priorReferenceNote = els.referenceNote.value;
  const priorReferenceHz = els.refHz.value;
  els.referenceNote.value = "F4";
  els.refHz.value = "349.228231";
  els.scaleSelect.value = "7";
  els.rootNote.value = "D";
  applySelectedScale();
  console.assert(els.referenceNote.value === "F4", "Reference note should stay unchanged when root changes");
  console.assert(els.refHz.value === "349.228231", "Reference Hz should stay unchanged when root changes");

  const dEvents = enrichEvents(parseMusic(dSupermajor.tokens.join(" ")).events, parseNote("D4"), 293.664768);
  updateScaleWorkshopOutput(dEvents, true);
  console.assert(els.scaleWorkshopOutput.value === "5\\31\n11\\31\n13\\31\n18\\31\n24\\31\n29\\31\n31\\31", "Transposed Scale Workshop export should preserve mode steps");

  els.scaleSelect.value = priorScaleSelect;
  els.rootNote.value = priorRootNote;
  els.musicInput.value = priorMusicInput;
  els.referenceNote.value = priorReferenceNote;
  els.refHz.value = priorReferenceHz;
  els.scaleWorkshopOutput.value = prior;
  render();
}

window.addEventListener("resize", debounce(render, 120));
populateScaleSelect();
updateClockCenter();
updateAffectSummary();
normalizeReferenceHzDisplay();
els.scaleSelect.value = "0";
applySelectedScale();
runTests();
