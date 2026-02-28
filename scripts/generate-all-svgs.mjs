/**
 * generate-all-svgs.mjs
 *
 * Generates SVG illustrations for ALL remaining ImagePlaceholder instances
 * across 25 chapters (skipping heroes which already have SVGs). Uses a
 * template-based system with 14 visual templates, keyword matching, and
 * seeded PRNG for unique but reproducible output.
 *
 * Usage: node scripts/generate-all-svgs.mjs
 * Output: public/images/book/ch{N}/img-{index}.svg
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const OUT_DIR = path.join(ROOT, "public", "images", "book")
const CONTENT_DIR = path.join(ROOT, "content", "book")

/* ── Brand palette ────────────────────────────────────────────────────── */
const COLORS = {
  lime: "#A8E063",
  green: "#4CB648",
  teal: "#2DAA6E",
  yellow: "#F5C518",
  orange: "#F5A623",
}

/* ── Per-chapter color config ─────────────────────────────────────────── */
const CHAPTER_COLORS = [
  { ch: 1, primary: COLORS.green, secondary: COLORS.teal },
  { ch: 2, primary: COLORS.green, secondary: COLORS.lime },
  { ch: 3, primary: COLORS.green, secondary: COLORS.teal },
  { ch: 4, primary: COLORS.green, secondary: COLORS.lime },
  { ch: 5, primary: COLORS.green, secondary: COLORS.teal },
  { ch: 6, primary: COLORS.teal, secondary: COLORS.green },
  { ch: 7, primary: COLORS.teal, secondary: COLORS.lime },
  { ch: 8, primary: COLORS.teal, secondary: COLORS.green },
  { ch: 9, primary: COLORS.teal, secondary: COLORS.lime },
  { ch: 10, primary: COLORS.teal, secondary: COLORS.green },
  { ch: 11, primary: COLORS.lime, secondary: COLORS.green },
  { ch: 12, primary: COLORS.lime, secondary: COLORS.teal },
  { ch: 13, primary: COLORS.lime, secondary: COLORS.green },
  { ch: 14, primary: COLORS.lime, secondary: COLORS.teal },
  { ch: 15, primary: COLORS.lime, secondary: COLORS.green },
  { ch: 16, primary: COLORS.yellow, secondary: COLORS.orange },
  { ch: 17, primary: COLORS.yellow, secondary: COLORS.orange },
  { ch: 18, primary: COLORS.yellow, secondary: COLORS.orange },
  { ch: 19, primary: COLORS.yellow, secondary: COLORS.orange },
  { ch: 20, primary: COLORS.yellow, secondary: COLORS.orange },
  { ch: 21, primary: COLORS.orange, secondary: COLORS.yellow },
  { ch: 22, primary: COLORS.orange, secondary: COLORS.yellow },
  { ch: 23, primary: COLORS.orange, secondary: COLORS.yellow },
  { ch: 24, primary: COLORS.orange, secondary: COLORS.yellow },
  { ch: 25, primary: COLORS.green, secondary: COLORS.orange },
]

const DIMENSIONS = {
  wide: { W: 1280, H: 720 },
  square: { W: 1280, H: 1280 },
  portrait: { W: 1280, H: 1707 },
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
function f(n) { return n.toFixed(1) }

/* ── Shape library (reused from hero generator) ───────────────────────── */
function organicBlob(cx, cy, baseRadius, rng, points = 8) {
  const angleStep = (Math.PI * 2) / points
  const nodes = []
  for (let i = 0; i < points; i++) {
    const angle = angleStep * i - Math.PI / 2
    const r = baseRadius * (0.7 + rng() * 0.6)
    nodes.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r })
  }
  let d = `M ${f(nodes[0].x)} ${f(nodes[0].y)}`
  for (let i = 0; i < points; i++) {
    const curr = nodes[i], next = nodes[(i + 1) % points]
    const prev = nodes[(i - 1 + points) % points], nn = nodes[(i + 2) % points]
    d += ` C ${f(curr.x + (next.x - prev.x) / 6)} ${f(curr.y + (next.y - prev.y) / 6)}, ${f(next.x - (nn.x - curr.x) / 6)} ${f(next.y - (nn.y - curr.y) / 6)}, ${f(next.x)} ${f(next.y)}`
  }
  return d + " Z"
}

function decorativeDots(count, xMin, yMin, xMax, yMax, minR, maxR, color, opacity, rng) {
  let svg = ""
  for (let i = 0; i < count; i++) {
    const x = lerp(xMin, xMax, rng()), y = lerp(yMin, yMax, rng()), r = lerp(minR, maxR, rng())
    svg += `  <circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${color}" opacity="${opacity.toFixed(2)}"/>\n`
  }
  return svg
}

/* ══════════════════════════════════════════════════════════════════════════
   14 VISUAL TEMPLATES
   ══════════════════════════════════════════════════════════════════════════ */

/** Template 1: Grid of panels/cards */
function gridPanels(cx, cy, W, H, pri, sec, rng) {
  let svg = ""
  const cols = 3, rows = 2
  const totalW = W * 0.62, totalH = H * 0.55
  const gap = 14
  const cellW = (totalW - gap * (cols - 1)) / cols
  const cellH = (totalH - gap * (rows - 1)) / rows
  const startX = cx - totalW / 2, startY = cy - totalH / 2
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * (cellW + gap)
      const y = startY + r * (cellH + gap)
      const col = (r + c) % 2 === 0 ? pri : sec
      const op = 0.08 + rng() * 0.08
      svg += `  <rect x="${f(x)}" y="${f(y)}" width="${f(cellW)}" height="${f(cellH)}" rx="10" fill="${col}" opacity="${op.toFixed(2)}"/>\n`
      svg += `  <rect x="${f(x)}" y="${f(y)}" width="${f(cellW)}" height="${f(cellH)}" rx="10" fill="none" stroke="${col}" stroke-width="1.2" opacity="0.25"/>\n`
      // Icon circle
      const icR = 10 + rng() * 6
      svg += `  <circle cx="${f(x + cellW / 2)}" cy="${f(y + 22 + rng() * 8)}" r="${f(icR)}" fill="${col}" opacity="0.15"/>\n`
      // Text lines
      for (let l = 0; l < 2; l++) {
        const lw = cellW * (0.5 + rng() * 0.3)
        const ly = y + cellH * 0.55 + l * 14
        svg += `  <line x1="${f(x + (cellW - lw) / 2)}" y1="${f(ly)}" x2="${f(x + (cellW + lw) / 2)}" y2="${f(ly)}" stroke="${col}" stroke-width="2" opacity="0.12" stroke-linecap="round"/>\n`
      }
    }
  }
  return svg
}

/** Template 2: Flow/process diagram */
function flowProcess(cx, cy, W, H, pri, sec, rng) {
  let svg = ""
  const nodes = 4
  const nodeR = 28 + rng() * 10
  const spacing = W * 0.55 / (nodes - 1)
  const startX = cx - (spacing * (nodes - 1)) / 2
  for (let i = 0; i < nodes; i++) {
    const nx = startX + i * spacing
    const ny = cy + (rng() - 0.5) * 30
    const col = i % 2 === 0 ? pri : sec
    // Node
    svg += `  <circle cx="${f(nx)}" cy="${f(ny)}" r="${f(nodeR)}" fill="${col}" opacity="0.1"/>\n`
    svg += `  <circle cx="${f(nx)}" cy="${f(ny)}" r="${f(nodeR)}" fill="none" stroke="${col}" stroke-width="1.8" opacity="0.3"/>\n`
    // Inner icon dot
    svg += `  <circle cx="${f(nx)}" cy="${f(ny)}" r="${f(5 + rng() * 4)}" fill="${col}" opacity="0.2"/>\n`
    // Arrow to next
    if (i < nodes - 1) {
      const nx2 = startX + (i + 1) * spacing
      const ny2 = cy + (rng() - 0.5) * 30
      const midX = (nx + nx2) / 2
      const midY = (ny + ny2) / 2 - 20 - rng() * 20
      svg += `  <path d="M ${f(nx + nodeR + 4)} ${f(ny)} Q ${f(midX)} ${f(midY)}, ${f(nx2 - nodeR - 4)} ${f(ny2)}" fill="none" stroke="${pri}" stroke-width="1.5" opacity="0.25" stroke-linecap="round"/>\n`
      // Arrowhead
      svg += `  <circle cx="${f(nx2 - nodeR - 6)}" cy="${f(ny2)}" r="3" fill="${pri}" opacity="0.3"/>\n`
    }
  }
  return svg
}

/** Template 3: Comparison split */
function comparisonSplit(cx, cy, W, H, pri, sec, rng) {
  let svg = ""
  // Dividing line
  svg += `  <line x1="${f(cx)}" y1="${f(cy - H * 0.3)}" x2="${f(cx)}" y2="${f(cy + H * 0.3)}" stroke="${pri}" stroke-width="1" opacity="0.15" stroke-dasharray="6 4"/>\n`
  // Left side — sparse, muted
  for (let i = 0; i < 3; i++) {
    const bx = cx - W * 0.15 - rng() * W * 0.15
    const by = cy - H * 0.2 + rng() * H * 0.4
    const br = 30 + rng() * 40
    svg += `  <path d="${organicBlob(bx, by, br, rng, 6)}" fill="${sec}" opacity="${(0.04 + rng() * 0.04).toFixed(2)}"/>\n`
  }
  // Left label line
  svg += `  <line x1="${f(cx - W * 0.28)}" y1="${f(cy - H * 0.28)}" x2="${f(cx - W * 0.1)}" y2="${f(cy - H * 0.28)}" stroke="${sec}" stroke-width="2" opacity="0.12" stroke-linecap="round"/>\n`
  // Right side — dense, vibrant
  for (let i = 0; i < 5; i++) {
    const bx = cx + W * 0.1 + rng() * W * 0.2
    const by = cy - H * 0.2 + rng() * H * 0.4
    const br = 25 + rng() * 50
    svg += `  <path d="${organicBlob(bx, by, br, rng, 7)}" fill="${pri}" opacity="${(0.08 + rng() * 0.1).toFixed(2)}"/>\n`
  }
  svg += decorativeDots(8, cx + W * 0.05, cy - H * 0.25, cx + W * 0.35, cy + H * 0.25, 2, 5, pri, 0.12, rng)
  // Right label line
  svg += `  <line x1="${f(cx + W * 0.1)}" y1="${f(cy - H * 0.28)}" x2="${f(cx + W * 0.28)}" y2="${f(cy - H * 0.28)}" stroke="${pri}" stroke-width="2.5" opacity="0.2" stroke-linecap="round"/>\n`
  // Diamond marker at center
  svg += `  <rect x="${f(cx - 5)}" y="${f(cy - 5)}" width="10" height="10" fill="${pri}" opacity="0.2" transform="rotate(45 ${f(cx)} ${f(cy)})"/>\n`
  return svg
}

/** Template 4: Pyramid/hierarchy */
function pyramidHierarchy(cx, cy, W, H, pri, sec, rng) {
  let svg = ""
  const tiers = 4
  const maxW = W * 0.52, tierH = H * 0.12
  const gap = 8
  const totalH = tiers * tierH + (tiers - 1) * gap
  const startY = cy - totalH / 2
  for (let i = 0; i < tiers; i++) {
    const tierW = maxW * ((tiers - i) / tiers) * (0.85 + rng() * 0.15)
    const ty = startY + i * (tierH + gap)
    const tx = cx - tierW / 2
    const col = i % 2 === 0 ? pri : sec
    svg += `  <rect x="${f(tx)}" y="${f(ty)}" width="${f(tierW)}" height="${f(tierH)}" rx="8" fill="${col}" opacity="${(0.08 + i * 0.03).toFixed(2)}"/>\n`
    svg += `  <rect x="${f(tx)}" y="${f(ty)}" width="${f(tierW)}" height="${f(tierH)}" rx="8" fill="none" stroke="${col}" stroke-width="1.2" opacity="0.25"/>\n`
    // Small icon circle in center of tier
    svg += `  <circle cx="${f(cx)}" cy="${f(ty + tierH / 2)}" r="${f(6 + rng() * 4)}" fill="${col}" opacity="0.2"/>\n`
    // Text line
    const lw = tierW * 0.4 + rng() * tierW * 0.2
    svg += `  <line x1="${f(cx - lw / 2 + 16)}" y1="${f(ty + tierH / 2)}" x2="${f(cx + lw / 2)}" y2="${f(ty + tierH / 2)}" stroke="${col}" stroke-width="1.5" opacity="0.1" stroke-linecap="round"/>\n`
  }
  return svg
}

/** Template 5: Funnel/narrowing */
function funnelNarrow(cx, cy, W, H, pri, sec, rng) {
  let svg = ""
  const topW = W * 0.45, bottomW = W * 0.1
  const funnelH = H * 0.55
  const topY = cy - funnelH / 2, botY = cy + funnelH / 2
  // Funnel shape
  svg += `  <path d="M ${f(cx - topW / 2)} ${f(topY)} L ${f(cx - bottomW / 2)} ${f(botY)} L ${f(cx + bottomW / 2)} ${f(botY)} L ${f(cx + topW / 2)} ${f(topY)} Z" fill="${pri}" opacity="0.06" stroke="${pri}" stroke-width="1.5" opacity="0.2"/>\n`
  // Horizontal stage lines
  for (let i = 1; i < 4; i++) {
    const t = i / 4
    const ly = lerp(topY, botY, t)
    const lw = lerp(topW, bottomW, t)
    svg += `  <line x1="${f(cx - lw / 2)}" y1="${f(ly)}" x2="${f(cx + lw / 2)}" y2="${f(ly)}" stroke="${sec}" stroke-width="0.8" opacity="0.12"/>\n`
  }
  // Scattered dots (many at top, few at bottom)
  for (let i = 0; i < 20; i++) {
    const t = rng()
    const y = lerp(topY + 10, botY - 10, t * t) // Concentrate toward top
    const halfW = lerp(topW / 2 - 15, bottomW / 2 - 5, t)
    const x = cx + (rng() - 0.5) * halfW * 2
    const r = 2 + rng() * 4
    const col = rng() > 0.5 ? pri : sec
    svg += `  <circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${col}" opacity="${(0.1 + rng() * 0.15).toFixed(2)}"/>\n`
  }
  return svg
}

/** Template 6: Radial hub with spokes */
function radialHub(cx, cy, W, H, pri, sec, rng) {
  let svg = ""
  const hubR = 30 + rng() * 12
  const spokeLen = Math.min(W, H) * 0.25
  const spokes = 6
  // Hub
  svg += `  <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(hubR)}" fill="${pri}" opacity="0.12"/>\n`
  svg += `  <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(hubR)}" fill="none" stroke="${pri}" stroke-width="2" opacity="0.35"/>\n`
  svg += `  <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(hubR * 0.4)}" fill="${pri}" opacity="0.15"/>\n`
  // Spokes
  for (let i = 0; i < spokes; i++) {
    const angle = (i / spokes) * Math.PI * 2 - Math.PI / 2
    const endR = spokeLen + rng() * 30
    const ex = cx + Math.cos(angle) * endR
    const ey = cy + Math.sin(angle) * endR
    const col = i % 2 === 0 ? pri : sec
    const nodeR = 10 + rng() * 8
    svg += `  <line x1="${f(cx + Math.cos(angle) * hubR)}" y1="${f(cy + Math.sin(angle) * hubR)}" x2="${f(ex)}" y2="${f(ey)}" stroke="${col}" stroke-width="1.5" opacity="0.2"/>\n`
    svg += `  <circle cx="${f(ex)}" cy="${f(ey)}" r="${f(nodeR)}" fill="${col}" opacity="0.1"/>\n`
    svg += `  <circle cx="${f(ex)}" cy="${f(ey)}" r="${f(nodeR)}" fill="none" stroke="${col}" stroke-width="1.2" opacity="0.3"/>\n`
    // Tiny inner dot
    svg += `  <circle cx="${f(ex)}" cy="${f(ey)}" r="3" fill="${col}" opacity="0.25"/>\n`
  }
  return svg
}

/** Template 7: Timeline/sequence */
function timelineSequence(cx, cy, W, H, pri, sec, rng) {
  let svg = ""
  const markers = 5
  const lineW = W * 0.6
  const startX = cx - lineW / 2
  const spacing = lineW / (markers - 1)
  // Main timeline line
  svg += `  <line x1="${f(startX)}" y1="${f(cy)}" x2="${f(startX + lineW)}" y2="${f(cy)}" stroke="${pri}" stroke-width="2" opacity="0.2" stroke-linecap="round"/>\n`
  // Progress gradient overlay
  svg += `  <line x1="${f(startX)}" y1="${f(cy)}" x2="${f(startX + lineW * 0.7)}" y2="${f(cy)}" stroke="${pri}" stroke-width="3" opacity="0.15" stroke-linecap="round"/>\n`
  for (let i = 0; i < markers; i++) {
    const mx = startX + i * spacing
    const above = i % 2 === 0
    const col = i % 2 === 0 ? pri : sec
    // Marker dot
    svg += `  <circle cx="${f(mx)}" cy="${f(cy)}" r="5" fill="${col}" opacity="0.3"/>\n`
    // Card
    const cardW = spacing * 0.7
    const cardH = H * 0.18
    const cardY = above ? cy - 20 - cardH : cy + 20
    svg += `  <rect x="${f(mx - cardW / 2)}" y="${f(cardY)}" width="${f(cardW)}" height="${f(cardH)}" rx="8" fill="${col}" opacity="0.07"/>\n`
    svg += `  <rect x="${f(mx - cardW / 2)}" y="${f(cardY)}" width="${f(cardW)}" height="${f(cardH)}" rx="8" fill="none" stroke="${col}" stroke-width="1" opacity="0.2"/>\n`
    // Connector from dot to card
    const connY = above ? cy - 5 : cy + 5
    const connEndY = above ? cardY + cardH : cardY
    svg += `  <line x1="${f(mx)}" y1="${f(connY)}" x2="${f(mx)}" y2="${f(connEndY)}" stroke="${col}" stroke-width="0.8" opacity="0.15"/>\n`
    // Text line inside card
    const lw = cardW * (0.4 + rng() * 0.3)
    svg += `  <line x1="${f(mx - lw / 2)}" y1="${f(cardY + cardH / 2)}" x2="${f(mx + lw / 2)}" y2="${f(cardY + cardH / 2)}" stroke="${col}" stroke-width="1.5" opacity="0.1" stroke-linecap="round"/>\n`
  }
  return svg
}

/** Template 8: Bar chart */
function barChart(cx, cy, W, H, pri, sec, rng) {
  let svg = ""
  const bars = 5
  const chartW = W * 0.48, chartH = H * 0.45
  const barW = chartW / (bars * 1.8)
  const gap = barW * 0.8
  const startX = cx - (bars * (barW + gap) - gap) / 2
  const baseY = cy + chartH / 2
  // Gridlines
  for (let i = 0; i < 4; i++) {
    const gy = baseY - chartH * (i + 1) / 4
    svg += `  <line x1="${f(startX - 10)}" y1="${f(gy)}" x2="${f(startX + bars * (barW + gap))}" y2="${f(gy)}" stroke="${pri}" stroke-width="0.5" opacity="0.1"/>\n`
  }
  // Baseline
  svg += `  <line x1="${f(startX - 10)}" y1="${f(baseY)}" x2="${f(startX + bars * (barW + gap))}" y2="${f(baseY)}" stroke="${pri}" stroke-width="1.5" opacity="0.2"/>\n`
  // Bars
  for (let i = 0; i < bars; i++) {
    const bx = startX + i * (barW + gap)
    const bh = chartH * (0.25 + rng() * 0.7)
    const by = baseY - bh
    const col = i % 2 === 0 ? pri : sec
    svg += `  <rect x="${f(bx)}" y="${f(by)}" width="${f(barW)}" height="${f(bh)}" rx="4" fill="${col}" opacity="${(0.12 + rng() * 0.1).toFixed(2)}"/>\n`
    svg += `  <rect x="${f(bx)}" y="${f(by)}" width="${f(barW)}" height="${f(bh)}" rx="4" fill="none" stroke="${col}" stroke-width="1" opacity="0.25"/>\n`
  }
  return svg
}

/** Template 9: Circular plate / pie diagram */
function circularPlate(cx, cy, W, H, pri, sec, rng) {
  let svg = ""
  const r = Math.min(W, H) * 0.28
  // Outer ring
  svg += `  <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${pri}" opacity="0.05"/>\n`
  svg += `  <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${pri}" stroke-width="2" opacity="0.25"/>\n`
  // Inner ring
  svg += `  <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.65)}" fill="none" stroke="${sec}" stroke-width="1" opacity="0.12"/>\n`
  // 4 sectors
  const sectors = 4
  for (let i = 0; i < sectors; i++) {
    const a1 = (i / sectors) * Math.PI * 2 - Math.PI / 2
    const a2 = ((i + 1) / sectors) * Math.PI * 2 - Math.PI / 2
    const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r
    const x2 = cx + Math.cos(a2) * r, y2 = cy + Math.sin(a2) * r
    const col = i % 2 === 0 ? pri : sec
    svg += `  <path d="M ${f(cx)} ${f(cy)} L ${f(x1)} ${f(y1)} A ${f(r)} ${f(r)} 0 0 1 ${f(x2)} ${f(y2)} Z" fill="${col}" opacity="${(0.05 + i * 0.025).toFixed(3)}"/>\n`
    // Sector divider line
    svg += `  <line x1="${f(cx)}" y1="${f(cy)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${pri}" stroke-width="1" opacity="0.12"/>\n`
  }
  // Center dot
  svg += `  <circle cx="${f(cx)}" cy="${f(cy)}" r="4" fill="${pri}" opacity="0.3"/>\n`
  return svg
}

/** Template 10: Scene/landscape */
function sceneLandscape(cx, cy, W, H, pri, sec, rng) {
  let svg = ""
  const horizonY = cy + H * 0.08
  // Ground band
  svg += `  <rect x="0" y="${f(horizonY)}" width="${W}" height="${f(H - horizonY)}" fill="${pri}" opacity="0.04"/>\n`
  // Wavy ground line
  let groundD = `M 0 ${f(horizonY)}`
  for (let i = 0; i < 8; i++) {
    const gx = (i + 1) * W / 8
    const gy = horizonY + (rng() - 0.5) * 15
    groundD += ` Q ${f(gx - W / 16)} ${f(gy + (rng() - 0.5) * 10)}, ${f(gx)} ${f(gy)}`
  }
  svg += `  <path d="${groundD}" fill="none" stroke="${pri}" stroke-width="1.5" opacity="0.15"/>\n`
  // Trees/plants as blobs
  for (let i = 0; i < 5; i++) {
    const tx = W * 0.15 + rng() * W * 0.7
    const ty = horizonY - 10 - rng() * 20
    const tr = 20 + rng() * 35
    const col = rng() > 0.5 ? pri : sec
    svg += `  <path d="${organicBlob(tx, ty, tr, rng, 6)}" fill="${col}" opacity="${(0.06 + rng() * 0.08).toFixed(2)}"/>\n`
    // Stem
    svg += `  <line x1="${f(tx)}" y1="${f(ty + tr * 0.5)}" x2="${f(tx)}" y2="${f(horizonY + 15)}" stroke="${col}" stroke-width="1.5" opacity="0.12"/>\n`
  }
  // Particles in sky area
  svg += decorativeDots(6, W * 0.1, cy - H * 0.3, W * 0.9, horizonY - 20, 1.5, 4, sec, 0.08, rng)
  // Path line
  svg += `  <path d="M ${f(cx - W * 0.2)} ${f(horizonY + 20)} Q ${f(cx)} ${f(horizonY + 40)}, ${f(cx + W * 0.25)} ${f(horizonY + 15)}" fill="none" stroke="${sec}" stroke-width="2" opacity="0.12" stroke-linecap="round"/>\n`
  return svg
}

/** Template 11: Reference card */
function referenceCard(cx, cy, W, H, pri, sec, rng) {
  let svg = ""
  const cardW = W * 0.45, cardH = H * 0.6
  const cardX = cx - cardW / 2, cardY = cy - cardH / 2
  // Card background
  svg += `  <rect x="${f(cardX)}" y="${f(cardY)}" width="${f(cardW)}" height="${f(cardH)}" rx="14" fill="${pri}" opacity="0.05"/>\n`
  svg += `  <rect x="${f(cardX)}" y="${f(cardY)}" width="${f(cardW)}" height="${f(cardH)}" rx="14" fill="none" stroke="${pri}" stroke-width="1.5" opacity="0.25"/>\n`
  // Header bar
  svg += `  <rect x="${f(cardX)}" y="${f(cardY)}" width="${f(cardW)}" height="40" rx="14" fill="${pri}" opacity="0.08"/>\n`
  // Icon circle
  svg += `  <circle cx="${f(cardX + 28)}" cy="${f(cardY + 20)}" r="10" fill="${sec}" opacity="0.2"/>\n`
  // Header text line
  svg += `  <line x1="${f(cardX + 46)}" y1="${f(cardY + 20)}" x2="${f(cardX + cardW * 0.7)}" y2="${f(cardY + 20)}" stroke="${pri}" stroke-width="2.5" opacity="0.15" stroke-linecap="round"/>\n`
  // Content lines
  const lines = 6
  for (let i = 0; i < lines; i++) {
    const ly = cardY + 60 + i * (cardH - 80) / lines
    const lw = cardW * (0.5 + rng() * 0.3)
    const col = i % 3 === 0 ? sec : pri
    svg += `  <line x1="${f(cardX + 20)}" y1="${f(ly)}" x2="${f(cardX + 20 + lw)}" y2="${f(ly)}" stroke="${col}" stroke-width="1.5" opacity="0.1" stroke-linecap="round"/>\n`
    // Bullet dot
    svg += `  <circle cx="${f(cardX + 14)}" cy="${f(ly)}" r="2.5" fill="${col}" opacity="0.15"/>\n`
  }
  return svg
}

/** Template 12: Body/anatomy system */
function bodySystem(cx, cy, W, H, pri, sec, rng) {
  let svg = ""
  // Abstract torso outline
  svg += `  <path d="M ${f(cx)} ${f(cy - H * 0.25)} C ${f(cx + 50)} ${f(cy - H * 0.2)}, ${f(cx + 60)} ${f(cy - H * 0.05)}, ${f(cx + 55)} ${f(cy + H * 0.1)} C ${f(cx + 50)} ${f(cy + H * 0.2)}, ${f(cx + 30)} ${f(cy + H * 0.28)}, ${f(cx)} ${f(cy + H * 0.3)}" fill="none" stroke="${pri}" stroke-width="2" opacity="0.2" stroke-linecap="round"/>\n`
  svg += `  <path d="M ${f(cx)} ${f(cy - H * 0.25)} C ${f(cx - 50)} ${f(cy - H * 0.2)}, ${f(cx - 60)} ${f(cy - H * 0.05)}, ${f(cx - 55)} ${f(cy + H * 0.1)} C ${f(cx - 50)} ${f(cy + H * 0.2)}, ${f(cx - 30)} ${f(cy + H * 0.28)}, ${f(cx)} ${f(cy + H * 0.3)}" fill="none" stroke="${pri}" stroke-width="2" opacity="0.2" stroke-linecap="round"/>\n`
  // Organ zones
  const zones = [
    { x: cx, y: cy - H * 0.16, label: "head" },
    { x: cx - 15, y: cy + H * 0.02, label: "gut" },
    { x: cx + 20, y: cy + H * 0.12, label: "lower" },
  ]
  zones.forEach((z, i) => {
    const zr = 14 + rng() * 8
    const col = i % 2 === 0 ? pri : sec
    svg += `  <circle cx="${f(z.x)}" cy="${f(z.y)}" r="${f(zr)}" fill="${col}" opacity="0.12"/>\n`
    svg += `  <circle cx="${f(z.x)}" cy="${f(z.y)}" r="${f(zr)}" fill="none" stroke="${col}" stroke-width="1.5" opacity="0.3"/>\n`
  })
  // Connections between zones
  for (let i = 0; i < zones.length - 1; i++) {
    const z1 = zones[i], z2 = zones[i + 1]
    svg += `  <line x1="${f(z1.x)}" y1="${f(z1.y)}" x2="${f(z2.x)}" y2="${f(z2.y)}" stroke="${pri}" stroke-width="1.5" opacity="0.15" stroke-dasharray="4 3"/>\n`
    // Signal dots along connection
    for (let j = 1; j <= 3; j++) {
      const t = j / 4
      const dx = lerp(z1.x, z2.x, t), dy = lerp(z1.y, z2.y, t)
      svg += `  <circle cx="${f(dx)}" cy="${f(dy)}" r="2" fill="${sec}" opacity="0.2"/>\n`
    }
  }
  return svg
}

/** Template 13: Venn/overlap diagram */
function vennOverlap(cx, cy, W, H, pri, sec, rng) {
  let svg = ""
  const r = Math.min(W, H) * 0.22
  const offset = r * 0.55
  // Circle A (left)
  svg += `  <circle cx="${f(cx - offset)}" cy="${f(cy)}" r="${f(r)}" fill="${pri}" opacity="0.1"/>\n`
  svg += `  <circle cx="${f(cx - offset)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${pri}" stroke-width="2" opacity="0.3"/>\n`
  // Circle B (right)
  svg += `  <circle cx="${f(cx + offset)}" cy="${f(cy)}" r="${f(r)}" fill="${sec}" opacity="0.1"/>\n`
  svg += `  <circle cx="${f(cx + offset)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${sec}" stroke-width="2" opacity="0.3"/>\n`
  // Overlap highlight
  svg += `  <circle cx="${f(cx - offset)}" cy="${f(cy)}" r="${f(r)}" fill="${pri}" opacity="0.06" clip-path="url(#venn-clip-${rng().toFixed(4)})"/>\n`
  // Label placeholder lines
  svg += `  <line x1="${f(cx - offset - r * 0.4)}" y1="${f(cy - r - 20)}" x2="${f(cx - offset + r * 0.4)}" y2="${f(cy - r - 20)}" stroke="${pri}" stroke-width="2" opacity="0.12" stroke-linecap="round"/>\n`
  svg += `  <line x1="${f(cx + offset - r * 0.4)}" y1="${f(cy - r - 20)}" x2="${f(cx + offset + r * 0.4)}" y2="${f(cy - r - 20)}" stroke="${sec}" stroke-width="2" opacity="0.12" stroke-linecap="round"/>\n`
  // Center intersection dot
  svg += `  <circle cx="${f(cx)}" cy="${f(cy)}" r="5" fill="${pri}" opacity="0.25"/>\n`
  return svg
}

/** Template 14: Network map */
function networkMap(cx, cy, W, H, pri, sec, rng) {
  let svg = ""
  const nodeCount = 10
  const nodes = []
  const spread = Math.min(W, H) * 0.32
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      x: cx + (rng() - 0.5) * spread * 2,
      y: cy + (rng() - 0.5) * spread * 1.2,
    })
  }
  // Connections
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      const d = Math.hypot(nodes[j].x - nodes[i].x, nodes[j].y - nodes[i].y)
      if (d < spread * 0.8) {
        const op = 0.06 + (1 - d / (spread * 0.8)) * 0.1
        svg += `  <line x1="${f(nodes[i].x)}" y1="${f(nodes[i].y)}" x2="${f(nodes[j].x)}" y2="${f(nodes[j].y)}" stroke="${pri}" stroke-width="1.2" opacity="${op.toFixed(2)}"/>\n`
      }
    }
  }
  // Nodes
  nodes.forEach((n, i) => {
    const nr = 5 + rng() * 7
    const col = i % 3 === 0 ? sec : pri
    svg += `  <circle cx="${f(n.x)}" cy="${f(n.y)}" r="${f(nr)}" fill="${col}" opacity="0.15"/>\n`
    svg += `  <circle cx="${f(n.x)}" cy="${f(n.y)}" r="${f(nr)}" fill="none" stroke="${col}" stroke-width="1.2" opacity="0.3"/>\n`
  })
  return svg
}

/* ── Template registry ────────────────────────────────────────────────── */
const TEMPLATES = {
  gridPanels, flowProcess, comparisonSplit, pyramidHierarchy,
  funnelNarrow, radialHub, timelineSequence, barChart,
  circularPlate, sceneLandscape, referenceCard, bodySystem,
  vennOverlap, networkMap,
}

/* ══════════════════════════════════════════════════════════════════════════
   KEYWORD MATCHER
   ══════════════════════════════════════════════════════════════════════════ */
const MATCH_RULES = [
  { template: "barChart", patterns: [/\bchart\b/, /\btrend line/, /\bdata vis/] },
  { template: "bodySystem", patterns: [/\banatomy\b/, /\bvagus nerve/, /\benteric/, /\bcross-section.*gut/, /\bdigestive.*stage/, /\bmouth.*stomach/, /\borgan\b/] },
  { template: "vennOverlap", patterns: [/\bvenn\b/, /\btwo brands.*one/, /\bwhat.*miss/, /\boverlap/] },
  { template: "funnelNarrow", patterns: [/\bfunnel\b/, /\bnarrowing\b/, /\belimination.*trap/] },
  { template: "pyramidHierarchy", patterns: [/\bpyramid\b/, /\bhierarchy\b/, /\btier\b/, /\branked\b/, /\blevel\b.*\bbase/] },
  { template: "circularPlate", patterns: [/\bplate\b.*\bdivid/, /\bplate\b.*\bsection/, /\bpie\b/, /\bwheel\b/, /\bseasonal cycle/, /\bquadrant\b/, /\bcircular.*diagram/] },
  { template: "timelineSequence", patterns: [/\btimeline\b/, /\bphase\b/, /\bschedule\b/, /\bdaily.*rhythm/, /\bmorning.*evening/, /\bthree.*phase/, /\bday\s*[1-9]/, /\bweek\s*[1-9]/, /\b30.*day/, /\b28.*day/] },
  { template: "flowProcess", patterns: [/\bpathway\b/, /\bprocess\b/, /\bfermentation\b/, /\bcascade\b/, /\bchain\b/, /\bconversion\b/, /\bcycle\b.*\bdiagram/, /\bvicious\b.*\bcycle/, /\bloop\b/, /\bstep\b.*\bstep/] },
  { template: "comparisonSplit", patterns: [/\bsplit\b/, /\bvs\b/, /\bversus\b/, /\bcontrast\b/, /\bleft.*right/, /\bcomparison\b/, /\bbefore.*after/, /\bdepleted.*thriving/, /\bmonoculture.*diverse/, /\bold approach.*new/] },
  { template: "radialHub", patterns: [/\bradial\b/, /\bhub\b/, /\bcentral.*connect/, /\boutput map/, /\bradiating\b/, /\bimpact.*on\b/, /\bdownstream\b/, /\bconnected.*to\b.*\d/] },
  { template: "networkMap", patterns: [/\bnetwork\b/, /\binterconnect/, /\bnodes\b/, /\bmycelium\b/, /\bweb\b.*\bconnect/, /\becosystem\b.*\bmap/] },
  { template: "referenceCard", patterns: [/\breference\b/, /\bcheat\s*sheet/, /\bchecklist\b/, /\bscoring\b/, /\bindex\b.*\bfood/, /\bpractical\b.*\bguide/, /\bquick\b.*\bguide/, /\bshopping\b.*\blist/] },
  { template: "gridPanels", patterns: [/\bgrid\b/, /\bpanel/, /\bcategor/, /\bcard\b/, /\btypes\b.*\bfood/, /\bfood.*source/, /\beach.*shown/, /\bsix|four|eight|three|twelve|seven.*panel/, /\b(meal|food|tip|strategy|question).*\bcard/, /\bexample\b.*\b(meal|plate|day)/, /\bguide\b/] },
  { template: "sceneLandscape", patterns: [/\blandscape\b/, /\bscene\b/, /\bpath\b.*\bforward/, /\bspread\b/, /\bgarden\b/, /\bsoil\b/, /\bmetaphor\b/, /\bopening/, /\bclosing\b.*\bspread/, /\bperson\b.*\bstand/, /\bsupermarket/] },
]

const FALLBACK_BY_TYPE = {
  infographic: "gridPanels",
  diagram: "flowProcess",
  illustration: "sceneLandscape",
  chart: "barChart",
  photo: "sceneLandscape",
}

function matchTemplate(ideaText, type) {
  const text = ideaText.toLowerCase()
  for (const rule of MATCH_RULES) {
    if (rule.patterns.some((p) => p.test(text))) return rule.template
  }
  return FALLBACK_BY_TYPE[type] || "gridPanels"
}

/* ══════════════════════════════════════════════════════════════════════════
   MDX PARSER — extract all ImagePlaceholder tags
   ══════════════════════════════════════════════════════════════════════════ */
function parsePlaceholders(content) {
  const placeholders = []
  let searchFrom = 0
  let index = 0

  while (true) {
    const tagStart = content.indexOf("<ImagePlaceholder", searchFrom)
    if (tagStart === -1) break

    // Find the closing />
    const tagEnd = content.indexOf("/>", tagStart)
    if (tagEnd === -1) break

    const fullTag = content.slice(tagStart, tagEnd + 2)
    index++

    const hasSrc = /\bsrc\s*=/.test(fullTag)
    const typeMatch = fullTag.match(/\btype\s*=\s*"([^"]*)"/)
    const ideaMatch = fullTag.match(/\bidea\s*=\s*"([^"]*)"/)
    const arMatch = fullTag.match(/\baspectRatio\s*=\s*"([^"]*)"/)

    placeholders.push({
      index,
      hasSrc,
      type: typeMatch ? typeMatch[1] : "infographic",
      idea: ideaMatch ? ideaMatch[1] : "",
      aspectRatio: arMatch ? arMatch[1] : "wide",
      tagStart,
      tagEnd: tagEnd + 2,
    })

    searchFrom = tagEnd + 2
  }

  return placeholders
}

/* ══════════════════════════════════════════════════════════════════════════
   SVG BUILDER
   ══════════════════════════════════════════════════════════════════════════ */
function buildContentSvg(chapterNum, placeholderIndex, templateName, aspectRatio) {
  const config = CHAPTER_COLORS.find((c) => c.ch === chapterNum)
  const { primary, secondary } = config
  const { W, H } = DIMENSIONS[aspectRatio] || DIMENSIONS.wide

  const seed = chapterNum * 10000 + placeholderIndex * 137 + 31
  const rng = mulberry32(seed)

  const cx = W / 2, cy = H / 2
  let defs = ""
  let body = ""

  // Background gradient
  const gradId = `bg-${chapterNum}-${placeholderIndex}`
  defs += `  <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${primary}" stop-opacity="0.05"/>
    <stop offset="100%" stop-color="${secondary}" stop-opacity="0.03"/>
  </linearGradient>\n`
  body += `  <rect width="${W}" height="${H}" fill="url(#${gradId})"/>\n`

  // 1-2 background blobs (lighter than heroes)
  const blobCount = 1 + (placeholderIndex % 2)
  for (let i = 0; i < blobCount; i++) {
    const bx = W * 0.15 + rng() * W * 0.7
    const by = H * 0.15 + rng() * H * 0.7
    const br = 80 + rng() * 120
    const col = i % 2 === 0 ? primary : secondary
    body += `  <path d="${organicBlob(bx, by, br, rng)}" fill="${col}" opacity="${(0.03 + rng() * 0.04).toFixed(2)}"/>\n`
  }

  // Light decorative dots
  body += decorativeDots(6 + Math.floor(rng() * 6), 60, 40, W - 60, H - 40, 1.5, 4, primary, 0.06 + rng() * 0.05, rng)

  // Template content
  const templateFn = TEMPLATES[templateName]
  if (templateFn) {
    body += templateFn(cx, cy, W, H, primary, secondary, rng)
  }
  body += "\n"

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none">
<defs>
${defs}</defs>
${body}</svg>`
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN
   ══════════════════════════════════════════════════════════════════════════ */
console.log("Generating content SVGs for all remaining placeholders...\n")

let totalGenerated = 0
const templateCounts = {}

for (let ch = 1; ch <= 25; ch++) {
  const mdxPath = path.join(CONTENT_DIR, `chapter-${ch}.mdx`)
  if (!fs.existsSync(mdxPath)) continue

  const content = fs.readFileSync(mdxPath, "utf-8")
  const placeholders = parsePlaceholders(content)
  let chapterGenerated = 0
  const chapterTemplates = []

  for (const ph of placeholders) {
    if (ph.hasSrc) continue // Skip hero and any already-processed

    const templateName = matchTemplate(ph.idea, ph.type)
    const fileName = `img-${ph.index}.svg`
    const dir = path.join(OUT_DIR, `ch${ch}`)
    fs.mkdirSync(dir, { recursive: true })

    const svg = buildContentSvg(ch, ph.index, templateName, ph.aspectRatio)
    fs.writeFileSync(path.join(dir, fileName), svg, "utf-8")

    chapterGenerated++
    totalGenerated++
    chapterTemplates.push(templateName)
    templateCounts[templateName] = (templateCounts[templateName] || 0) + 1
  }

  if (chapterGenerated > 0) {
    const uniqueTemplates = [...new Set(chapterTemplates)]
    console.log(`  ch${ch}: ${chapterGenerated} images (${uniqueTemplates.join(", ")})`)
  }
}

console.log(`\nDone! ${totalGenerated} content SVGs generated.`)
console.log("\nTemplate distribution:")
Object.entries(templateCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([name, count]) => console.log(`  ${name}: ${count}`))
