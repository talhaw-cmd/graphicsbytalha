import { Component, Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import Cube, { cubeCtl } from './Cube'
import { farLayer, nearLayer, woodTex, paperTex } from './textures'
import { useStore } from '../state/store'
import { focus, openBook } from '../state/flow'
import './desk.css'

const TOP = 0.86 // desk surface height

/* ---------- helpers ---------- */
function Hot({ name, onClick, children, lift = 1.04, ...rest }) {
  const g = useRef(), setHover = useStore((s) => s.setHover), gl = useThree((s) => s.gl)
  const over = useRef(false)
  useFrame((_, dt) => { const t = over.current ? lift : 1; const k = 1 - Math.pow(0.0005, dt); g.current.scale.x += (t - g.current.scale.x) * k; g.current.scale.y = g.current.scale.z = g.current.scale.x })
  return (
    <group ref={g} {...rest}
      onPointerOver={(e) => { e.stopPropagation(); over.current = true; gl.domElement.style.cursor = 'pointer'; setHover(name) }}
      onPointerOut={() => { over.current = false; gl.domElement.style.cursor = ''; setHover(null) }}
      onClick={(e) => { e.stopPropagation(); onClick && onClick(e) }}>
      {children}
    </group>
  )
}
const Std = (p) => <meshStandardMaterial roughness={0.75} {...p} />

const blobTex = (() => { let t; return () => {
  if (t) return t
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')
  const r = g.createRadialGradient(32, 32, 2, 32, 32, 32); r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); t = new THREE.CanvasTexture(c); return t } })()
const Shadow = ({ x, z, w = 0.8, d = 0.8, y = 0.003 }) => (
  <mesh rotation-x={-Math.PI / 2} position={[x, y, z]}><planeGeometry args={[w, d]} /><meshBasicMaterial map={blobTex()} transparent depthWrite={false} /></mesh>
)

/* ---------- window and view ---------- */
function Backdrop({ evening }) {
  const t = useMemo(() => ({ fd: farLayer(true), fn: farLayer(false), nd: nearLayer(true), nn: nearLayer(false) }), [])
  const m = useRef({ v: evening ? 1 : 0 }), refs = useRef({})
  useFrame((_, dt) => {
    const target = evening ? 1 : 0, k = 1 - Math.pow(0.02, dt)
    m.current.v += (target - m.current.v) * k
    const v = m.current.v, r = refs.current
    if (r.fn) { r.fn.opacity = v; r.nn.opacity = v; r.nd.opacity = 1 - v }
  })
  const mat = (map, key, op) => <meshBasicMaterial ref={(x) => { if (x) refs.current[key] = x }} map={map} transparent opacity={op} toneMapped={false} depthWrite={false} />
  return (
    <>
      <mesh position={[0, 3.05, -3.4]}><planeGeometry args={[12, 6]} />{<meshBasicMaterial map={t.fd} toneMapped={false} />}</mesh>
      <mesh position={[0, 3.05, -3.39]}><planeGeometry args={[12, 6]} />{mat(t.fn, 'fn', 1)}</mesh>
      <mesh position={[0, 2.9, -1.9]}><planeGeometry args={[6.8, 3.4]} />{mat(t.nd, 'nd', 0)}</mesh>
      <mesh position={[0, 2.9, -1.89]}><planeGeometry args={[6.8, 3.4]} />{mat(t.nn, 'nn', 1)}</mesh>
    </>
  )
}

function Room() {
  const wood = useMemo(() => { const w = woodTex(); w.repeat.set(2.5, 1); return w }, [])
  const wallC = '#d8c7a3', frame = '#6b4a2f'
  const W = 1.95, B = 1.5, T = 3.25
  return (
    <group>
      <mesh position={[0, 0.0, 3]} rotation-x={-Math.PI / 2}><planeGeometry args={[14, 16]} /><Std color="#6b5238" /></mesh>
      {/* wall around the opening */}
      <mesh position={[-(W + 3), 6, -1]}><boxGeometry args={[6, 12, 0.12]} /><Std color={wallC} /></mesh>
      <mesh position={[W + 3, 6, -1]}><boxGeometry args={[6, 12, 0.12]} /><Std color={wallC} /></mesh>
      <mesh position={[0, (T + 12) / 2, -1]}><boxGeometry args={[2 * W, 12 - T, 0.12]} /><Std color={wallC} /></mesh>
      <mesh position={[0, B / 2, -1]}><boxGeometry args={[2 * W, B, 0.12]} /><Std color="#c3ad84" /></mesh>
      {/* frame, mullions, sill */}
      <mesh position={[-W, (B + T) / 2, -0.95]}><boxGeometry args={[0.1, T - B, 0.16]} /><Std color={frame} /></mesh>
      <mesh position={[W, (B + T) / 2, -0.95]}><boxGeometry args={[0.1, T - B, 0.16]} /><Std color={frame} /></mesh>
      <mesh position={[0, T, -0.95]}><boxGeometry args={[2 * W + 0.1, 0.1, 0.16]} /><Std color={frame} /></mesh>
      <mesh position={[0, B, -0.95]}><boxGeometry args={[2 * W + 0.1, 0.1, 0.16]} /><Std color={frame} /></mesh>
      <mesh position={[0, B + 0.03, -0.78]}><boxGeometry args={[2 * W + 0.3, 0.06, 0.36]} /><Std color="#8a6542" /></mesh>
      <mesh position={[0, (B + T) / 2, -0.95]}><boxGeometry args={[0.06, T - B, 0.1]} /><Std color={frame} /></mesh>
      <mesh position={[-W / 2, (B + T) / 2 + 0.3, -0.95]}><boxGeometry args={[W, 0.05, 0.1]} /><Std color={frame} /></mesh>
      <mesh position={[W / 2, (B + T) / 2 + 0.3, -0.95]}><boxGeometry args={[W, 0.05, 0.1]} /><Std color={frame} /></mesh>
      {/* desk */}
      <mesh position={[0, TOP - 0.04, 0.2]}><boxGeometry args={[5, 0.08, 2]} /><Std map={wood} roughness={0.55} /></mesh>
      <mesh position={[0, TOP - 0.18, 1.14]}><boxGeometry args={[5, 0.2, 0.06]} /><Std color="#9a6c3f" /></mesh>
      <mesh position={[-2.42, 0.42, 0.2]}><boxGeometry args={[0.08, 0.84, 1.9]} /><Std color="#9a6c3f" /></mesh>
      <mesh position={[1.88, 0.42, 0.2]}><boxGeometry args={[1.1, 0.8, 1.9]} /><Std color="#a77647" /></mesh>
      {[0.58, 0.28].map((y) => (
        <group key={y}>
          <mesh position={[1.88, y, 1.16]}><boxGeometry args={[1.0, 0.24, 0.04]} /><Std color="#b8814f" /></mesh>
          <mesh position={[1.88, y, 1.2]}><boxGeometry args={[0.26, 0.03, 0.03]} /><Std color="#1B1A22" roughness={0.4} /></mesh>
        </group>
      ))}
    </group>
  )
}

/* ---------- glass: a pen-tool line drawn on the window ---------- */
const glass = { c: null, g: null, tex: null, run: null }
function Glass() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 460
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
    glass.c = c; glass.g = c.getContext('2d'); glass.tex = t; return t
  }, [])
  useFrame(() => {
    const r = glass.run; if (!r) return
    const g = glass.g, now = performance.now(), t = (now - r.t0) / 1000
    g.clearRect(0, 0, 1024, 460)
    const prog = Math.min(1, t / 1.5), fade = t > 2.6 ? Math.max(0, 1 - (t - 2.6) / 0.8) : 1
    g.globalAlpha = fade; g.strokeStyle = '#F3EBDD'; g.lineWidth = 6; g.lineCap = 'round'
    const pts = r.pts, n = Math.floor(prog * (pts.length - 1))
    g.beginPath(); pts.slice(0, n + 1).forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke()
    r.anchors.forEach(([x, y, at]) => { if (prog >= at) { g.fillStyle = '#F3EBDD'; g.strokeStyle = '#EE1C25'; g.lineWidth = 3; g.fillRect(x - 8, y - 8, 16, 16); g.strokeRect(x - 8, y - 8, 16, 16) } })
    g.globalAlpha = 1; glass.tex.needsUpdate = true
    if (t > 3.4) { g.clearRect(0, 0, 1024, 460); glass.tex.needsUpdate = true; glass.run = null }
  })
  return <mesh position={[0, 2.375, -0.9]}><planeGeometry args={[3.8, 1.7]} /><meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} /></mesh>
}
function drawOnGlass() {
  const r = Math.random, a = [[90, 90 + r() * 280], [330 + r() * 80, 60 + r() * 330], [640 + r() * 80, 60 + r() * 330], [940, 90 + r() * 280]]
  const pts = []
  for (let s = 0; s < 3; s++) {
    const p0 = a[s], p3 = a[s + 1]
    const p1 = [p0[0] + 120, p0[1] + (r() - 0.5) * 240], p2 = [p3[0] - 120, p3[1] + (r() - 0.5) * 240]
    for (let k = 0; k <= 30; k++) { const t = k / 30, u = 1 - t; pts.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]) }
  }
  glass.run = { t0: performance.now(), pts, anchors: a.map((p, i) => [p[0], p[1], i / 3]) }
}

/* ---------- the book on the desk ---------- */
function BookOnDesk() {
  const cover = useLoader(THREE.TextureLoader, '/pages/cover-900.webp')
  cover.colorSpace = THREE.SRGBColorSpace; cover.anisotropy = 4
  const paper = useMemo(() => { const p = paperTex(); p.repeat.set(1, 1); return p }, [])
  const g = useRef()
  useFrame(() => { if (g.current) g.current.rotation.y = -0.06 * (1 - focus.v) })
  const red = '#b8141b'
  const W = 1.05, D = 1.3
  return (
    <Hot name="book" onClick={() => openBook(1)} lift={1.03} position={[0, TOP, 0.28]}>
      <group ref={g} rotation-y={-0.06}>
        <Shadow x={0.03} z={0.04} w={1.3} d={1.5} />
        <mesh position={[0, 0.006, 0]}><boxGeometry args={[W, 0.012, D]} /><Std color={red} /></mesh>
        <mesh position={[0.012, 0.047, 0]}><boxGeometry args={[W - 0.04, 0.07, D - 0.04]} /><Std map={paper} /></mesh>
        <mesh position={[0, 0.088, 0]}>
          <boxGeometry args={[W, 0.012, D]} />
          {[red, red, null, red, red, red].map((c, i) => (c ? <Std key={i} attach={`material-${i}`} color={c} /> : <meshStandardMaterial key={i} attach={`material-${i}`} map={cover} roughness={0.5} />))}
        </mesh>
        <mesh position={[-W / 2 + 0.012, 0.047, 0]}><boxGeometry args={[0.03, 0.094, D]} /><Std color="#9d1017" /></mesh>
        <Html position={[0, 0.55, 0]} center zIndexRange={[20, 0]} className="book-prompt-wrap">
          <button className="book-prompt" onClick={() => openBook(1)}>Explore the book</button>
        </Html>
      </group>
    </Hot>
  )
}

/* ---------- props ---------- */
function Lamp({ evening, onToggle }) {
  const light = useRef(), head = useRef()
  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.02, dt), t = evening ? 1 : 0
    if (light.current) light.current.intensity += (t * 2.2 - light.current.intensity) * k
    if (head.current) head.current.emissiveIntensity += (t * 1.2 - head.current.emissiveIntensity) * k
  })
  const a = 0.3, b = 1.15, l1 = 0.55, l2 = 0.5
  const e = [-Math.sin(a) * l1, 0.05 + Math.cos(a) * l1], end = [e[0] - Math.sin(b) * l2, e[1] + Math.cos(b) * l2]
  return (
    <Hot name="lamp" onClick={onToggle} position={[1.75, TOP, -0.15]}>
      <Shadow x={0} z={0} w={0.7} d={0.7} />
      <mesh position={[0, 0.025, 0]}><cylinderGeometry args={[0.2, 0.24, 0.05, 28]} /><Std color="#1B1A22" roughness={0.4} /></mesh>
      <mesh position={[-Math.sin(a) * l1 / 2, 0.05 + Math.cos(a) * l1 / 2, 0]} rotation-z={a}><cylinderGeometry args={[0.016, 0.016, l1, 10]} /><Std color="#d9d4c7" metalness={0.4} roughness={0.4} /></mesh>
      <mesh position={[(e[0] + end[0]) / 2, (e[1] + end[1]) / 2, 0]} rotation-z={b}><cylinderGeometry args={[0.016, 0.016, l2, 10]} /><Std color="#d9d4c7" metalness={0.4} roughness={0.4} /></mesh>
      <mesh position={[e[0], e[1], 0]}><sphereGeometry args={[0.035, 12, 10]} /><Std color="#1B1A22" /></mesh>
      <mesh position={[end[0] - 0.05, end[1] - 0.06, 0]} rotation-z={0.25}>
        <cylinderGeometry args={[0.07, 0.24, 0.26, 28, 1, true]} />
        <meshStandardMaterial ref={head} color="#EE1C25" side={THREE.DoubleSide} roughness={0.5} emissive="#ffb066" emissiveIntensity={1.2} />
      </mesh>
      <pointLight ref={light} position={[end[0] - 0.05, end[1] - 0.22, 0.05]} color="#ffb877" intensity={2.2} distance={4.5} decay={1.6} />
    </Hot>
  )
}

function PenCup() {
  const pen = useRef()
  const colors = ['#EE1C25', '#F2B600', '#0088FF', '#1B1A22']
  const click = () => {
    drawOnGlass()
    if (pen.current) { gsap.fromTo(pen.current.position, { y: 0.17 }, { y: 0.42, duration: 0.3, yoyo: true, repeat: 1, ease: 'power2.out' }); gsap.fromTo(pen.current.rotation, { y: 0 }, { y: Math.PI * 2, duration: 0.6, ease: 'power2.inOut' }) }
  }
  return (
    <Hot name="pens" onClick={click} position={[1.3, TOP, 0.75]}>
      <Shadow x={0} z={0} w={0.5} d={0.5} />
      <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.11, 0.1, 0.24, 24, 1, true]} /><Std color="#1B1A22" side={THREE.DoubleSide} roughness={0.5} /></mesh>
      <mesh position={[0, 0.01, 0]}><cylinderGeometry args={[0.1, 0.1, 0.02, 24]} /><Std color="#1B1A22" /></mesh>
      {colors.map((c, i) => (
        <group key={c} ref={i === 0 ? pen : undefined} position={[Math.cos(i * 1.7) * 0.03, 0.17, Math.sin(i * 1.7) * 0.03]} rotation={[Math.sin(i * 2) * 0.22, i, Math.cos(i * 2) * 0.22]}>
          <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.013, 0.013, 0.36, 10]} /><Std color={c} /></mesh>
          <mesh position={[0, 0.3, 0]}><coneGeometry args={[0.013, 0.05, 10]} /><Std color="#d9d4c7" /></mesh>
        </group>
      ))}
    </Hot>
  )
}

const FAN = ['#EE1C25', '#F26B1D', '#F2B600', '#28C37B', '#0088FF', '#33305a']
function Fan() {
  const blades = useRef([]), open = useRef(false)
  const click = () => {
    open.current = !open.current
    blades.current.forEach((b, i) => b && gsap.to(b.rotation, { y: open.current ? -i * 0.3 : 0, duration: 0.6, delay: i * 0.04, ease: 'back.out(1.5)' }))
  }
  return (
    <Hot name="fan" onClick={click} position={[-1.15, TOP, 1.0]} rotation-y={0.3}>
      <Shadow x={0.2} z={0} w={0.9} d={0.9} />
      {FAN.map((c, i) => (
        <group key={c} ref={(g) => (blades.current[i] = g)} position={[0, 0.006 + i * 0.006, 0]}>
          <mesh position={[0.26, 0, 0]}><boxGeometry args={[0.52, 0.005, 0.1]} /><Std color={c} roughness={0.6} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.025, 0.025, 0.05, 12]} /><Std color="#1B1A22" /></mesh>
    </Hot>
  )
}

function Clock() {
  const h = useRef(), m = useRef(), s = useRef()
  const face = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')
    g.fillStyle = '#F3EBDD'; g.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.strokeStyle = '#1B1A22'; g.lineWidth = i % 3 ? 4 : 9; g.beginPath(); g.moveTo(128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100); g.lineTo(128 + Math.sin(a) * 118, 128 - Math.cos(a) * 118); g.stroke() }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
  }, [])
  useFrame(() => {
    const d = new Date(), sec = d.getSeconds() + d.getMilliseconds() / 1000, min = d.getMinutes() + sec / 60, hr = (d.getHours() % 12) + min / 60
    if (s.current) { s.current.rotation.z = -sec / 60 * Math.PI * 2; m.current.rotation.z = -min / 60 * Math.PI * 2; h.current.rotation.z = -hr / 12 * Math.PI * 2 }
  })
  return (
    <group position={[-2.0, TOP + 0.2, -0.5]} rotation-y={0.35}>
      <Shadow x={0} z={0} w={0.5} d={0.4} y={-0.197} />
      <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[0.2, 0.2, 0.08, 32]} />{[<Std key="s" attach="material-0" color="#EE1C25" />, <meshStandardMaterial key="t" attach="material-1" map={face} />, <Std key="b" attach="material-2" color="#EE1C25" />]}</mesh>
      <mesh position={[0, -0.17, 0]}><boxGeometry args={[0.26, 0.05, 0.14]} /><Std color="#1B1A22" /></mesh>
      <group position={[0, 0, 0.045]}>
        <group ref={h}><mesh position={[0, 0.045, 0]}><boxGeometry args={[0.014, 0.09, 0.006]} /><Std color="#1B1A22" /></mesh></group>
        <group ref={m}><mesh position={[0, 0.07, 0.004]}><boxGeometry args={[0.01, 0.14, 0.006]} /><Std color="#1B1A22" /></mesh></group>
        <group ref={s}><mesh position={[0, 0.075, 0.008]}><boxGeometry args={[0.004, 0.15, 0.004]} /><Std color="#EE1C25" /></mesh></group>
      </group>
    </group>
  )
}

/* ---------- lights, camera ---------- */
function Lights({ evening }) {
  const amb = useRef(), win = useRef(), fill = useRef()
  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.02, dt), t = evening ? 1 : 0
    const lerp = (r, v) => { if (r.current) r.current.intensity += (v - r.current.intensity) * k }
    lerp(amb, 0.55 + (1 - t) * 0.35); lerp(win, 0.5 + (1 - t) * 0.9); lerp(fill, 0.55 + (1 - t) * 0.25)
    if (win.current) win.current.color.set(evening ? '#ff9f6e' : '#fff3df')
  })
  return (
    <>
      <ambientLight ref={amb} intensity={0.8} color="#fff0dd" />
      <directionalLight ref={win} position={[0, 4, -4]} intensity={1} />
      <directionalLight ref={fill} position={[1.5, 5, 6]} intensity={0.6} color="#ffe9d0" />
    </>
  )
}

const _p = new THREE.Vector3(), _o = new THREE.PerspectiveCamera(), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion()
function Rig() {
  const { camera, size, pointer } = useThree()
  const lite = useStore((s) => s.lite), setLite = useStore((s) => s.setLite)
  const acc = useRef({ n: 0, t: 0, done: false }), t0 = useRef(0)
  const base = useRef(new THREE.Vector3(0, 2.35, 5.9))
  useFrame((st, dt) => {
    const aspect = size.width / size.height
    const halfW = aspect < 0.8 ? 2.25 : aspect < 1.2 ? 2.9 : 3.2
    const fov = camera.fov * Math.PI / 180
    const dist = Math.max(4.4, halfW / (Math.tan(fov / 2) * aspect))
    t0.current += dt
    const px = lite ? 0 : pointer.x, py = lite ? 0 : pointer.y
    const drift = lite || matchMedia('(pointer:fine)').matches ? 0 : Math.sin(t0.current * 0.4) * 0.5
    const tx = (px + drift) * 0.22, ty = 2.35 + py * 0.07, tz = dist + 0.2
    const k = 1 - Math.pow(0.002, dt), b = base.current
    b.x += (tx - b.x) * k; b.y += (ty - b.y) * k; b.z += (tz - b.z) * k
    const look = [0, aspect < 0.8 ? 2.0 : 1.3, 0.2]
    const f = focus.v
    _o.position.copy(b); _o.up.set(0, 1, 0); _o.lookAt(look[0], look[1], look[2]); _qa.copy(_o.quaternion)
    if (f > 0) {
      // straight above the book, sized and placed to match the cover in the DOM book
      const ph = parseFloat(document.documentElement.style.getPropertyValue('--ph')) || size.height * 0.7
      const D = 1.273, upp = D / ph // world units per css pixel at the cover
      const bk = document.querySelector('.bk'); const r = bk ? bk.getBoundingClientRect() : null
      const dy = r ? r.top + r.height / 2 - size.height / 2 : 0
      const d = (size.height * upp) / (2 * Math.tan(fov / 2))
      _p.set(0, TOP + 0.094 + d, 0.28 - dy * upp)
      _o.position.copy(_p); _o.up.set(0, 0, -1); _o.lookAt(_p.x, TOP, _p.z); _qb.copy(_o.quaternion)
      camera.position.lerpVectors(b, _p, f); camera.quaternion.slerpQuaternions(_qa, _qb, f)
    } else { camera.position.copy(b); camera.quaternion.copy(_qa) }
    // watch frame time; drop to lite mode if the device struggles
    const a = acc.current
    if (!a.done && st.clock.elapsedTime > 2) { a.n++; a.t += dt; if (a.n >= 90) { if (a.t / a.n > 0.034) setLite(); a.done = true } }
  })
  return null
}

/* ---------- overlay: what is under the pointer, cube controls ---------- */
const HINTS = {
  book: 'Click the book to open it.', cube: 'Rubik’s cube: drag a face to turn it, drag around it to spin it.',
  lamp: 'Lamp: click to switch between day and evening.', fan: 'Swatch fan: click to open or close it.', pens: 'Pen cup: click to draw on the window.',
}
function Hud() {
  const hover = useStore((s) => s.hover), solved = useStore((s) => s.cubeSolved), win = useStore((s) => s.cubeWin)
  return (
    <div className="desk-hud">
      <p className="desk-hud__hint" aria-live="polite">{HINTS[hover] || 'Scroll down or click the book to open it. The cube, lamp, swatches and pens all work.'}</p>
      <div className="desk-hud__row">
        <button onClick={() => cubeCtl.scramble()}>Scramble cube</button>
        <button onClick={() => cubeCtl.reset()} disabled={solved}>Reset cube</button>
      </div>
      {win > 0 && <Confetti key={win} />}
    </div>
  )
}
function Confetti() {
  const cols = ['#EE1C25', '#F2B600', '#0088FF', '#28C37B', '#F3EBDD']
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => <i key={i} style={{ '--x': (Math.random() * 100 - 50) + 'vw', '--r': Math.random() * 720 + 'deg', '--d': Math.random() * 0.4 + 's', background: cols[i % 5] }} />)}
      <b className="confetti__msg">Solved</b>
    </div>
  )
}

/* ---------- fallback when WebGL is missing or fails ---------- */
class Boundary extends Component {
  state = { bad: false }
  static getDerivedStateFromError() { return { bad: true } }
  render() { return this.state.bad ? this.props.fallback : this.props.children }
}
const Fallback = () => {
  const setMode = useStore((s) => s.setMode)
  return (<div className="desk-fallback"><p>The 3D desk could not start on this device.</p><button onClick={() => setMode('book')}>Open the book</button></div>)
}
const webgl = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false } }

export default function DeskScene({ active, phase }) {
  const evening = useStore((s) => s.evening), setEvening = useStore((s) => s.setEvening), lite = useStore((s) => s.lite)
  const ok = useMemo(webgl, [])
  if (!ok) return <div className={'desk' + (active ? '' : ' is-off')}><Fallback /></div>
  return (
    <div className={'desk' + (active ? '' : ' is-off')} data-phase={phase} aria-hidden={!active}>
      <Boundary fallback={<Fallback />}>
        <Canvas flat dpr={lite ? 1 : [1, 1.5]} camera={{ fov: 36, position: [0, 2.35, 5.9], near: 0.1, far: 40 }}
          frameloop={active ? 'always' : 'never'} gl={{ antialias: true, powerPreference: 'high-performance' }} style={{ touchAction: 'none' }}
          aria-label="A study desk with a graphic design book, a Rubik's cube, a lamp and a window onto Japanese houses">
          <Lights evening={evening} />
          <Rig />
          <Suspense fallback={null}>
            <Backdrop evening={evening} />
            <Room />
            <Glass />
            <BookOnDesk />
            <Cube position={[-1.5, TOP + 0.325, 0.45]} />
            <Lamp evening={evening} onToggle={() => setEvening(!evening)} />
            <PenCup />
            <Fan />
            <Clock />
          </Suspense>
        </Canvas>
      </Boundary>
      {active && <Hud />}
    </div>
  )
}
