// Small SVG graphs for questions (position–time / distance–time).
// Returns an SVG string so templates stay plain data + functions.

export function graphSVG({ points, tMax, yMin = 0, yMax, tStep = 1, yStep = 2, yLabel = 'distance (m)', tLabel = 'time (s)', w = 300, h = 200, small = false, color = '#80ff20', labelEvery }) {
  const L = small ? 10 : 38, R = 10, T = 10, B = small ? 10 : 30;
  const gx = (t) => L + (t / tMax) * (w - L - R);
  const gy = (y) => h - B - ((y - yMin) / (yMax - yMin)) * (h - T - B);
  let grid = '';
  for (let t = 0; t <= tMax + 1e-9; t += tStep) grid += `<line x1="${gx(t)}" y1="${T}" x2="${gx(t)}" y2="${h - B}" class="g-grid"/>`;
  for (let y = yMin; y <= yMax + 1e-9; y += yStep) grid += `<line x1="${L}" y1="${gy(y)}" x2="${w - R}" y2="${gy(y)}" class="g-grid"/>`;
  let labels = '';
  if (!small) {
    const le = labelEvery || yStep * 2;
    for (let t = 0; t <= tMax + 1e-9; t += tStep * (tMax / tStep > 10 ? 2 : 1)) labels += `<text x="${gx(t)}" y="${h - B + 14}" text-anchor="middle">${+t.toFixed(2)}</text>`;
    for (let y = yMin; y <= yMax + 1e-9; y += le) labels += `<text x="${L - 5}" y="${gy(y) + 4}" text-anchor="end">${+y.toFixed(2)}</text>`;
    labels += `<text x="${w - R}" y="${h - 2}" text-anchor="end" class="g-axis-label">${tLabel}</text>`;
    labels += `<text x="${L + 4}" y="${T + 10}" class="g-axis-label">${yLabel}</text>`;
  }
  const path = points.map(([t, y], i) => `${i ? 'L' : 'M'}${gx(t).toFixed(1)},${gy(y).toFixed(1)}`).join(' ');
  const axes = `<line x1="${L}" y1="${T}" x2="${L}" y2="${h - B}" class="g-axis"/><line x1="${L}" y1="${gy(Math.max(yMin, 0))}" x2="${w - R}" y2="${gy(Math.max(yMin, 0))}" class="g-axis"/>`;
  return `<svg class="graph ${small ? 'small' : ''}" viewBox="0 0 ${w} ${h}" role="img"><rect x="0" y="0" width="${w}" height="${h}" class="g-bg"/>${grid}${axes}${labels}<path d="${path}" fill="none" stroke="${color}" stroke-width="${small ? 4 : 3}" stroke-linejoin="round"/></svg>`;
}

// Right-angled triangle with labelled sides (for Pythagoras).
export function triangleSVG({ a, b, c = '?', aLabel, bLabel, cLabel, w = 260, h = 170 }) {
  const scale = Math.min((w - 70) / a, (h - 50) / b);
  const x0 = 30, y0 = h - 25;
  const x1 = x0 + a * scale, y1 = y0 - b * scale;
  return `<svg class="graph" viewBox="0 0 ${w} ${h}" role="img"><rect width="${w}" height="${h}" class="g-bg"/>
    <polygon points="${x0},${y0} ${x1},${y0} ${x1},${y1}" fill="rgba(74,237,217,0.15)" stroke="#4aedd9" stroke-width="3"/>
    <rect x="${x1 - 12}" y="${y0 - 12}" width="12" height="12" fill="none" stroke="#fff" stroke-width="1.5"/>
    <text x="${(x0 + x1) / 2}" y="${y0 + 18}" text-anchor="middle">${aLabel ?? a}</text>
    <text x="${x1 + 6}" y="${(y0 + y1) / 2 + 4}">${bLabel ?? b}</text>
    <text x="${(x0 + x1) / 2 - 12}" y="${(y0 + y1) / 2 - 6}" text-anchor="end" fill="#fcee4b">${cLabel ?? c}</text>
  </svg>`;
}
