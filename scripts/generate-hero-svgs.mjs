/**
 * generate-hero-svgs.mjs
 *
 * Generates 25 unique abstract SVG hero illustrations for each chapter of the
 * EatoBiotics book. Each SVG uses the brand palette, organic shapes via seeded
 * PRNG, and a chapter-specific symbolic centerpiece.
 *
 * Usage: node scripts/generate-hero-svgs.mjs
 * Output: public/images/book/ch{1..25}/hero.svg
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const OUT_DIR = path.join(ROOT, "public", "images", "book")

/* ── Brand palette ────────────────────────────────────────────────────── */
const COLORS = {
  lime:   "#A8E063",
  green:  "#4CB648",
  teal:   "#2DAA6E",
  yellow: "#F5C518",
  orange: "#F5A623",
}

/* ── Seeded PRNG (Mulberry32) ─────────────────────────────────────────── */
function mulberry32(seed) {
  let s = seed | 0
  return function () {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ── Utility helpers ──────────────────────────────────────────────────── */
function lerp(a, b, t) { return a + (b - a) * t }
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}
function rgbStr(r, g, b) { return `rgb(${r},${g},${b})` }
function fadeHex(hex, opacity) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r},${g},${b},${opacity})`
}

/* ── Shape library ────────────────────────────────────────────────────── */

/** Generate a smooth organic blob path using cubic bezier curves */
function organicBlob(cx, cy, baseRadius, rng, points = 8) {
  const angleStep = (Math.PI * 2) / points
  const nodes = []
  for (let i = 0; i < points; i++) {
    const angle = angleStep * i - Math.PI / 2
    const r = baseRadius * (0.7 + rng() * 0.6)
    nodes.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    })
  }
  // Build smooth closed bezier
  let d = `M ${nodes[0].x.toFixed(1)} ${nodes[0].y.toFixed(1)}`
  for (let i = 0; i < points; i++) {
    const curr = nodes[i]
    const next = nodes[(i + 1) % points]
    const prev = nodes[(i - 1 + points) % points]
    const nextNext = nodes[(i + 2) % points]
    // Control points using Catmull-Rom → Bezier conversion
    const cp1x = curr.x + (next.x - prev.x) / 6
    const cp1y = curr.y + (next.y - prev.y) / 6
    const cp2x = next.x - (nextNext.x - curr.x) / 6
    const cp2y = next.y - (nextNext.y - curr.y) / 6
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`
  }
  d += " Z"
  return d
}

/** Scattered decorative dots */
function decorativeDots(count, xMin, yMin, xMax, yMax, minR, maxR, color, opacity, rng) {
  let svg = ""
  for (let i = 0; i < count; i++) {
    const x = lerp(xMin, xMax, rng())
    const y = lerp(yMin, yMax, rng())
    const r = lerp(minR, maxR, rng())
    svg += `  <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="${opacity.toFixed(2)}"/>\n`
  }
  return svg
}

/** Flowing accent curve */
function accentCurve(x1, y1, cx1, cy1, cx2, cy2, x2, y2, stroke, width, opacity) {
  return `  <path d="M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="${width}" opacity="${opacity}" stroke-linecap="round"/>`
}

/** Concentric rings */
function concentricRings(cx, cy, rStart, rEnd, count, color, opacity) {
  let svg = ""
  for (let i = 0; i < count; i++) {
    const r = lerp(rStart, rEnd, i / (count - 1))
    const op = opacity * (1 - i / count * 0.5)
    svg += `  <circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="${color}" stroke-width="1.5" opacity="${op.toFixed(2)}"/>\n`
  }
  return svg
}

/** Wavy horizontal line */
function wavyLine(y, amplitude, periods, stroke, width, opacity) {
  const step = 1280 / (periods * 2)
  let d = `M 0 ${y}`
  for (let i = 0; i < periods * 2; i++) {
    const x = step * (i + 1)
    const cy = y + (i % 2 === 0 ? -amplitude : amplitude)
    d += ` Q ${(step * i + step * (i + 1)) / 2} ${cy}, ${x} ${y}`
  }
  return `  <path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" opacity="${opacity}" stroke-linecap="round"/>`
}

/* ── Chapter-specific symbolic element generators ─────────────────────── */

function gutCrossSection(color, secondColor) {
  // Curved tube outline — gut silhouette
  return `
  <path d="M 540 220 C 480 220, 420 280, 420 340 C 420 400, 480 440, 540 440 C 600 440, 700 420, 740 380 C 780 340, 800 280, 760 240 C 720 200, 660 220, 640 260 C 620 300, 640 360, 680 380" fill="none" stroke="${color}" stroke-width="4" opacity="0.6" stroke-linecap="round"/>
  <path d="M 540 260 C 500 260, 460 300, 460 340 C 460 380, 500 410, 540 410 C 580 410, 660 395, 700 365" fill="none" stroke="${secondColor}" stroke-width="2.5" opacity="0.4" stroke-linecap="round"/>`
}

function bacterialColony(color, secondColor, rng) {
  let svg = ""
  const positions = [
    [600, 320], [640, 290], [580, 350], [660, 350], [620, 380],
    [550, 310], [690, 330], [610, 270], [570, 380], [650, 400],
    [530, 350], [700, 290], [640, 240], [580, 420], [710, 370],
  ]
  positions.forEach(([cx, cy], i) => {
    const r = 12 + rng() * 18
    const c = i % 3 === 0 ? secondColor : color
    const op = 0.15 + rng() * 0.25
    svg += `  <circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="${c}" opacity="${op.toFixed(2)}"/>\n`
  })
  return svg
}

function threeOverlappingCircles(colors) {
  return `
  <circle cx="580" cy="330" r="80" fill="${colors[0]}" opacity="0.15"/>
  <circle cx="660" cy="330" r="80" fill="${colors[1]}" opacity="0.15"/>
  <circle cx="620" cy="260" r="80" fill="${colors[2]}" opacity="0.15"/>
  <circle cx="580" cy="330" r="80" fill="none" stroke="${colors[0]}" stroke-width="2" opacity="0.4"/>
  <circle cx="660" cy="330" r="80" fill="none" stroke="${colors[1]}" stroke-width="2" opacity="0.4"/>
  <circle cx="620" cy="260" r="80" fill="none" stroke="${colors[2]}" stroke-width="2" opacity="0.4"/>`
}

function rootNetwork(color, secondColor, rng) {
  // Branching lines from a central trunk
  let svg = `  <line x1="640" y1="200" x2="640" y2="520" stroke="${color}" stroke-width="3" opacity="0.3"/>\n`
  const branches = [
    ["640 280", "560 240"], ["640 280", "720 250"], ["640 320", "540 310"],
    ["640 320", "740 330"], ["640 370", "560 400"], ["640 370", "730 390"],
    ["640 420", "580 460"], ["640 420", "710 450"],
  ]
  branches.forEach(([start, end]) => {
    const mid = start.split(" ").map(Number)
    const e = end.split(" ").map(Number)
    const cpx = (mid[0] + e[0]) / 2 + (rng() - 0.5) * 40
    const cpy = (mid[1] + e[1]) / 2 + (rng() - 0.5) * 20
    const op = 0.2 + rng() * 0.2
    svg += `  <path d="M ${start} Q ${cpx.toFixed(0)} ${cpy.toFixed(0)}, ${end}" fill="none" stroke="${secondColor}" stroke-width="2" opacity="${op.toFixed(2)}" stroke-linecap="round"/>\n`
  })
  // Small nodes at branch ends
  branches.forEach(([, end]) => {
    const [x, y] = end.split(" ").map(Number)
    svg += `  <circle cx="${x}" cy="${y}" r="${3 + rng() * 4}" fill="${color}" opacity="0.3"/>\n`
  })
  return svg
}

function fiberStrands(color, secondColor) {
  let svg = ""
  for (let i = 0; i < 7; i++) {
    const y = 230 + i * 40
    const amp = 15 + (i % 3) * 8
    const c = i % 2 === 0 ? color : secondColor
    const op = 0.15 + (i % 3) * 0.08
    svg += wavyLine(y, amp, 4 + (i % 2), c, 2.5, op) + "\n"
  }
  return svg
}

function threePillars(color, secondColor) {
  return `
  <rect x="530" y="280" width="40" height="180" rx="8" fill="${color}" opacity="0.2"/>
  <rect x="600" y="240" width="40" height="220" rx="8" fill="${secondColor}" opacity="0.25"/>
  <rect x="670" y="300" width="40" height="160" rx="8" fill="${color}" opacity="0.18"/>
  <rect x="530" y="280" width="40" height="180" rx="8" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.4"/>
  <rect x="600" y="240" width="40" height="220" rx="8" fill="none" stroke="${secondColor}" stroke-width="1.5" opacity="0.4"/>
  <rect x="670" y="300" width="40" height="160" rx="8" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.4"/>
  <line x1="500" y1="460" x2="740" y2="460" stroke="${secondColor}" stroke-width="2" opacity="0.3"/>`
}

function sproutingSeed(color, secondColor) {
  return `
  <ellipse cx="640" cy="420" rx="35" ry="22" fill="${color}" opacity="0.25"/>
  <ellipse cx="640" cy="420" rx="35" ry="22" fill="none" stroke="${color}" stroke-width="2" opacity="0.5"/>
  <path d="M 640 420 C 640 380, 640 340, 620 280 C 610 260, 590 250, 580 260 C 570 270, 580 290, 600 300 C 620 310, 635 310, 640 340" fill="${secondColor}" opacity="0.2" stroke="${secondColor}" stroke-width="1.5"/>
  <path d="M 640 370 C 650 340, 670 310, 690 290 C 700 280, 710 285, 705 300 C 700 315, 680 330, 660 350" fill="${color}" opacity="0.18" stroke="${color}" stroke-width="1.5"/>`
}

function fermentationBubbles(color, secondColor, rng) {
  let svg = ""
  const bubbles = [
    [600, 400, 25], [650, 370, 18], [580, 350, 14], [700, 380, 20],
    [620, 320, 12], [670, 310, 16], [550, 380, 10], [720, 340, 13],
    [640, 280, 20], [590, 290, 9], [690, 270, 15], [610, 250, 11],
    [660, 230, 17], [570, 260, 8], [720, 260, 12],
  ]
  bubbles.forEach(([cx, cy, r], i) => {
    const c = i % 3 === 0 ? secondColor : color
    const op = 0.1 + rng() * 0.2
    svg += `  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" opacity="${op.toFixed(2)}"/>\n`
    svg += `  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="1" opacity="${(op + 0.15).toFixed(2)}"/>\n`
  })
  return svg
}

function shieldMolecular(color, secondColor) {
  return `
  <path d="M 640 230 L 720 280 L 720 400 L 640 450 L 560 400 L 560 280 Z" fill="${color}" opacity="0.08" stroke="${color}" stroke-width="2" opacity="0.35"/>
  <circle cx="640" cy="310" r="6" fill="${secondColor}" opacity="0.5"/>
  <circle cx="600" cy="350" r="6" fill="${secondColor}" opacity="0.5"/>
  <circle cx="680" cy="350" r="6" fill="${secondColor}" opacity="0.5"/>
  <circle cx="640" cy="390" r="6" fill="${secondColor}" opacity="0.5"/>
  <circle cx="610" cy="300" r="4" fill="${color}" opacity="0.4"/>
  <circle cx="670" cy="300" r="4" fill="${color}" opacity="0.4"/>
  <line x1="640" y1="310" x2="600" y2="350" stroke="${secondColor}" stroke-width="1.5" opacity="0.3"/>
  <line x1="640" y1="310" x2="680" y2="350" stroke="${secondColor}" stroke-width="1.5" opacity="0.3"/>
  <line x1="600" y1="350" x2="640" y2="390" stroke="${secondColor}" stroke-width="1.5" opacity="0.3"/>
  <line x1="680" y1="350" x2="640" y2="390" stroke="${secondColor}" stroke-width="1.5" opacity="0.3"/>`
}

function dnaHelix(color, secondColor) {
  let svg = ""
  const steps = 18
  for (let i = 0; i < steps; i++) {
    const t = i / steps
    const y = 200 + t * 320
    const x1 = 640 + Math.sin(t * Math.PI * 3) * 60
    const x2 = 640 - Math.sin(t * Math.PI * 3) * 60
    if (i > 0) {
      const py = 200 + (i - 1) / steps * 320
      const px1 = 640 + Math.sin((i - 1) / steps * Math.PI * 3) * 60
      const px2 = 640 - Math.sin((i - 1) / steps * Math.PI * 3) * 60
      svg += `  <line x1="${px1.toFixed(1)}" y1="${py.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${color}" stroke-width="2.5" opacity="0.35"/>\n`
      svg += `  <line x1="${px2.toFixed(1)}" y1="${py.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${secondColor}" stroke-width="2.5" opacity="0.35"/>\n`
    }
    if (i % 3 === 0) {
      svg += `  <line x1="${x1.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${color}" stroke-width="1" opacity="0.2"/>\n`
    }
    svg += `  <circle cx="${x1.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${color}" opacity="0.4"/>\n`
    svg += `  <circle cx="${x2.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${secondColor}" opacity="0.4"/>\n`
  }
  return svg
}

function overlappingCards(color, secondColor) {
  return `
  <rect x="560" y="270" width="120" height="160" rx="12" fill="${color}" opacity="0.12" transform="rotate(-8 620 350)"/>
  <rect x="600" y="260" width="120" height="160" rx="12" fill="${secondColor}" opacity="0.15" transform="rotate(3 660 340)"/>
  <rect x="580" y="280" width="120" height="160" rx="12" fill="${color}" opacity="0.1" transform="rotate(-2 640 360)"/>
  <rect x="560" y="270" width="120" height="160" rx="12" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.3" transform="rotate(-8 620 350)"/>
  <rect x="600" y="260" width="120" height="160" rx="12" fill="none" stroke="${secondColor}" stroke-width="1.5" opacity="0.35" transform="rotate(3 660 340)"/>
  <line x1="614" y1="300" x2="704" y2="294" stroke="${secondColor}" stroke-width="1" opacity="0.2" transform="rotate(3 660 340)"/>
  <line x1="614" y1="320" x2="690" y2="314" stroke="${secondColor}" stroke-width="1" opacity="0.15" transform="rotate(3 660 340)"/>
  <line x1="614" y1="340" x2="680" y2="334" stroke="${secondColor}" stroke-width="1" opacity="0.1" transform="rotate(3 660 340)"/>`
}

function jarWithBubbles(color, secondColor, rng) {
  let svg = `
  <rect x="590" y="260" width="100" height="180" rx="16" fill="${color}" opacity="0.1"/>
  <rect x="590" y="260" width="100" height="180" rx="16" fill="none" stroke="${color}" stroke-width="2" opacity="0.35"/>
  <rect x="605" y="245" width="70" height="20" rx="4" fill="${secondColor}" opacity="0.2"/>
  <rect x="605" y="245" width="70" height="20" rx="4" fill="none" stroke="${secondColor}" stroke-width="1.5" opacity="0.3"/>`
  // Bubbles inside jar
  const jarBubbles = [
    [620, 380, 8], [660, 360, 10], [635, 340, 7], [650, 400, 6],
    [625, 310, 9], [655, 320, 5], [640, 290, 8],
  ]
  jarBubbles.forEach(([cx, cy, r]) => {
    const op = 0.12 + rng() * 0.15
    svg += `  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${secondColor}" opacity="${op.toFixed(2)}"/>\n`
  })
  return svg
}

function brainGutAxis(color, secondColor) {
  return `
  <circle cx="560" cy="280" r="50" fill="${color}" opacity="0.1"/>
  <circle cx="560" cy="280" r="50" fill="none" stroke="${color}" stroke-width="2" opacity="0.35"/>
  <circle cx="720" cy="400" r="45" fill="${secondColor}" opacity="0.1"/>
  <circle cx="720" cy="400" r="45" fill="none" stroke="${secondColor}" stroke-width="2" opacity="0.35"/>
  <path d="M 600 310 C 640 340, 660 360, 680 380" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.3" stroke-dasharray="6 4" stroke-linecap="round"/>
  <circle cx="560" cy="270" r="3" fill="${color}" opacity="0.4"/>
  <circle cx="550" cy="290" r="3" fill="${color}" opacity="0.4"/>
  <circle cx="575" cy="275" r="3" fill="${color}" opacity="0.4"/>
  <circle cx="720" cy="390" r="3" fill="${secondColor}" opacity="0.4"/>
  <circle cx="710" cy="410" r="3" fill="${secondColor}" opacity="0.4"/>
  <circle cx="730" cy="395" r="3" fill="${secondColor}" opacity="0.4"/>`
}

function leafRootGarden(color, secondColor, rng) {
  let svg = ""
  // Leaves
  const leaves = [[580, 300], [640, 270], [700, 310], [610, 350], [670, 340]]
  leaves.forEach(([cx, cy], i) => {
    const angle = -30 + rng() * 60
    const c = i % 2 === 0 ? color : secondColor
    svg += `  <ellipse cx="${cx}" cy="${cy}" rx="30" ry="14" fill="${c}" opacity="0.18" transform="rotate(${angle.toFixed(0)} ${cx} ${cy})"/>\n`
    svg += `  <line x1="${cx}" y1="${cy + 14}" x2="${cx}" y2="${cy + 50 + rng() * 30}" stroke="${c}" stroke-width="1.5" opacity="0.25"/>\n`
  })
  // Roots below
  for (let i = 0; i < 5; i++) {
    const x = 560 + i * 35
    const y1 = 400
    const y2 = 440 + rng() * 40
    const cx1 = x + (rng() - 0.5) * 30
    svg += `  <path d="M ${x} ${y1} Q ${cx1.toFixed(0)} ${(y1 + y2) / 2}, ${x + (rng() - 0.5) * 20} ${y2.toFixed(0)}" fill="none" stroke="${secondColor}" stroke-width="1.5" opacity="0.2" stroke-linecap="round"/>\n`
  }
  // Ground line
  svg += `  <line x1="520" y1="400" x2="740" y2="400" stroke="${color}" stroke-width="1" opacity="0.15"/>\n`
  return svg
}

function grainStalks(color, secondColor) {
  let svg = ""
  const stalks = [560, 590, 620, 650, 680, 710]
  stalks.forEach((x, i) => {
    const h = 140 + (i % 3) * 30
    const c = i % 2 === 0 ? color : secondColor
    svg += `  <line x1="${x}" y1="${460 - h}" x2="${x}" y2="460" stroke="${c}" stroke-width="2" opacity="0.25"/>\n`
    // Grain heads
    for (let j = 0; j < 3; j++) {
      const gy = 460 - h + j * 12
      svg += `  <ellipse cx="${x + (j % 2 === 0 ? 8 : -8)}" cy="${gy}" rx="8" ry="4" fill="${c}" opacity="0.2" transform="rotate(${j % 2 === 0 ? 30 : -30} ${x + (j % 2 === 0 ? 8 : -8)} ${gy})"/>\n`
    }
  })
  return svg
}

function plateComposition(color, secondColor) {
  return `
  <circle cx="640" cy="350" r="100" fill="${color}" opacity="0.06"/>
  <circle cx="640" cy="350" r="100" fill="none" stroke="${color}" stroke-width="2" opacity="0.3"/>
  <circle cx="640" cy="350" r="75" fill="none" stroke="${secondColor}" stroke-width="1" opacity="0.15"/>
  <line x1="640" y1="250" x2="640" y2="450" stroke="${secondColor}" stroke-width="1" opacity="0.15"/>
  <line x1="540" y1="350" x2="740" y2="350" stroke="${secondColor}" stroke-width="1" opacity="0.15"/>
  <path d="M 640 275 A 75 75 0 0 1 715 350" fill="${color}" opacity="0.1"/>
  <path d="M 640 275 A 75 75 0 0 0 565 350" fill="${secondColor}" opacity="0.08"/>
  <path d="M 565 350 A 75 75 0 0 0 640 425" fill="${color}" opacity="0.06"/>
  <path d="M 640 425 A 75 75 0 0 0 715 350" fill="${secondColor}" opacity="0.12"/>`
}

function clockArc(color, secondColor) {
  let svg = `
  <circle cx="640" cy="350" r="95" fill="none" stroke="${color}" stroke-width="2" opacity="0.25"/>
  <path d="M 640 255 A 95 95 0 1 1 545 350" fill="none" stroke="${secondColor}" stroke-width="4" opacity="0.3" stroke-linecap="round"/>`
  // Hour markers
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2
    const x1 = 640 + Math.cos(angle) * 85
    const y1 = 350 + Math.sin(angle) * 85
    const x2 = 640 + Math.cos(angle) * 95
    const y2 = 350 + Math.sin(angle) * 95
    svg += `  <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${i % 3 === 0 ? 2.5 : 1.5}" opacity="0.3"/>\n`
  }
  // Center dot
  svg += `  <circle cx="640" cy="350" r="4" fill="${color}" opacity="0.4"/>\n`
  return svg
}

function pantryShelves(color, secondColor) {
  let svg = ""
  // Shelves
  for (let i = 0; i < 3; i++) {
    const y = 260 + i * 80
    svg += `  <line x1="540" y1="${y}" x2="740" y2="${y}" stroke="${color}" stroke-width="2" opacity="0.2"/>\n`
    // Items on shelf
    const items = 3 + (i % 2)
    for (let j = 0; j < items; j++) {
      const x = 560 + j * 50
      const h = 30 + (j % 3) * 15
      const w = 25 + (j % 2) * 10
      const c = (i + j) % 2 === 0 ? color : secondColor
      svg += `  <rect x="${x}" y="${y - h}" width="${w}" height="${h}" rx="4" fill="${c}" opacity="0.12"/>\n`
      svg += `  <rect x="${x}" y="${y - h}" width="${w}" height="${h}" rx="4" fill="none" stroke="${c}" stroke-width="1" opacity="0.25"/>\n`
    }
  }
  return svg
}

function indexGrid(color, secondColor, rng) {
  let svg = ""
  const cols = 6
  const rows = 5
  const startX = 540
  const startY = 250
  const gapX = 36
  const gapY = 36
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * gapX
      const y = startY + r * gapY
      const filled = rng() > 0.4
      const col = (r + c) % 2 === 0 ? color : secondColor
      const radius = filled ? 5 + rng() * 4 : 4
      svg += `  <circle cx="${x}" cy="${y}" r="${radius.toFixed(1)}" fill="${filled ? col : "none"}" stroke="${col}" stroke-width="1" opacity="${filled ? 0.2 : 0.15}"/>\n`
    }
  }
  return svg
}

function shoppingBasket(color, secondColor) {
  return `
  <path d="M 570 340 L 590 280 L 690 280 L 710 340 Z" fill="${color}" opacity="0.08" stroke="${color}" stroke-width="2" opacity="0.3"/>
  <path d="M 560 340 L 580 440 L 700 440 L 720 340 Z" fill="${color}" opacity="0.1" stroke="${color}" stroke-width="2" opacity="0.3"/>
  <line x1="555" y1="340" x2="725" y2="340" stroke="${secondColor}" stroke-width="2.5" opacity="0.35"/>
  <path d="M 610 280 C 610 240, 640 220, 640 240 C 640 220, 670 240, 670 280" fill="none" stroke="${secondColor}" stroke-width="2" opacity="0.3"/>
  <circle cx="620" cy="380" r="8" fill="${secondColor}" opacity="0.15"/>
  <circle cx="660" cy="370" r="10" fill="${color}" opacity="0.15"/>
  <circle cx="640" cy="400" r="7" fill="${secondColor}" opacity="0.12"/>`
}

function seasonalCycle(color, secondColor) {
  return `
  <circle cx="640" cy="350" r="90" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.25"/>
  <line x1="640" y1="260" x2="640" y2="440" stroke="${color}" stroke-width="1" opacity="0.15"/>
  <line x1="550" y1="350" x2="730" y2="350" stroke="${color}" stroke-width="1" opacity="0.15"/>
  <path d="M 640 260 A 90 90 0 0 1 730 350 L 640 350 Z" fill="${color}" opacity="0.12"/>
  <path d="M 730 350 A 90 90 0 0 1 640 440 L 640 350 Z" fill="${secondColor}" opacity="0.1"/>
  <path d="M 640 440 A 90 90 0 0 1 550 350 L 640 350 Z" fill="${color}" opacity="0.08"/>
  <path d="M 550 350 A 90 90 0 0 1 640 260 L 640 350 Z" fill="${secondColor}" opacity="0.14"/>
  <circle cx="685" cy="305" r="4" fill="${color}" opacity="0.4"/>
  <circle cx="685" cy="395" r="4" fill="${secondColor}" opacity="0.4"/>
  <circle cx="595" cy="395" r="4" fill="${color}" opacity="0.35"/>
  <circle cx="595" cy="305" r="4" fill="${secondColor}" opacity="0.4"/>`
}

function communityFigures(color, secondColor, rng) {
  let svg = ""
  const figures = [
    [580, 360], [620, 340], [660, 350], [700, 360], [540, 370], [640, 330],
  ]
  figures.forEach(([cx, cy], i) => {
    const c = i % 2 === 0 ? color : secondColor
    const scale = 0.8 + rng() * 0.4
    // Head
    svg += `  <circle cx="${cx}" cy="${cy - 30 * scale}" r="${8 * scale}" fill="${c}" opacity="0.25"/>\n`
    // Body
    svg += `  <line x1="${cx}" y1="${cy - 22 * scale}" x2="${cx}" y2="${cy + 10 * scale}" stroke="${c}" stroke-width="${2 * scale}" opacity="0.25"/>\n`
    // Arms
    svg += `  <line x1="${cx - 15 * scale}" y1="${cy - 8 * scale}" x2="${cx + 15 * scale}" y2="${cy - 8 * scale}" stroke="${c}" stroke-width="${1.5 * scale}" opacity="0.2"/>\n`
    // Legs
    svg += `  <line x1="${cx}" y1="${cy + 10 * scale}" x2="${cx - 10 * scale}" y2="${cy + 30 * scale}" stroke="${c}" stroke-width="${1.5 * scale}" opacity="0.2"/>\n`
    svg += `  <line x1="${cx}" y1="${cy + 10 * scale}" x2="${cx + 10 * scale}" y2="${cy + 30 * scale}" stroke="${c}" stroke-width="${1.5 * scale}" opacity="0.2"/>\n`
  })
  return svg
}

function calendarGrid(color, secondColor, rng) {
  let svg = ""
  const cols = 7
  const rows = 5
  const cellW = 28
  const cellH = 24
  const startX = 540
  const startY = 260
  // Grid
  for (let r = 0; r <= rows; r++) {
    svg += `  <line x1="${startX}" y1="${startY + r * cellH}" x2="${startX + cols * cellW}" y2="${startY + r * cellH}" stroke="${color}" stroke-width="0.5" opacity="0.15"/>\n`
  }
  for (let c = 0; c <= cols; c++) {
    svg += `  <line x1="${startX + c * cellW}" y1="${startY}" x2="${startX + c * cellW}" y2="${startY + rows * cellH}" stroke="${color}" stroke-width="0.5" opacity="0.15"/>\n`
  }
  // Highlight some cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng() > 0.65) {
        const x = startX + c * cellW
        const y = startY + r * cellH
        svg += `  <rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${rng() > 0.5 ? color : secondColor}" opacity="${(0.08 + rng() * 0.12).toFixed(2)}"/>\n`
      }
    }
  }
  return svg
}

function rippleCircles(color, secondColor) {
  let svg = ""
  for (let i = 0; i < 7; i++) {
    const r = 20 + i * 20
    const c = i % 2 === 0 ? color : secondColor
    const op = 0.3 - i * 0.035
    svg += `  <circle cx="640" cy="350" r="${r}" fill="none" stroke="${c}" stroke-width="2" opacity="${op.toFixed(2)}"/>\n`
  }
  svg += `  <circle cx="640" cy="350" r="6" fill="${color}" opacity="0.4"/>\n`
  return svg
}

function networkNodes(color, secondColor, rng) {
  const nodes = [
    [580, 280], [700, 290], [640, 350], [560, 380], [720, 390],
    [600, 430], [680, 430], [640, 260], [530, 320], [750, 340],
  ]
  let svg = ""
  // Connections
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = Math.hypot(nodes[j][0] - nodes[i][0], nodes[j][1] - nodes[i][1])
      if (dist < 160) {
        const op = 0.08 + (1 - dist / 160) * 0.12
        svg += `  <line x1="${nodes[i][0]}" y1="${nodes[i][1]}" x2="${nodes[j][0]}" y2="${nodes[j][1]}" stroke="${color}" stroke-width="1.5" opacity="${op.toFixed(2)}"/>\n`
      }
    }
  }
  // Nodes
  nodes.forEach(([cx, cy], i) => {
    const r = 6 + rng() * 6
    const c = i % 3 === 0 ? secondColor : color
    svg += `  <circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="${c}" opacity="0.2"/>\n`
    svg += `  <circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.35"/>\n`
  })
  return svg
}

/* ── Per-chapter configuration ────────────────────────────────────────── */
const CHAPTER_CONFIGS = [
  { ch: 1,  primary: COLORS.green,  secondary: COLORS.teal,   symbol: gutCrossSection },
  { ch: 2,  primary: COLORS.green,  secondary: COLORS.lime,   symbol: bacterialColony },
  { ch: 3,  primary: COLORS.green,  secondary: COLORS.teal,   symbol: threeOverlappingCircles, useThreeColors: true },
  { ch: 4,  primary: COLORS.green,  secondary: COLORS.lime,   symbol: rootNetwork },
  { ch: 5,  primary: COLORS.green,  secondary: COLORS.teal,   symbol: fiberStrands },
  { ch: 6,  primary: COLORS.teal,   secondary: COLORS.green,  symbol: threePillars },
  { ch: 7,  primary: COLORS.teal,   secondary: COLORS.lime,   symbol: sproutingSeed },
  { ch: 8,  primary: COLORS.teal,   secondary: COLORS.green,  symbol: fermentationBubbles },
  { ch: 9,  primary: COLORS.teal,   secondary: COLORS.lime,   symbol: shieldMolecular },
  { ch: 10, primary: COLORS.teal,   secondary: COLORS.green,  symbol: dnaHelix },
  { ch: 11, primary: COLORS.lime,   secondary: COLORS.green,  symbol: overlappingCards },
  { ch: 12, primary: COLORS.lime,   secondary: COLORS.teal,   symbol: jarWithBubbles },
  { ch: 13, primary: COLORS.lime,   secondary: COLORS.green,  symbol: brainGutAxis },
  { ch: 14, primary: COLORS.lime,   secondary: COLORS.teal,   symbol: leafRootGarden },
  { ch: 15, primary: COLORS.lime,   secondary: COLORS.green,  symbol: grainStalks },
  { ch: 16, primary: COLORS.yellow, secondary: COLORS.orange,  symbol: plateComposition },
  { ch: 17, primary: COLORS.yellow, secondary: COLORS.orange,  symbol: clockArc },
  { ch: 18, primary: COLORS.yellow, secondary: COLORS.orange,  symbol: pantryShelves },
  { ch: 19, primary: COLORS.yellow, secondary: COLORS.orange,  symbol: indexGrid },
  { ch: 20, primary: COLORS.yellow, secondary: COLORS.orange,  symbol: shoppingBasket },
  { ch: 21, primary: COLORS.orange, secondary: COLORS.yellow,  symbol: seasonalCycle },
  { ch: 22, primary: COLORS.orange, secondary: COLORS.yellow,  symbol: communityFigures },
  { ch: 23, primary: COLORS.orange, secondary: COLORS.yellow,  symbol: calendarGrid },
  { ch: 24, primary: COLORS.orange, secondary: COLORS.yellow,  symbol: rippleCircles },
  { ch: 25, primary: COLORS.green,  secondary: COLORS.orange,  symbol: networkNodes },
]

/* ── Build one SVG ────────────────────────────────────────────────────── */
function buildSvg(config) {
  const { ch, primary, secondary, symbol, useThreeColors } = config
  const rng = mulberry32(ch * 7919 + 42)
  const W = 1280
  const H = 720

  let defs = ""
  let body = ""

  // Gradient background
  const gradId = `bg-grad-${ch}`
  defs += `  <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${primary}" stop-opacity="0.06"/>
    <stop offset="100%" stop-color="${secondary}" stop-opacity="0.03"/>
  </linearGradient>\n`

  body += `  <rect width="${W}" height="${H}" fill="url(#${gradId})"/>\n`

  // 2-3 background organic blobs
  const blobCount = 2 + (ch % 2)
  for (let i = 0; i < blobCount; i++) {
    const blobCx = 200 + rng() * 880
    const blobCy = 100 + rng() * 520
    const blobR = 100 + rng() * 180
    const c = i % 2 === 0 ? primary : secondary
    const op = 0.04 + rng() * 0.06
    body += `  <path d="${organicBlob(blobCx, blobCy, blobR, rng)}" fill="${c}" opacity="${op.toFixed(2)}"/>\n`
  }

  // Decorative dots
  body += decorativeDots(
    12 + Math.floor(rng() * 10),
    80, 60, W - 80, H - 60,
    2, 5, primary, 0.08 + rng() * 0.08, rng
  )

  // Accent curve
  const curveY1 = 100 + rng() * 200
  const curveY2 = 400 + rng() * 200
  body += accentCurve(
    80, curveY1,
    300 + rng() * 200, curveY1 + (rng() - 0.5) * 200,
    800 + rng() * 200, curveY2 + (rng() - 0.5) * 200,
    W - 80, curveY2,
    secondary, 2, 0.1
  ) + "\n"

  // Chapter-specific symbolic centerpiece
  if (useThreeColors) {
    body += symbol([primary, secondary, COLORS.lime])
  } else if (symbol.length >= 3) {
    body += symbol(primary, secondary, rng)
  } else {
    body += symbol(primary, secondary)
  }
  body += "\n"

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none">
<defs>
${defs}</defs>
${body}</svg>`
}

/* ── Main ─────────────────────────────────────────────────────────────── */
console.log("Generating 25 hero SVGs...\n")

for (const config of CHAPTER_CONFIGS) {
  const dir = path.join(OUT_DIR, `ch${config.ch}`)
  fs.mkdirSync(dir, { recursive: true })

  const svgContent = buildSvg(config)
  const outPath = path.join(dir, "hero.svg")
  fs.writeFileSync(outPath, svgContent, "utf-8")

  const sizeKB = (Buffer.byteLength(svgContent) / 1024).toFixed(1)
  console.log(`  ch${config.ch}/hero.svg  (${sizeKB} KB)`)
}

console.log("\nDone! 25 hero SVGs generated.")
