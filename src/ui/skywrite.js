// Plane flight that writes "Submit" in smoke. Pure canvas + rAF, no libraries.
// Glyph space is 480 x 120 (baseline y=120, x-height y=50, ascender y=0).
const STROKES = [
  // S
  [[66, 18], [50, 4], [30, 0], [10, 10], [6, 32], [18, 50], [40, 60], [62, 72], [68, 94], [58, 114], [36, 120], [14, 114], [4, 98]],
  // u
  [[96, 50], [97, 96], [108, 116], [128, 120], [146, 108], [154, 88], [154, 50], [155, 90], [156, 120]],
  // b
  [[196, 0], [196, 60], [196, 120], [196, 96], [208, 76], [230, 68], [250, 80], [256, 100], [246, 116], [224, 122], [204, 114]],
  // m
  [[292, 50], [292, 120], [292, 76], [300, 56], [316, 48], [330, 60], [332, 80], [332, 120], [332, 76], [340, 56], [356, 48], [370, 60], [372, 80], [372, 120]],
  // i stem and dot
  [[402, 52], [402, 120]],
  [[402, 26], [402, 30]],
  // t stem and cross
  [[440, 14], [440, 100], [448, 116], [462, 120], [474, 112]],
  [[424, 52], [466, 52]],
]

function spline(pts, steps = 10) {
  if (pts.length < 3) return pts.slice()
  const out = []
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ])
    }
  }
  out.push(pts[pts.length - 1])
  return out
}
const bez = (p0, p1, p2, p3, n = 40) => {
  const o = []
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t
    o.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]])
  }
  return o
}

// Build the whole route as evenly spaced samples [{x,y,pen,t}] with a time stamp for each.
export function buildRoute(vw, vh, start) {
  const wordW = Math.min(vw * 0.8, 760), k = wordW / 480
  const x0 = (vw - wordW) / 2, y0 = vh * 0.5 - 60 * k
  const g = (p) => [x0 + p[0] * k, y0 + p[1] * k]
  const segs = [] // {pts, pen, speed}
  const first = g(STROKES[0][0])
  segs.push({ pts: bez(start, [start[0] + vw * 0.28, start[1] - vh * 0.4], [first[0] + vw * 0.3, first[1] - vh * 0.2], first), pen: false, kind: 'in' })
  let cur = first
  STROKES.forEach((s, i) => {
    const pts = spline(s.map(g), 8)
    if (i > 0) {
      const a = cur, b = pts[0], mid = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 18 * k]
      segs.push({ pts: bez(a, mid, mid, b, 10), pen: false, kind: 'hop' })
    }
    segs.push({ pts, pen: true, kind: 'ink' }); cur = pts[pts.length - 1]
  })
  segs.push({ pts: bez(cur, [cur[0] + vw * 0.2, cur[1] - vh * 0.05], [vw * 0.9, vh * 0.2], [vw + 160, -140]), pen: false, kind: 'out' })

  // resample evenly
  const STEP = 3, samples = []
  let t = 0
  const speeds = { in: Math.max(vw, 700) * 0.85, hop: 520 * k + 200, ink: 0, out: Math.max(vw, 700) * 1.1 }
  let inkLen = 0
  segs.forEach((s) => { if (s.kind === 'ink') for (let i = 1; i < s.pts.length; i++) inkLen += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]) })
  speeds.ink = inkLen / 3.0
  segs.forEach((s) => {
    let carry = 0
    for (let i = 1; i < s.pts.length; i++) {
      const a = s.pts[i - 1], b = s.pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (!d) continue
      let at = STEP - carry
      while (at <= d) {
        const f = at / d
        t += STEP / speeds[s.kind]
        samples.push({ x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, pen: s.pen, t })
        at += STEP
      }
      carry = d - (at - STEP)
    }
  })
  return { samples, k, total: t }
}

let sprite = null
function puffSprite() {
  if (sprite) return sprite
  const c = document.createElement('canvas'); c.width = c.height = 64
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 2, 32, 32, 32)
  r.addColorStop(0, 'rgba(255,255,255,.95)'); r.addColorStop(0.55, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r; g.fillRect(0, 0, 64, 64)
  return (sprite = c)
}

// Runs the flight. Returns { cancel }. onWritten fires when the last smoke is laid; onDone when the plane has left.
export function fly({ canvas, plane, start, lite, onWritten, onDone }) {
  const vw = innerWidth, vh = innerHeight, dpr = Math.min(devicePixelRatio || 1, 1.5)
  canvas.width = vw * dpr; canvas.height = vh * dpr
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr)
  const { samples, k } = buildRoute(vw, vh, start)
  const puffs = [], R = 7.5 * k + 3, GAP = (lite ? 11 : 7) * k + 3
  const spr = puffSprite()
  let i = 0, raf = 0, t0 = 0, dist = GAP, ang = 0, lastPen = null, written = false, dead = false
  const lastInk = samples.map((s) => s.pen).lastIndexOf(true)

  function frame(now) {
    if (dead) return
    if (!t0) t0 = now
    const el = (now - t0) / 1000
    while (i < samples.length - 1 && samples[i].t < el) {
      const s = samples[i], p = samples[i - 1] || s
      if (s.pen) {
        dist += Math.hypot(s.x - p.x, s.y - p.y)
        if (dist >= GAP || lastPen === false) { dist = 0; puffs.push({ x: s.x + (Math.random() - 0.5) * 1.6, y: s.y + (Math.random() - 0.5) * 1.6, a: el }) }
      }
      lastPen = s.pen
      i++
    }
    if (!written && i > lastInk) { written = true; onWritten && onWritten() }
    // plane
    const s = samples[Math.min(i, samples.length - 1)], b = samples[Math.min(i + 8, samples.length - 1)], a0 = samples[Math.max(i - 8, 0)]
    const target = Math.atan2(b.y - a0.y, b.x - a0.x)
    let d = target - ang; d = Math.atan2(Math.sin(d), Math.cos(d)); ang += d * 0.18
    plane.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-50%) rotate(${ang}rad)`
    // smoke
    ctx.clearRect(0, 0, vw, vh)
    for (const p of puffs) {
      const age = el - p.a
      const grow = Math.min(1, age / 0.4), r = R * (0.45 + 0.55 * grow) * (1 + Math.min(age, 6) * 0.025)
      ctx.globalAlpha = Math.min(1, age / 0.12) * 0.9
      ctx.drawImage(spr, p.x - r, p.y - r - Math.min(age, 6) * 1.5, r * 2, r * 2)
    }
    ctx.globalAlpha = 1
    if (i >= samples.length - 1) { dead = true; onDone && onDone(); return }
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
  return { cancel() { dead = true; cancelAnimationFrame(raf) } }
}
