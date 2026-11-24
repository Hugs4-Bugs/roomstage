// Pure layout scoring for Roomstage. No React, no network.
// Units: centimetres. Furniture x/y are piece CENTERS. Rotation in degrees.

export const WALKWAY_CM = 60; // minimum comfortable path width
const CELL = 10; // grid resolution in cm

// Accepts the shapes the API returns; tolerant of a few field-name variants.
function normalizePiece(p) {
  const w = Number(p.width_cm ?? p.width ?? p.item_width_cm ?? 0);
  const d = Number(p.depth_cm ?? p.depth ?? p.length_cm ?? p.item_depth_cm ?? 0);
  const x = Number(p.x_position ?? p.x ?? 0);
  const y = Number(p.y_position ?? p.y ?? 0);
  const rot = (((Number(p.rotation ?? 0) % 360) + 360) % 360) * (Math.PI / 180);
  const c = Math.abs(Math.cos(rot));
  const s = Math.abs(Math.sin(rot));
  const bw = w * c + d * s; // rotated bounding box
  const bh = w * s + d * c;
  return {
    id: p.id,
    name: p.name ?? p.item_name ?? 'Item',
    x0: x - bw / 2,
    x1: x + bw / 2,
    y0: y - bh / 2,
    y1: y + bh / 2,
  };
}

function overlapArea(a, b) {
  const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return ox > 0 && oy > 0 ? ox * oy : 0;
}

// Cells that can host a walkway-wide path: free cells whose surrounding
// (WALKWAY_CM/2) neighbourhood is entirely inside the room and free of furniture.
function walkableGrid(cols, rows, pieces) {
  const blocked = new Uint8Array(cols * rows);
  for (const p of pieces) {
    const c0 = Math.max(0, Math.floor(p.x0 / CELL));
    const c1 = Math.min(cols - 1, Math.ceil(p.x1 / CELL) - 1);
    const r0 = Math.max(0, Math.floor(p.y0 / CELL));
    const r1 = Math.min(rows - 1, Math.ceil(p.y1 / CELL) - 1);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) blocked[r * cols + c] = 1;
  }
  const k = Math.ceil(WALKWAY_CM / 2 / CELL); // erosion radius in cells
  const ok = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let good = r - k >= 0 && c - k >= 0 && r + k < rows && c + k < cols;
      for (let dr = -k + 1; good && dr <= k - 1 + 1; dr++) {
        for (let dc = -k + 1; dc <= k - 1 + 1; dc++) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= rows || cc >= cols || blocked[rr * cols + cc]) { good = false; break; }
        }
      }
      ok[r * cols + c] = good ? 1 : 0;
    }
  }
  return { ok, blocked };
}

function largestComponent(ok, cols, rows) {
  const seen = new Uint8Array(ok.length);
  let best = 0, total = 0;
  const stack = [];
  for (let i = 0; i < ok.length; i++) {
    if (!ok[i] || seen[i]) continue;
    let size = 0;
    stack.push(i); seen[i] = 1;
    while (stack.length) {
      const cur = stack.pop(); size++;
      const r = (cur / cols) | 0, c = cur % cols;
      const nb = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
      for (const [rr, cc] of nb) {
        if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
        const j = rr * cols + cc;
        if (ok[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
      }
    }
    total += size;
    if (size > best) best = size;
  }
  return { best, total };
}

export function scoreLayout(room, furniture) {
  const W = Number(room.width_cm ?? room.width ?? 0);
  const L = Number(room.length_cm ?? room.length ?? 0);
  const pieces = (furniture || []).map(normalizePiece);
  const issues = [];
  const flagged = new Set();
  const breakdown = { overlap: 0, bounds: 0, circulation: 0, density: 0 };

  if (!(W > 0 && L > 0)) {
    return { score: null, grade: '—', issues: [{ severity: 'info', message: 'Set the room width and length to get a score.' }], flagged: [], breakdown, metrics: {} };
  }
  if (pieces.length === 0) {
    return { score: 100, grade: 'A', issues: [{ severity: 'info', message: 'Room is empty — add furniture to score the layout.' }], flagged: [], breakdown, metrics: { fillPct: 0, walkablePct: 100 } };
  }

  // 1. Overlaps
  let overlaps = 0;
  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      if (overlapArea(pieces[i], pieces[j]) > 100) { // ignore <10x10cm slivers
        overlaps++;
        flagged.add(pieces[i].id); flagged.add(pieces[j].id);
        issues.push({ severity: 'error', message: `${pieces[i].name} overlaps ${pieces[j].name}.`, ids: [pieces[i].id, pieces[j].id] });
      }
    }
  }
  breakdown.overlap = Math.min(45, overlaps * 15);

  // 2. Out of bounds
  let oob = 0;
  for (const p of pieces) {
    if (p.x0 < -1 || p.y0 < -1 || p.x1 > W + 1 || p.y1 > L + 1) {
      oob++; flagged.add(p.id);
      issues.push({ severity: 'error', message: `${p.name} extends outside the room.`, ids: [p.id] });
    }
  }
  breakdown.bounds = Math.min(36, oob * 12);

  // 3. Circulation (walkway clearance vs. the empty room)
  const cols = Math.ceil(W / CELL), rows = Math.ceil(L / CELL);
  const base = walkableGrid(cols, rows, []);
  const baseCount = base.ok.reduce((a, b) => a + b, 0);
  const cur = walkableGrid(cols, rows, pieces);
  const { best, total } = largestComponent(cur.ok, cols, rows);
  let walkable = 100;
  if (baseCount === 0) {
    issues.push({ severity: 'warn', message: `Room is narrower than a ${WALKWAY_CM} cm walkway.` });
  } else {
    walkable = Math.round((best / baseCount) * 100);
    breakdown.circulation = Math.min(40, Math.round((1 - best / baseCount) * 45));
    if (walkable < 50) issues.push({ severity: 'warn', message: `Only ${walkable}% of the floor keeps a ${WALKWAY_CM} cm walkway — pieces are too tight.` });
    else if (walkable < 75) issues.push({ severity: 'info', message: `Walkway clearance is moderate (${walkable}%). Try spacing pieces ${WALKWAY_CM} cm apart.` });
    if (total - best > baseCount * 0.1) issues.push({ severity: 'warn', message: 'Furniture splits the room into cut-off areas — keep a clear route through.' });
  }

  // 4. Density
  const used = pieces.reduce((a, p) => a + (p.x1 - p.x0) * (p.y1 - p.y0), 0);
  const fillPct = Math.round((used / (W * L)) * 100);
  if (fillPct > 50) {
    breakdown.density = Math.min(15, Math.round((fillPct - 50) * 0.6));
    issues.push({ severity: 'info', message: `Furniture fills ${fillPct}% of the floor; 30–40% feels spacious.` });
  }

  const score = Math.max(0, Math.round(100 - breakdown.overlap - breakdown.bounds - breakdown.circulation - breakdown.density));
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';
  if (issues.length === 0) issues.push({ severity: 'ok', message: 'No problems found. Clear walkways, no overlaps.' });
  return { score, grade, issues, flagged: [...flagged], breakdown, metrics: { fillPct, walkablePct: walkable } };
}
