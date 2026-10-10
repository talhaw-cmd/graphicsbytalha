import * as THREE from 'three'

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')] }
const tex = (c, opts = {}) => {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  Object.assign(t, opts)
  return t
}
function rng(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647) }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath() }

/* ---------- window view: far layer (sky, hills) and near layer (houses) ---------- */
export function farLayer(day) {
  const [c, g] = mk(1600, 800)
  const sky = g.createLinearGradient(0, 0, 0, 800)
  if (day) { sky.addColorStop(0, '#6db4f2'); sky.addColorStop(0.6, '#bfe3fb'); sky.addColorStop(1, '#f2f8ff') }
  else { sky.addColorStop(0, '#1d2759'); sky.addColorStop(0.45, '#56488a'); sky.addColorStop(0.75, '#e0805f'); sky.addColorStop(1, '#f6c27a') }
  g.fillStyle = sky; g.fillRect(0, 0, 1600, 800)
  const r = rng(7)
  // sun
  const sx = day ? 1150 : 520, sy = day ? 190 : 520
  const glow = g.createRadialGradient(sx, sy, 10, sx, sy, day ? 220 : 300)
  glow.addColorStop(0, day ? 'rgba(255,248,214,.95)' : 'rgba(255,214,150,.95)'); glow.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = glow; g.fillRect(0, 0, 1600, 800)
  g.fillStyle = day ? '#fffbe6' : '#ffe3b0'; g.beginPath(); g.arc(sx, sy, day ? 46 : 54, 0, 7); g.fill()
  // clouds
  for (let i = 0; i < 7; i++) {
    const x = r() * 1600, y = 80 + r() * 260, w = 120 + r() * 200
    g.fillStyle = day ? 'rgba(255,255,255,.85)' : 'rgba(255,190,170,.35)'
    for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x + k * w * 0.22, y + (k % 2) * 10, w * 0.3, 22 + r() * 10, 0, 0, 7); g.fill() }
  }
  // hills + a distant cone
  g.fillStyle = day ? '#8db5c9' : '#4a4379'
  g.beginPath(); g.moveTo(0, 800); g.lineTo(0, 560)
  for (let x = 0; x <= 1600; x += 40) g.lineTo(x, 540 + Math.sin(x * 0.006) * 32 + Math.sin(x * 0.017 + 1) * 14)
  g.lineTo(1600, 800); g.fill()
  g.fillStyle = day ? '#6f9bb4' : '#383266'
  g.beginPath(); g.moveTo(900, 640); g.lineTo(1190, 470); g.lineTo(1330, 470); g.lineTo(1620, 640); g.fill()
  g.fillStyle = day ? '#f6fbff' : '#cfb6c8'
  g.beginPath(); g.moveTo(1150, 494); g.lineTo(1190, 470); g.lineTo(1330, 470); g.lineTo(1372, 494); g.lineTo(1330, 484); g.lineTo(1290, 500); g.lineTo(1250, 484); g.lineTo(1210, 500); g.closePath(); g.fill()
  return tex(c)
}

export function nearLayer(day) {
  const [c, g] = mk(1600, 800)
  const r = rng(21)
  const wall = day ? '#efe8d6' : '#8a84a8', roof = day ? '#3a4d62' : '#262d4a', roofHi = day ? '#5c7691' : '#4a5380', ground = day ? '#7e8f76' : '#2c2d4a'
  g.fillStyle = ground; g.fillRect(0, 700, 1600, 100)
  const houses = [[40, 640, 230, 2], [320, 665, 190, 1], [560, 630, 250, 2], [880, 668, 180, 1], [1110, 640, 220, 2], [1380, 662, 200, 1]]
  houses.forEach(([x, base, w, fl]) => {
    const h = fl === 2 ? 150 : 88
    g.fillStyle = wall; g.fillRect(x, base - h + 70, w, h)
    // windows (shoji grid), lit at dusk
    const cols = Math.floor(w / 60)
    for (let f = 0; f < fl; f++) for (let k = 0; k < cols; k++) {
      const wx = x + 16 + k * ((w - 32) / cols), wy = base - h + 70 + 14 + f * 62
      g.fillStyle = day ? '#b9d3e4' : (r() > 0.35 ? '#ffd58a' : '#3b3b63'); g.fillRect(wx, wy, 34, 40)
      g.strokeStyle = day ? '#6b5a44' : '#1d1d30'; g.lineWidth = 2; g.strokeRect(wx, wy, 34, 40)
      g.beginPath(); g.moveTo(wx + 17, wy); g.lineTo(wx + 17, wy + 40); g.moveTo(wx, wy + 20); g.lineTo(wx + 34, wy + 20); g.stroke()
    }
    // hip roof with eaves and tile lines
    const top = base - h + 70, ov = 22
    g.fillStyle = roof
    g.beginPath(); g.moveTo(x - ov, top + 6); g.lineTo(x + w * 0.18, top - 46); g.lineTo(x + w * 0.82, top - 46); g.lineTo(x + w + ov, top + 6); g.closePath(); g.fill()
    g.strokeStyle = roofHi; g.lineWidth = 2
    for (let t = 1; t < 6; t++) { const ty = top - 46 + t * 9; g.beginPath(); g.moveTo(x + w * 0.18 - t * 5, ty); g.lineTo(x + w * 0.82 + t * 5, ty); g.stroke() }
    g.fillStyle = roofHi; g.fillRect(x + w * 0.18, top - 50, w * 0.64, 5)
    if (fl === 2) { g.fillStyle = roof; g.fillRect(x - ov * 0.6, top + 56, w + ov * 1.2, 8) }
  })
  // trees
  ;[[300, 650], [830, 640], [1330, 650]].forEach(([x, y]) => {
    g.fillStyle = day ? '#4f7a4c' : '#1f3a3d'
    for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(x + (r() - 0.5) * 60, y - 20 - r() * 50, 26 + r() * 14, 0, 7); g.fill() }
  })
  // utility pole and wires
  const pole = (x) => { g.fillStyle = day ? '#5a4a3a' : '#171626'; g.fillRect(x, 330, 9, 400); g.fillRect(x - 38, 360, 85, 7); g.fillRect(x - 28, 400, 65, 6) }
  pole(260); pole(1120)
  g.strokeStyle = day ? '#3a3a40' : '#12121e'; g.lineWidth = 2
  ;[[222, 362], [304, 362], [232, 403], [294, 403]].forEach(([ax, ay], i) => {
    g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo((ax + 1082 + (i % 2) * 80) / 2, ay + 70, 1082 + (i % 2) * 80, ay + 2); g.stroke()
    g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(ax - 90, ay + 50, -10, ay + 10); g.stroke()
  })
  return tex(c)
}

/* ---------- wood ---------- */
export function woodTex() {
  const [c, g] = mk(512, 256)
  g.fillStyle = '#b8814f'; g.fillRect(0, 0, 512, 256)
  const r = rng(3)
  for (let i = 0; i < 90; i++) {
    const y = r() * 256, a = 0.04 + r() * 0.1
    g.strokeStyle = r() > 0.5 ? `rgba(80,45,15,${a})` : `rgba(255,220,170,${a})`
    g.lineWidth = 1 + r() * 2
    g.beginPath(); g.moveTo(0, y)
    for (let x = 0; x <= 512; x += 64) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 3)
    g.stroke()
  }
  return tex(c, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping })
}

/* ---------- Rubik's cube stickers: graphic design icons ---------- */
export const CUBE_FACES = [
  { id: 'pen', bg: '#EE1C25', ink: '#ffffff' },
  { id: 'wheel', bg: '#F2B600', ink: '#1B1A22' },
  { id: 'type', bg: '#0088FF', ink: '#ffffff' },
  { id: 'layers', bg: '#28C37B', ink: '#1B1A22' },
  { id: 'crop', bg: '#F3EBDD', ink: '#1B1A22' },
  { id: 'pixels', bg: '#33305a', ink: '#F3EBDD' },
]
function icon(g, id, ink) {
  g.save(); g.translate(64, 64); g.strokeStyle = ink; g.fillStyle = ink; g.lineWidth = 6; g.lineJoin = 'round'; g.lineCap = 'round'
  if (id === 'pen') { // pen tool nib
    g.beginPath(); g.moveTo(0, -34); g.lineTo(20, 8); g.lineTo(8, 30); g.lineTo(-8, 30); g.lineTo(-20, 8); g.closePath(); g.stroke()
    g.beginPath(); g.moveTo(0, -34); g.lineTo(0, 0); g.stroke(); g.beginPath(); g.arc(0, 6, 5, 0, 7); g.fill()
  } else if (id === 'wheel') {
    const cols = ['#EE1C25', '#F26B1D', '#fff', '#28C37B', '#0088FF', '#7a3cff']
    for (let i = 0; i < 6; i++) { g.fillStyle = i === 2 ? '#1B1A22' : cols[i]; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 34, i * Math.PI / 3, (i + 1) * Math.PI / 3); g.closePath(); g.fill() }
    g.fillStyle = '#F2B600'; g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fill()
  } else if (id === 'type') {
    g.font = '900 64px Archivo, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Aa', 0, 4)
  } else if (id === 'layers') {
    ;[14, 0, -14].forEach((y, i) => { g.beginPath(); g.moveTo(0, y - 18); g.lineTo(34, y); g.lineTo(0, y + 18); g.lineTo(-34, y); g.closePath(); if (i === 2) g.fill(); else g.stroke() })
  } else if (id === 'crop') {
    g.lineWidth = 7; g.beginPath(); g.moveTo(-26, -40); g.lineTo(-26, 26); g.lineTo(40, 26); g.moveTo(-40, -26); g.lineTo(26, -26); g.lineTo(26, 40); g.stroke()
  } else {
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { if ((x + y * 2 + (y > 1 ? 1 : 0)) % 3 !== 1) g.fillRect(-36 + x * 18, -36 + y * 18, 15, 15) }
  }
  g.restore()
}
export function stickerTex(f) {
  const [c, g] = mk(128, 128)
  g.fillStyle = '#0c0b12'; g.fillRect(0, 0, 128, 128)
  g.fillStyle = f.bg; rr(g, 8, 8, 112, 112, 16); g.fill()
  icon(g, f.id, f.ink)
  return tex(c)
}

/* ---------- misc ---------- */
export function paperTex() {
  const [c, g] = mk(64, 64); g.fillStyle = '#efe6d2'; g.fillRect(0, 0, 64, 64)
  g.strokeStyle = 'rgba(120,100,70,.35)'; g.lineWidth = 1
  for (let y = 4; y < 64; y += 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke() }
  return tex(c, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping })
}
