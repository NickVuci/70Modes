const {
  EDO,
  CENTS_PER_STEP,
  parseMusic,
  parseNote,
  transposeScaleTokens
} = window.MusicTheory;
const {
  drawStaff
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

window.addEventListener("resize", debounce(render, 120));
populateScaleSelect();
updateClockCenter();
updateAffectSummary();
normalizeReferenceHzDisplay();
els.scaleSelect.value = "0";
applySelectedScale();
