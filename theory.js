(function () {
  const EDO = 31;
  const CENTS_PER_STEP = 1200 / EDO;
  const LETTER_SEQUENCE = ["C", "D", "E", "F", "G", "A", "B"];
  const NATURAL_STEPS = { C: 0, D: 5, E: 10, F: 13, G: 18, A: 23, B: 28 };
  const DIATONIC_INDEX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

  function convertSourceTokenToUpsDowns(token) {
    const note = parseNote(token);
    if (note.error) return token;
    return formatNoteToken(note.letter, note.accidentalSteps, note.octave);
  }

  function stepsToInputAccidental(steps) {
    const inputMap = new Map([[-10, "vbbbb#"], [-9, "vbbbb"], [-8, "bbbb"], [-7, "vbbb"], [-6, "bbb"], [-5, "vbb"], [-4, "bb"], [-3, "vb"], [-2, "b"], [-1, "v"], [0, ""], [1, "^"], [2, "#"], [3, "^#"], [4, "x"], [5, "^x"], [6, "x#"], [7, "^x#"], [8, "xx"], [9, "^xx"], [10, "xx#"]]);
    if (inputMap.has(steps)) return inputMap.get(steps);
    return buildAccidentalText(steps);
  }

  function buildAccidentalText(steps) {
    if (steps === 0) return "";
    const chunks = [];
    let remaining = Math.abs(steps);
    const units = steps > 0
      ? [[4, "x"], [2, "#"], [1, "^"]]
      : [[4, "bb"], [2, "b"], [1, "v"]];

    units.forEach(([value, symbol]) => {
      while (remaining >= value) {
        chunks.push(symbol);
        remaining -= value;
      }
    });

    return chunks.join("");
  }

  function formatNoteToken(letter, accidentalSteps, octave) {
    return `${letter}${stepsToInputAccidental(accidentalSteps)}${octave}`;
  }

  function transposeScaleTokens(sourceTokens, targetRoot) {
    if (!sourceTokens.length) return { tokens: [] };

    const parsedTokens = sourceTokens.map(parseNote);
    const invalidToken = parsedTokens.find(note => note.error);
    if (invalidToken) {
      return { error: `Selected scale token could not be parsed: ${invalidToken.token}` };
    }

    const sourceRoot = parsedTokens[0];
    const tokens = parsedTokens.map(note => {
      const relativeRawStep = note.rawStep - sourceRoot.rawStep;
      const relativeDiatonic = note.diatonic - sourceRoot.diatonic;
      return buildTransposedNoteToken(targetRoot, relativeRawStep, relativeDiatonic);
    });

    return { tokens };
  }

  function buildTransposedNoteToken(rootNote, relativeRawStep, relativeDiatonic) {
    const diatonic = rootNote.diatonic + relativeDiatonic;
    const rawStep = rootNote.rawStep + relativeRawStep;
    const { letter, octave } = letterAndOctaveFromDiatonic(diatonic);
    const naturalRawStep = octave * EDO + NATURAL_STEPS[letter];
    const accidentalSteps = rawStep - naturalRawStep;
    return formatNoteToken(letter, accidentalSteps, octave);
  }

  function letterAndOctaveFromDiatonic(diatonic) {
    const letterIndex = ((diatonic % LETTER_SEQUENCE.length) + LETTER_SEQUENCE.length) % LETTER_SEQUENCE.length;
    const octave = Math.floor((diatonic - letterIndex) / LETTER_SEQUENCE.length);
    return { letter: LETTER_SEQUENCE[letterIndex], octave };
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

  window.MusicTheory = {
    EDO,
    CENTS_PER_STEP,
    DIATONIC_INDEX,
    accidentalToSteps,
    convertSourceTokenToUpsDowns,
    formatNoteToken,
    letterAndOctaveFromDiatonic,
    parseMusic,
    parseNote,
    stepsToInputAccidental,
    transposeScaleTokens
  };
})();
