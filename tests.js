(function () {
  const {
    EDO,
    DIATONIC_INDEX,
    parseMusic,
    parseNote,
    stepsToInputAccidental,
    transposeScaleTokens
  } = window.MusicTheory;
  const { getLedgerLineDiatonics } = window.StaffRenderer;
  const results = [];

  function assert(condition, message) {
    if (!condition) throw new Error(message);
    results.push(message);
  }

  function runAppTests() {
    const scaleWorkshopOutput = document.getElementById("scaleWorkshopOutput");
    const scaleSelect = document.getElementById("scaleSelect");
    const rootNote = document.getElementById("rootNote");
    const musicInput = document.getElementById("musicInput");
    const referenceNote = document.getElementById("referenceNote");
    const refHz = document.getElementById("refHz");

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
      assert(!note.error && note.rawStep - 4 * EDO === raw, `parse test passed: ${token}`);
    });

    const ref = parseNote("C4");
    const events = enrichEvents(parseMusic("C4 D4 Et4 F4 G4 At4 Bt4 C5").events, ref, 261.625565);
    const priorScaleWorkshopOutput = scaleWorkshopOutput.value;
    updateScaleWorkshopOutput(events, true);
    assert(scaleWorkshopOutput.value === "5\\31\n11\\31\n13\\31\n18\\31\n24\\31\n29\\31\n31\\31", "Scale Workshop export test passed");
    scaleWorkshopOutput.value = priorScaleWorkshopOutput;

    const staff = { top: 50, lineSpacing: 12, bottomLineDiatonic: 4 * 7 + DIATONIC_INDEX.E };
    assert(getLedgerLineDiatonics(parseNote("D4").diatonic, staff).length === 0, "D4 ledger-line test passed");
    assert(getLedgerLineDiatonics(parseNote("C4").diatonic, staff).join(",") === "28", "C4 ledger-line test passed");
    assert(getLedgerLineDiatonics(parseNote("G5").diatonic, staff).length === 0, "G5 ledger-line test passed");
    assert(getLedgerLineDiatonics(parseNote("A5").diatonic, staff).join(",") === "40", "A5 ledger-line test passed");

    const supermajorTokens = window.BASIC_MODES_31EDO[7][1].split(/\s+/).filter(Boolean);
    const dSupermajor = transposeScaleTokens(supermajorTokens, parseNote("D"));
    assert(!dSupermajor.error, "D Supermajor transposes without errors");
    assert(dSupermajor.tokens.join(" ") === "D4 E4 F^#4 G4 A4 B^4 C^#5 D5", "D Supermajor transposition test passed");

    const cUpSupermajor = transposeScaleTokens(supermajorTokens, parseNote("C^"));
    assert(!cUpSupermajor.error, "C^ Supermajor transposes without errors");
    assert(cUpSupermajor.tokens.join(" ") === "C^4 D^4 E#4 F^4 G^4 A#4 B#4 C^5", "C^ Supermajor transposition test passed");

    const octaveDefaultRoot = parseNote("Eb");
    assert(!octaveDefaultRoot.error && octaveDefaultRoot.octave === 4, "Root parsing defaults to octave 4");

    const parseableHighAccidental = `C${stepsToInputAccidental(11)}4`;
    const parsedHighAccidental = parseNote(parseableHighAccidental);
    assert(!parsedHighAccidental.error && parsedHighAccidental.rawStep - 4 * EDO === 11, "High accidental fallback stays parseable");
    assert(arrowAccidentalDisplay(5) === "↑𝄪", "Arrow +5 display test passed");
    assert(arrowAccidentalDisplay(-5) === "↓𝄫", "Arrow -5 display test passed");
    assert(accidentalDisplay(5, true) === `${STEIN_ZIMMERMANN_DISPLAY.get(1)}${STEIN_ZIMMERMANN_DISPLAY.get(4)}`, "Stein-Zimmermann +5 display test passed");
    assert(accidentalDisplay(-6, true) === `${STEIN_ZIMMERMANN_DISPLAY.get(-2)}${STEIN_ZIMMERMANN_DISPLAY.get(-4)}`, "Stein-Zimmermann -6 display test passed");
    assert(sagittalDisplay(1) === SAGITTAL_DISPLAY.get(1), "Sagittal +1 display test passed");
    assert(sagittalDisplay(2) === SAGITTAL_DISPLAY.get(2), "Sagittal +2 display test passed");
    assert(sagittalDisplay(3) === SAGITTAL_DISPLAY.get(3), "Sagittal +3 display test passed");
    assert(sagittalDisplay(5) === `${SAGITTAL_DISPLAY.get(1)}${SAGITTAL_DISPLAY.get(4)}`, "Sagittal +5 display test passed");
    assert(sagittalDisplay(-6) === `${SAGITTAL_DISPLAY.get(-2)}${SAGITTAL_DISPLAY.get(-4)}`, "Sagittal -6 display test passed");

    const priorScaleSelect = scaleSelect.value;
    const priorRootNote = rootNote.value;
    const priorMusicInput = musicInput.value;
    const priorReferenceNote = referenceNote.value;
    const priorReferenceHz = refHz.value;

    referenceNote.value = "F4";
    refHz.value = "349.228231";
    scaleSelect.value = "7";
    rootNote.value = "D";
    applySelectedScale();
    assert(referenceNote.value === "F4", "Reference note stays unchanged when root changes");
    assert(refHz.value === "349.228231", "Reference Hz stays unchanged when root changes");

    const dEvents = enrichEvents(parseMusic(dSupermajor.tokens.join(" ")).events, parseNote("D4"), 293.664768);
    updateScaleWorkshopOutput(dEvents, true);
    assert(scaleWorkshopOutput.value === "5\\31\n11\\31\n13\\31\n18\\31\n24\\31\n29\\31\n31\\31", "Transposed Scale Workshop export preserves mode steps");

    scaleSelect.value = priorScaleSelect;
    rootNote.value = priorRootNote;
    musicInput.value = priorMusicInput;
    referenceNote.value = priorReferenceNote;
    refHz.value = priorReferenceHz;
    scaleWorkshopOutput.value = priorScaleWorkshopOutput;
    render();
  }

  try {
    runAppTests();
    window.__APP_TEST_RESULTS__ = { passed: results.length, failed: 0, results };
    console.info(`All ${results.length} app tests passed.`);
  } catch (error) {
    window.__APP_TEST_RESULTS__ = { passed: results.length, failed: 1, error };
    console.error("App tests failed.", error);
    throw error;
  }
})();
