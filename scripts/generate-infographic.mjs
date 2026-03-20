/**
 * EatoBiotics — 3 Biotics Framework Infographic Generator
 * Outputs: public/images/3-biotics-infographic.png (1200x1200)
 */

import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const FONTS = path.resolve(
  'C:/Users/almas/AppData/Roaming/Claude/local-agent-mode-sessions/skills-plugin/6f878f5c-1e0e-462f-9143-8dda4a75361f/3c58800b-8129-4815-8b0d-3d9e581d6efc/skills/canvas-design/canvas-fonts'
)

// Encode font to base64 for embedding
function fontB64(filename) {
  const buf = fs.readFileSync(path.join(FONTS, filename))
  return `data:font/truetype;base64,${buf.toString('base64')}`
}

// ── Fonts ─────────────────────────────────────────────────────────────────────
const YOUNG_SERIF  = fontB64('YoungSerif-Regular.ttf')
const INS_REG      = fontB64('InstrumentSans-Regular.ttf')
const INS_BOLD     = fontB64('InstrumentSans-Bold.ttf')
const INS_ITALIC   = fontB64('InstrumentSans-Italic.ttf')
const LORA_ITALIC  = fontB64('Lora-Italic.ttf')
const LORA_BOLD    = fontB64('Lora-Bold.ttf')

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  white:  '#FFFFFF',
  dark:   '#1A2E12',
  muted:  '#5A6E50',
  faint:  '#8FA882',
  border: '#E5E5E5',
  lime:   '#A8E063',
  green:  '#4CB648',
  teal:   '#2DAA6E',
  yellow: '#F5C518',
  orange: '#F5A623',
  limeBg:  '#F4FCEC',
  greenBg: '#EDFAE7',
  tealBg:  '#E6F7EF',
  limeDark:  '#6BA835',
  greenDark: '#2A8028',
  tealDark:  '#1A7A50',
}

// ── Layout constants ──────────────────────────────────────────────────────────
const W = 1200, H = 1200
const M = 56   // margin
const PANEL_W = (W - M * 2 - 24) / 3  // ~362px each, 12px gap
const GAP = 12
const PANEL_X = [M, M + PANEL_W + GAP, M + (PANEL_W + GAP) * 2]
const HEADER_H = 148   // accent top section of panel
const PANEL_Y = 182
const PANEL_H = 820
const R = 18   // border radius

// Leaf icon path (centered at 0,0, size ~46px)
function leafPath(cx, cy) {
  return `M ${cx} ${cy + 22}
    C ${cx - 22} ${cy + 6}, ${cx - 22} ${cy - 18}, ${cx} ${cy - 24}
    C ${cx + 22} ${cy - 18}, ${cx + 22} ${cy + 6}, ${cx} ${cy + 22} Z
    M ${cx} ${cy - 24} L ${cx} ${cy + 14}
    M ${cx - 12} ${cy - 6} Q ${cx} ${cy - 10} ${cx + 10} ${cy - 2}`
}

// Microbe icon — circle + 6 small outer circles
function microbeSVG(cx, cy) {
  const dots = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 90) * Math.PI / 180
    const r = 24
    const ox = cx + r * Math.cos(a), oy = cy + r * Math.sin(a)
    return `<circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="5" fill="white" opacity="0.9"/>`
  }).join('\n')
  return `<circle cx="${cx}" cy="${cy}" r="14" fill="white"/>
    ${dots}`
}

// Spark icon — 4-point star
function sparkPath(cx, cy) {
  const ro = 24, ri = 10
  let pts = []
  for (let i = 0; i < 8; i++) {
    const a = (i * 45 - 90) * Math.PI / 180
    const r = i % 2 === 0 ? ro : ri
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return `<polygon points="${pts.join(' ')}" fill="white"/>`
}

// Draw a panel's food rows
function xmlEsc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function foodRows(x, y, items, accent) {
  return items.map((item, i) => {
    const iy = y + i * 52
    return `
      <circle cx="${x + 8}" cy="${iy + 9}" r="5" fill="${accent}"/>
      <text x="${x + 22}" y="${iy + 14}" font-family="InstrumentSans" font-size="18" fill="${C.dark}">${xmlEsc(item)}</text>
    `
  }).join('\n')
}

const panels = [
  {
    accent: C.lime, accentDark: C.limeDark, bg: C.limeBg,
    title: 'Prebiotics',
    tagline: 'Feed your bacteria',
    icon: 'leaf',
    foods: ['Garlic', 'Onions', 'Oats', 'Bananas', 'Asparagus'],
    micro: 'Fibre that feeds good gut bacteria',
  },
  {
    accent: C.green, accentDark: C.greenDark, bg: C.greenBg,
    title: 'Probiotics',
    tagline: 'Add live cultures',
    icon: 'microbe',
    foods: ['Yogurt', 'Kimchi', 'Sauerkraut', 'Kefir'],
    micro: 'Live bacteria that support your gut',
  },
  {
    accent: C.teal, accentDark: C.tealDark, bg: C.tealBg,
    title: 'Postbiotics',
    tagline: 'Harvest the benefits',
    icon: 'spark',
    foods: ['Short-chain fatty acids', 'B & K Vitamins', 'Neurotransmitters'],
    micro: 'Beneficial compounds from your gut bacteria',
  },
]

function panelSVG(p, idx) {
  const px = PANEL_X[idx]
  const py = PANEL_Y

  const iconCx = px + PANEL_W / 2
  const iconCy = py + HEADER_H / 2

  let iconSVG = ''
  if (p.icon === 'leaf') {
    iconSVG = `<path d="${leafPath(iconCx, iconCy)}" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
  } else if (p.icon === 'microbe') {
    iconSVG = microbeSVG(iconCx, iconCy)
  } else {
    iconSVG = sparkPath(iconCx, iconCy)
  }

  const titleY  = py + HEADER_H + 42
  const tagY    = titleY + 50
  const divY    = tagY + 32
  const numFoods = p.foods.length
  // Center food items block in available body space
  const bodyStart = divY + 28
  const bodyEnd = py + PANEL_H - 70
  const itemsH = numFoods * 52
  const foodsYAdj = bodyStart + Math.max(0, (bodyEnd - bodyStart - itemsH) / 2)
  const microY  = py + PANEL_H - 44

  const foodSVG = foodRows(px + 28, foodsYAdj, p.foods, p.accent)

  // Step number in header corner
  const stepNum = String(idx + 1).padStart(2, '0')

  return `
    <!-- Panel ${idx + 1} background -->
    <rect x="${px}" y="${py}" width="${PANEL_W}" height="${PANEL_H}" rx="${R}" fill="${p.bg}"/>

    <!-- Accent header -->
    <rect x="${px}" y="${py}" width="${PANEL_W}" height="${HEADER_H}" rx="${R}" fill="${p.accent}"/>
    <rect x="${px}" y="${py + HEADER_H - R}" width="${PANEL_W}" height="${R}" fill="${p.accent}"/>

    <!-- Step number -->
    <text x="${px + PANEL_W - 20}" y="${py + 28}" text-anchor="end"
      font-family="InstrumentSans" font-weight="bold" font-size="13"
      fill="white" fill-opacity="0.5" letter-spacing="1">${stepNum}</text>

    <!-- Icon -->
    <circle cx="${iconCx}" cy="${iconCy}" r="30" fill="white" fill-opacity="0.15"/>
    ${iconSVG}

    <!-- Title -->
    <text x="${px + PANEL_W / 2}" y="${titleY}" text-anchor="middle"
      font-family="YoungSerif" font-size="40" fill="${C.dark}">${p.title}</text>

    <!-- Tagline -->
    <text x="${px + PANEL_W / 2}" y="${tagY}" text-anchor="middle"
      font-family="LoraItalic" font-size="17" fill="${C.muted}">${xmlEsc(p.tagline)}</text>

    <!-- Divider -->
    <line x1="${px + 28}" y1="${divY}" x2="${px + PANEL_W - 28}" y2="${divY}" stroke="${C.border}" stroke-width="1"/>

    <!-- Foods -->
    ${foodSVG}

    <!-- Micro text -->
    <text x="${px + PANEL_W / 2}" y="${microY}" text-anchor="middle"
      font-family="InstrumentSans" font-size="13" fill="${C.faint}">${xmlEsc(p.micro)}</text>

    <!-- Bottom accent pill -->
    <rect x="${px + PANEL_W/2 - 32}" y="${py + PANEL_H - 14}" width="64" height="5" rx="2.5" fill="${p.accent}" fill-opacity="0.6"/>

    <!-- Panel border (subtle) -->
    <rect x="${px}" y="${py}" width="${PANEL_W}" height="${PANEL_H}" rx="${R}" fill="none" stroke="${C.border}" stroke-width="1"/>
  `
}

// ── Pill bar ──────────────────────────────────────────────────────────────────
const PILL_COLORS = [C.lime, C.green, C.teal, C.yellow, C.orange]
const PILL_W = 72, PILL_H = 8, PILL_GAP = 10
const pillsTotal = PILL_COLORS.length * PILL_W + (PILL_COLORS.length - 1) * PILL_GAP
const pillStartX = (W - pillsTotal) / 2
const STRIP_Y = PANEL_Y + PANEL_H + 30

const pillsSVG = PILL_COLORS.map((col, i) => {
  const px = pillStartX + i * (PILL_W + PILL_GAP)
  return `<rect x="${px}" y="${STRIP_Y}" width="${PILL_W}" height="${PILL_H}" rx="4" fill="${col}"/>`
}).join('\n')

// ── Full SVG ──────────────────────────────────────────────────────────────────
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <style>
    @font-face { font-family: 'YoungSerif'; src: url('${YOUNG_SERIF}'); font-weight: normal; }
    @font-face { font-family: 'InstrumentSans'; src: url('${INS_REG}'); font-weight: normal; }
    @font-face { font-family: 'InstrumentSans'; src: url('${INS_BOLD}'); font-weight: bold; }
    @font-face { font-family: 'InstrumentSansItalic'; src: url('${INS_ITALIC}'); font-style: italic; }
    @font-face { font-family: 'LoraItalic'; src: url('${LORA_ITALIC}'); font-style: italic; }
    @font-face { font-family: 'LoraBold'; src: url('${LORA_BOLD}'); font-weight: bold; }
  </style>

  <!-- Soft drop shadow filter -->
  <filter id="panelShadow" x="-4%" y="-2%" width="108%" height="107%">
    <feDropShadow dx="0" dy="3" stdDeviation="8" flood-color="#000000" flood-opacity="0.07"/>
  </filter>

  <!-- Top gradient stripe -->
  <linearGradient id="topStripe" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%"   stop-color="${C.lime}"/>
    <stop offset="25%"  stop-color="${C.green}"/>
    <stop offset="50%"  stop-color="${C.teal}"/>
    <stop offset="75%"  stop-color="${C.yellow}"/>
    <stop offset="100%" stop-color="${C.orange}"/>
  </linearGradient>
</defs>

<!-- ── Background ── -->
<rect width="${W}" height="${H}" fill="${C.white}"/>

<!-- ── Top gradient stripe (8px) ── -->
<rect x="0" y="0" width="${W}" height="8" fill="url(#topStripe)"/>

<!-- ── Header ── -->
<!-- Brand dot row -->
${PILL_COLORS.map((col, i) => `<circle cx="${M + i * 18}" cy="36" r="5" fill="${col}"/>`).join('\n')}
<text x="${M + 5 * 18 + 10}" y="41" font-family="InstrumentSans" font-weight="bold" font-size="11"
  fill="${C.muted}" letter-spacing="2">EATOBIOTICS</text>

<!-- Main title -->
<text x="${W / 2}" y="90" text-anchor="middle"
  font-family="YoungSerif" font-size="58" fill="${C.dark}">The 3 Biotics Framework</text>

<!-- Subtitle rule + text -->
<line x1="${M}" y1="116" x2="${W / 2 - 130}" y2="116" stroke="${C.border}" stroke-width="1"/>
<text x="${W / 2}" y="120" text-anchor="middle"
  font-family="LoraItalic" font-size="17" fill="${C.muted}">Feed · Add · Harvest</text>
<line x1="${W / 2 + 130}" y1="116" x2="${W - M}" y2="116" stroke="${C.border}" stroke-width="1"/>

<!-- ── Panel shadows (drawn first, behind panels) ── -->
${panels.map((_, i) => {
  const px = PANEL_X[i]
  return `<rect x="${px + 2}" y="${PANEL_Y + 4}" width="${PANEL_W}" height="${PANEL_H}" rx="${R}" fill="#00000011"/>`
}).join('\n')}

<!-- ── Panels ── -->
${panels.map((p, i) => panelSVG(p, i)).join('\n')}

<!-- ── Bottom strip ── -->
${pillsSVG}

<!-- Brand tagline -->
<text x="${W / 2}" y="${STRIP_Y + 36}" text-anchor="middle"
  font-family="LoraItalic" font-size="20" fill="${C.dark}">The food system inside you.</text>

<!-- URL -->
<text x="${W / 2}" y="${STRIP_Y + 64}" text-anchor="middle"
  font-family="InstrumentSans" font-size="15" fill="${C.faint}" letter-spacing="1">eatobiotics.com</text>

</svg>`

// ── Render to PNG ─────────────────────────────────────────────────────────────
const outDir = path.join(ROOT, 'public/images')
fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, '3-biotics-infographic.png')

await sharp(Buffer.from(svg))
  .resize(W, H)
  .png({ quality: 100, compressionLevel: 6 })
  .toFile(outPath)

console.log(`✅ Saved to ${outPath}`)
