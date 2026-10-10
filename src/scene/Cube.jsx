import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { CUBE_FACES, stickerTex } from './textures'
import { useStore } from '../state/store'

const STEP = 0.21, SIZE = 0.2
const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]] // BoxGeometry face order

export const cubeCtl = { scramble() {}, reset() {} }

const shadowTex = (() => { let t; return () => { if (t) return t; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 4, 32, 32, 32); r.addColorStop(0, 'rgba(0,0,0,.6)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); t = new THREE.CanvasTexture(c); return t } })()
const axisOf = (v) => { const a = [Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)]; return a.indexOf(Math.max(...a)) }

const BASE = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.6, 0))
// nearest axis-aligned rotation (signed permutation matrix) to q
function snapQuat(q) {
  const m = new THREE.Matrix4().makeRotationFromQuaternion(q), e = m.elements
  const col = (i) => new THREE.Vector3(e[i * 4], e[i * 4 + 1], e[i * 4 + 2])
  const dom = (v, skip) => { let b = -1, bv = -1; [0, 1, 2].forEach((k) => { if (k !== skip && Math.abs(v.getComponent(k)) > bv) { bv = Math.abs(v.getComponent(k)); b = k } }); return b }
  const c0 = col(0), a0 = dom(c0, -1), x = new THREE.Vector3().setComponent(a0, Math.sign(c0.getComponent(a0)) || 1)
  const c1 = col(1), a1 = dom(c1, a0), y = new THREE.Vector3().setComponent(a1, Math.sign(c1.getComponent(a1)) || 1)
  const z = new THREE.Vector3().crossVectors(x, y)
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z))
}

export const touchOnCube = { on: false }
export default function Cube({ position }) {
  const outer = useRef(), group = useRef(), pivot = useRef()
  const { camera, size, gl } = useThree()
  const cam = useRef({ camera, size }); cam.current = { camera, size }
  const busy = useRef(false), scrambled = useRef(false)
  const cubies = useRef([])
  const setHover = useStore((s) => s.setHover)

  const mats = useMemo(() => ({
    stick: CUBE_FACES.map((f) => new THREE.MeshStandardMaterial({ map: stickerTex(f), roughness: 0.45, metalness: 0 })),
    dark: new THREE.MeshStandardMaterial({ color: '#0c0b12', roughness: 0.6 }),
  }), [])
  const geo = useMemo(() => new THREE.BoxGeometry(SIZE, SIZE, SIZE), [])
  const list = useMemo(() => {
    const out = []
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      const st = DIRS.map((d) => (d[0] * x + d[1] * y + d[2] * z === 1 ? DIRS.findIndex((q) => q === d) : -1))
      out.push({ key: `${x}${y}${z}`, p: [x * STEP, y * STEP, z * STEP], st })
    }
    return out
  }, [])

  const snap = (c) => {
    c.position.set(Math.round(c.position.x / STEP) * STEP, Math.round(c.position.y / STEP) * STEP, Math.round(c.position.z / STEP) * STEP)
    const m = new THREE.Matrix4().makeRotationFromQuaternion(c.quaternion)
    for (let i = 0; i < 16; i++) m.elements[i] = Math.round(m.elements[i])
    c.quaternion.setFromRotationMatrix(m)
  }
  const solved = () => {
    const map = {}
    cubies.current.forEach((c) => c.userData.st.forEach((ci, k) => {
      if (ci < 0) return
      const n = new THREE.Vector3(...DIRS[k]).applyQuaternion(c.quaternion)
      const key = n.toArray().map(Math.round).join(',')
      ;(map[key] ||= new Set()).add(ci)
    }))
    return Object.values(map).every((s) => s.size === 1)
  }
  const turn = (axisIdx, layer, dir, dur, done) => {
    const g = group.current, pv = pivot.current
    const sel = cubies.current.filter((c) => Math.round(c.position.getComponent(axisIdx) / STEP) === layer)
    pv.quaternion.identity(); pv.updateMatrixWorld(true)
    sel.forEach((c) => pv.attach(c))
    const axis = new THREE.Vector3().setComponent(axisIdx, 1), o = { a: 0 }
    busy.current = true
    gsap.to(o, {
      a: dir * Math.PI / 2, duration: dur, ease: 'power2.inOut',
      onUpdate: () => pv.quaternion.setFromAxisAngle(axis, o.a),
      onComplete: () => {
        pv.quaternion.setFromAxisAngle(axis, dir * Math.PI / 2); pv.updateMatrixWorld(true)
        sel.forEach((c) => { g.attach(c); snap(c) })
        pv.quaternion.identity(); busy.current = false
        done && done()
      },
    })
  }

  useEffect(() => {
    const init = cubies.current.map((c) => ({ p: c.position.clone(), q: c.quaternion.clone() }))
    cubeCtl.reset = () => {
      if (busy.current) return
      cubies.current.forEach((c, i) => { c.position.copy(init[i].p); c.quaternion.copy(init[i].q) })
      scrambled.current = false; useStore.getState().setCubeSolved(true)
    }
    cubeCtl.scramble = () => {
      if (busy.current) return
      scrambled.current = true; useStore.getState().setCubeSolved(false)
      let n = 0, last = -1
      const next = () => {
        if (n++ >= 16) return
        let ax; do { ax = Math.floor(Math.random() * 3) } while (ax === last)
        last = ax
        turn(ax, Math.floor(Math.random() * 3) - 1, Math.random() > 0.5 ? 1 : -1, 0.14, next)
      }
      next()
    }
    return () => { cubeCtl.reset = () => {}; cubeCtl.scramble = () => {} }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- pointer: drag a face to turn a layer; drag outside the cube to spin it ---------- */
  const drag = useRef(null)
  const toScreen = (v) => {
    const { camera: c, size: s } = cam.current
    const p = v.clone().project(c)
    return new THREE.Vector2((p.x * 0.5 + 0.5) * s.width, (-p.y * 0.5 + 0.5) * s.height)
  }
  const endDrag = () => {
    const d = drag.current
    if (d && d.mode === 'spin' && d.lifted) {
      busy.current = true
      const g = group.current, from = g.quaternion.clone()
      const to = BASE.clone().multiply(snapQuat(BASE.clone().invert().multiply(from)))
      const o = { t: 0 }
      gsap.to(outer.current.position, { y: position[1], duration: 0.35, ease: 'bounce.out' })
      gsap.to(o, { t: 1, duration: 0.35, ease: 'power2.out', onUpdate: () => g.quaternion.slerpQuaternions(from, to, o.t), onComplete: () => { g.quaternion.copy(to); busy.current = false } })
    }
    drag.current = null; removeEventListener('pointermove', onMove); removeEventListener('pointerup', endDrag); removeEventListener('pointercancel', endDrag) }
  function onMove(ev) {
    const d = drag.current; if (!d) return
    const dx = ev.clientX - d.x, dy = ev.clientY - d.y
    if (d.mode === 'spin') {
      if (!d.lifted) { d.lifted = true; gsap.to(outer.current.position, { y: position[1] + 0.32, duration: 0.25, ease: 'power2.out' }) }
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(dy * 0.012, dx * 0.012, 0))
      group.current.quaternion.premultiply(q); d.x = ev.clientX; d.y = ev.clientY; return
    }
    if (Math.hypot(dx, dy) < 10 || busy.current) return
    const g = group.current, gq = g.getWorldQuaternion(new THREE.Quaternion())
    const n = d.n, nAxis = axisOf(n), mv = new THREE.Vector2(dx, dy)
    let best = null
    ;[0, 1, 2].filter((i) => i !== nAxis).forEach((r) => {
      const ra = new THREE.Vector3().setComponent(r, 1)
      const dl = new THREE.Vector3().crossVectors(ra, n)
      const dw = dl.applyQuaternion(gq).multiplyScalar(0.1)
      const s = toScreen(d.point.clone().add(dw)).sub(toScreen(d.point))
      if (s.lengthSq() < 1e-6) return
      const score = mv.dot(s) / s.length()
      if (!best || Math.abs(score) > Math.abs(best.score)) best = { r, score }
    })
    drag.current = null
    if (!best) return
    const layer = Math.round(d.obj.position.getComponent(best.r) / STEP)
    turn(best.r, layer, best.score > 0 ? 1 : -1, 0.26, () => {
      if (scrambled.current && solved()) { scrambled.current = false; useStore.getState().setCubeSolved(true, true) }
    })
  }
  const begin = (d) => { drag.current = d; addEventListener('pointermove', onMove); addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag) }

  const onDown = (e) => {
    const hit = e.intersections.find((i) => i.object.userData.cubie)
    const ne = e.nativeEvent
    if (hit) {
      if (e.object !== hit.object) return
      touchOnCube.on = true; addEventListener('pointerup', () => { touchOnCube.on = false }, { once: true }); addEventListener('pointercancel', () => { touchOnCube.on = false }, { once: true })
      e.stopPropagation()
      const gq = group.current.getWorldQuaternion(new THREE.Quaternion()).invert()
      const nl = e.face.normal.clone().transformDirection(e.object.matrixWorld).applyQuaternion(gq)
      const ax = axisOf(nl), n = new THREE.Vector3().setComponent(ax, Math.sign(nl.getComponent(ax)))
      begin({ mode: 'turn', x: ne.clientX, y: ne.clientY, n, point: e.point.clone(), obj: e.object })
    } else { e.stopPropagation(); begin({ mode: 'spin', x: ne.clientX, y: ne.clientY }) }
  }
  useEffect(() => { group.current.quaternion.copy(BASE); return () => endDrag() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <group ref={outer} position={position}>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.325 + 0.004, 0]}><planeGeometry args={[1.0, 1.0]} /><meshBasicMaterial map={shadowTex()} transparent depthWrite={false} /></mesh>
      <group ref={group}
        onPointerDown={onDown}
        onPointerOver={() => { gl.domElement.style.cursor = 'grab'; setHover('cube') }}
        onPointerOut={() => { gl.domElement.style.cursor = ''; setHover(null) }}>
        <group ref={pivot} />
        {list.map((c, i) => (
          <mesh key={c.key} ref={(m) => { if (m) { cubies.current[i] = m; m.userData.cubie = true; m.userData.st = c.st } }}
            geometry={geo} position={c.p} material={c.st.map((s) => (s < 0 ? mats.dark : mats.stick[s]))} />
        ))}
        <mesh>
          <sphereGeometry args={[0.66, 16, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}
