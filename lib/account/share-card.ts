/**
 * EatoBiotics — shareable Digital Twin card (pure Canvas 2D, no deps).
 *
 * Draws a 1080×1350 portrait card in the dark-stage brand language: layered
 * aura glows, the giant Food System Score, momentum, the three biotic bars and
 * the wordmark. Consumed by components/account/twin/share-twin.tsx, which
 * rasterises it for the Web Share API / PNG download.
 */

export interface ShareCardData {
  score: number
  delta: number
  momentumLabel: string
  biotics: { label: string; value: number; color: string }[]
}

export const SHARE_CARD_W = 1080
export const SHARE_CARD_H = 1350

const CREAM = "#FDFBF7"
const SERIF = "Georgia, 'Times New Roman', serif"
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif"

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function drawTwinCard(ctx: CanvasRenderingContext2D, data: ShareCardData): void {
  const W = SHARE_CARD_W
  const H = SHARE_CARD_H

  /* backdrop */
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, "#0B1607")
  bg.addColorStop(0.55, "#122208")
  bg.addColorStop(1, "#16290F")
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  /* ambient glows */
  const glow = (x: number, y: number, r: number, c: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, c)
    g.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }
  glow(140, 120, 480, "rgba(168,224,99,0.16)")
  glow(W - 120, 420, 540, "rgba(45,170,110,0.18)")
  glow(W / 2, H - 160, 520, "rgba(245,166,35,0.10)")

  /* central aura rings behind the score */
  const cx = W / 2
  const cy = 500
  glow(cx, cy, 360, "rgba(168,224,99,0.30)")
  glow(cx, cy, 220, "rgba(245,197,24,0.22)")

  /* eyebrow + title */
  ctx.textAlign = "center"
  ctx.fillStyle = "#A8E063"
  ctx.font = `800 30px ${SANS}`
  ctx.fillText("M Y   D I G I T A L   T W I N", cx, 150)
  ctx.fillStyle = CREAM
  ctx.font = `700 58px ${SERIF}`
  ctx.fillText("The Food System Inside Me", cx, 225)

  /* giant score */
  ctx.fillStyle = CREAM
  ctx.font = `700 300px ${SERIF}`
  ctx.fillText(String(data.score), cx, cy + 105)
  ctx.fillStyle = "rgba(253,251,247,0.4)"
  ctx.font = `600 44px ${SANS}`
  ctx.fillText("Food System Score / 100", cx, cy + 185)

  /* momentum chip */
  const chipText = data.delta > 0 ? `▲ +${data.delta} and improving` : data.momentumLabel
  ctx.font = `700 34px ${SANS}`
  const tw = ctx.measureText(chipText).width
  const chipW = tw + 84
  roundRect(ctx, cx - chipW / 2, cy + 230, chipW, 76, 38)
  ctx.fillStyle = "rgba(168,224,99,0.14)"
  ctx.fill()
  ctx.strokeStyle = "rgba(168,224,99,0.5)"
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.fillStyle = "#A8E063"
  ctx.fillText(chipText, cx, cy + 280)

  /* biotic bars */
  const barX = 170
  const barW = W - barX * 2
  let y = 930
  ctx.textAlign = "left"
  for (const b of data.biotics) {
    ctx.fillStyle = "rgba(253,251,247,0.75)"
    ctx.font = `800 28px ${SANS}`
    ctx.fillText(b.label.toUpperCase(), barX, y)
    ctx.textAlign = "right"
    ctx.fillStyle = b.color
    ctx.font = `700 34px ${SERIF}`
    ctx.fillText(String(b.value), barX + barW, y)
    ctx.textAlign = "left"
    roundRect(ctx, barX, y + 16, barW, 16, 8)
    ctx.fillStyle = "rgba(253,251,247,0.12)"
    ctx.fill()
    roundRect(ctx, barX, y + 16, Math.max(24, (Math.min(100, b.value) / 100) * barW), 16, 8)
    ctx.fillStyle = b.color
    ctx.fill()
    y += 92
  }

  /* footer wordmark */
  ctx.textAlign = "center"
  ctx.fillStyle = CREAM
  ctx.font = `700 40px ${SERIF}`
  ctx.fillText("EatoBiotics", cx, H - 110)
  ctx.fillStyle = "rgba(253,251,247,0.45)"
  ctx.font = `600 26px ${SANS}`
  ctx.fillText("The Food System Inside You · eatobiotics.com", cx, H - 62)
}
