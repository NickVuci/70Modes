(function () {
  const { DIATONIC_INDEX } = window.MusicTheory;
  const UI_FONT_FAMILY = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  const MUSIC_FONT_FAMILY = "\"Bravura\", \"Bravura Text\", serif";
  const ACCIDENTAL_FONT_SIZE = "36px";
  const ACCIDENTAL_ARROW_FONT_SIZE = "28px";
  const ACCIDENTAL_ARROW_Y_OFFSET = 8;
  const SMUFL_G_CLEF = String.fromCodePoint(0xE050);

  function drawStaff(svg, events) {
    const viewportWidth = Math.max(1000, Math.floor((svg.parentElement?.clientWidth || window.innerWidth) - 2));
    const noteStartX = 120;
    const noteSpacing = 80;
    const contentWidth = Math.max(520, 170 + events.length * 78);
    const width = contentWidth <= viewportWidth ? contentWidth : Math.max(viewportWidth, contentWidth);
    svg.style.minWidth = contentWidth <= viewportWidth ? "100%" : `${width}px`;
    svg.setAttribute("viewBox", `0 0 ${width} 300`);
    svg.innerHTML = "";

    const staff = {
      left: 18,
      right: width - 32,
      top: 50,
      lineSpacing: 12,
      bottomLineDiatonic: 4 * 7 + DIATONIC_INDEX.E
    };

    for (let i = 0; i < 5; i++) {
      const y = staff.top + i * staff.lineSpacing;
      addLine(svg, staff.left, y, staff.right, y, "#1f1a16", 1.25);
    }

    drawTrebleClef(svg, staff);

    if (!events.length) {
      addText(svg, 102, 185, "Enter note tokens to render notation.", "18px", "650", "#70675c");
      return;
    }

    events.forEach((event, eventIndex) => {
      const x = noteStartX + eventIndex * noteSpacing;
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
          if (note.accidentalDisplay) drawAccidental(svg, noteX - 27, y, note.accidentalDisplay);
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
    });
  }

  function noteY(note, staff) {
    return staff.top + 4 * staff.lineSpacing - (note.diatonic - staff.bottomLineDiatonic) * (staff.lineSpacing / 2);
  }

  function drawTrebleClef(svg, staff) {
    const gLineY = staff.top + 3 * staff.lineSpacing;
    const clef = addText(svg, 14, gLineY - 1, SMUFL_G_CLEF, "72px", "400", "#1f1a16", "start", MUSIC_FONT_FAMILY);
    clef.setAttribute("dominant-baseline", "alphabetic");
  }

  function accidentalY(display, noteYPosition) {
    return /[↑↓]/u.test(display) ? noteYPosition + ACCIDENTAL_ARROW_Y_OFFSET : noteYPosition;
  }

  function drawAccidental(svg, x, y, display) {
    const el = addText(svg, x, accidentalY(display, y), "", ACCIDENTAL_FONT_SIZE, "400", "#111", "middle", MUSIC_FONT_FAMILY);
    const hasArrow = /[↑↓]/u.test(display);
    Array.from(display).forEach(char => {
      const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      tspan.textContent = char;
      if (char === "↑" || char === "↓") tspan.setAttribute("font-size", ACCIDENTAL_ARROW_FONT_SIZE);
      else if (hasArrow) tspan.setAttribute("dy", -ACCIDENTAL_ARROW_Y_OFFSET);
      el.appendChild(tspan);
    });
    return el;
  }

  function drawLedgerLines(svg, x, diatonic, staff) {
    getLedgerLineDiatonics(diatonic, staff).forEach(ledgerDiatonic => {
      const y = noteY({ diatonic: ledgerDiatonic }, staff);
      addLine(svg, x - 16, y, x + 16, y, "#1f1a16", 1.1);
    });
  }

  function getLedgerLineDiatonics(diatonic, staff) {
    const topLine = staff.bottomLineDiatonic + 8;
    const bottomLine = staff.bottomLineDiatonic;
    const ledgerLines = [];

    for (let d = bottomLine - 2; d >= diatonic; d -= 2) {
      ledgerLines.push(d);
    }
    for (let d = topLine + 2; d <= diatonic; d += 2) {
      ledgerLines.push(d);
    }

    return ledgerLines;
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

  window.StaffRenderer = {
    drawStaff,
    getLedgerLineDiatonics
  };
})();
