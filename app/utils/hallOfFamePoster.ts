/**
 * The Hall of Fame poster: one category's winners drawn onto a square canvas, ready to download and post.
 * Drawn in the browser from the board that is already on screen, so there is nothing to host or render on the server.
 */

export interface PosterLeader {
  rank: number
  name: string
  program: string | null
  /** Already worded: "12 books". */
  amount: string
}

export interface PosterData {
  /** "October": the month the board covers. */
  month: string
  /** "This month", "Right now" or "All time". */
  period: string
  title: string
  blurb: string
  leaders: PosterLeader[]
}

export const POSTER_SIZE = 1080

// The app's palette: crimson ground, parchment text, oak and leather for the medals.
const CRIMSON = '#34000b'
const CRIMSON_DEEP = '#240007'
const PARCHMENT = '#f6f2ea'
const OAK = '#d4a574'
const MEDAL: Record<number, { fill: string; text: string }> = {
  1: { fill: '#d4a574', text: '#34000b' },
  2: { fill: '#d6d3d1', text: '#34000b' },
  3: { fill: '#c29b87', text: '#34000b' },
}

const FONT = "Raleway, 'Segoe UI', system-ui, sans-serif"

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** Shrinks the font until the text fits the width (never below `min`). */
function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, maxWidth: number, min = 22): number {
  let px = size
  ctx.font = `${weight} ${px}px ${FONT}`
  while (px > min && ctx.measureText(text).width > maxWidth) {
    px -= 2
    ctx.font = `${weight} ${px}px ${FONT}`
  }
  return px
}

/** Breaks text into at most `maxLines` lines that fit the width; the last line ends in "…" if it was cut. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next
    } else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    kept[maxLines - 1] = `${kept[maxLines - 1]!.replace(/[\s.,;:]+$/, '')}…`
    return kept
  }
  return lines
}

export async function drawPoster(canvas: HTMLCanvasElement, data: PosterData, logoSrc: string): Promise<void> {
  const S = POSTER_SIZE
  const M = 80

  // The canvas can't use a font that hasn't loaded yet, so ask for the weights first.
  if (typeof document !== 'undefined' && document.fonts) {
    await Promise.all([500, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px Raleway`).catch(() => [])))
  }
  const logo = await loadImage(logoSrc)

  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, S, S)
  ctx.textBaseline = 'alphabetic'

  // Ground: crimson with a soft glow behind the title.
  const ground = ctx.createLinearGradient(0, 0, 0, S)
  ground.addColorStop(0, CRIMSON)
  ground.addColorStop(1, CRIMSON_DEEP)
  ctx.fillStyle = ground
  ctx.fillRect(0, 0, S, S)
  const glow = ctx.createRadialGradient(S * 0.8, 120, 20, S * 0.8, 120, 620)
  glow.addColorStop(0, 'rgba(212,165,116,0.22)')
  glow.addColorStop(1, 'rgba(212,165,116,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, S, S)

  // Header: logo and library name on the left, the tag on the right.
  if (logo) ctx.drawImage(logo, M, 62, 68, 68)
  ctx.fillStyle = PARCHMENT
  ctx.font = `800 32px ${FONT}`
  ctx.textAlign = 'left'
  ctx.fillText('EntryPoint', M + 88, 94)
  ctx.fillStyle = 'rgba(246,242,234,0.7)'
  ctx.font = `500 22px ${FONT}`
  ctx.fillText('STI College Davao Library', M + 88, 124)

  ctx.textAlign = 'right'
  ctx.fillStyle = OAK
  ctx.font = `700 24px ${FONT}`
  ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '4px'
  ctx.fillText('HALL OF FAME', S - M, 106)
  ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px'
  ctx.textAlign = 'left'

  // Rule under the header.
  ctx.fillStyle = 'rgba(246,242,234,0.16)'
  ctx.fillRect(M, 168, S - M * 2, 2)

  // Period, category title and what it rewards.
  ctx.fillStyle = OAK
  ctx.font = `700 26px ${FONT}`
  ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '3px'
  ctx.fillText(data.period.toUpperCase() + (data.period === data.month ? '' : ` · ${data.month.toUpperCase()}`), M, 232)
  ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px'

  ctx.fillStyle = PARCHMENT
  fit(ctx, data.title, 800, 88, S - M * 2, 48)
  ctx.fillText(data.title, M, 322)

  ctx.fillStyle = 'rgba(246,242,234,0.78)'
  ctx.font = `500 29px ${FONT}`
  wrap(ctx, data.blurb, S - M * 2, 2).forEach((line, i) => ctx.fillText(line, M, 372 + i * 38))

  // Winners, centred in the space between the heading and the footer.
  const rowH = 148
  const gap = 20
  const count = Math.min(data.leaders.length, 3)
  const regionTop = 440
  const regionH = 520
  const stackH = count * rowH + (count - 1) * gap
  let y = regionTop + Math.max(0, (regionH - stackH) / 2)

  for (const leader of data.leaders.slice(0, 3)) {
    const first = leader.rank === 1
    const medal = MEDAL[leader.rank] ?? MEDAL[3]!

    ctx.beginPath()
    ctx.roundRect(M, y, S - M * 2, rowH, 28)
    ctx.fillStyle = first ? 'rgba(246,242,234,0.14)' : 'rgba(246,242,234,0.07)'
    ctx.fill()
    if (first) {
      ctx.lineWidth = 2
      ctx.strokeStyle = 'rgba(212,165,116,0.7)'
      ctx.stroke()
    }

    // Place medal.
    const cx = M + 22 + 46
    const cy = y + rowH / 2
    ctx.beginPath()
    ctx.arc(cx, cy, 46, 0, Math.PI * 2)
    ctx.fillStyle = medal.fill
    ctx.fill()
    ctx.fillStyle = medal.text
    ctx.font = `800 46px ${FONT}`
    ctx.textAlign = 'center'
    ctx.fillText(String(leader.rank), cx, cy + 16)

    // Amount on the right, then the name and program in what is left.
    ctx.textAlign = 'right'
    ctx.fillStyle = OAK
    ctx.font = `800 36px ${FONT}`
    const amountW = ctx.measureText(leader.amount).width
    ctx.fillText(leader.amount, S - M - 30, cy + 13)

    ctx.textAlign = 'left'
    const textX = M + 22 + 92 + 26
    const maxW = S - M - 30 - amountW - 28 - textX
    ctx.fillStyle = PARCHMENT
    fit(ctx, leader.name, 700, 42, maxW, 24)
    ctx.fillText(leader.name, textX, leader.program ? cy - 6 : cy + 14)
    if (leader.program) {
      ctx.fillStyle = 'rgba(246,242,234,0.72)'
      fit(ctx, leader.program, 500, 27, maxW, 18)
      ctx.fillText(leader.program, textX, cy + 34)
    }

    y += rowH + gap
  }

  // Footer.
  ctx.fillStyle = 'rgba(246,242,234,0.16)'
  ctx.fillRect(M, 984, S - M * 2, 2)
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(246,242,234,0.85)'
  ctx.font = `600 25px ${FONT}`
  ctx.fillText('Congratulations from the STI College Davao Library', S / 2, 1034)
  ctx.textAlign = 'left'
}
