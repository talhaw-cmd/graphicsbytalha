import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useStore } from '../state/store'

const ASSETS = ['/pages/cover-900.webp', '/pages/p02-900.webp', '/pages/p03-900.webp']
// paper plane outline, 4 anchors
const A = [10, 72], B = [190, 12], C = [112, 128], D = [92, 84]
const PATH = `M${A} L${B} L${C} L${D} Z`
const FILL = `M${A} L${B} L${D} Z`

export default function Loader() {
  const setLoaded = useStore((s) => s.setLoaded)
  const root = useRef(null), path = useRef(null), fill = useRef(null), anchors = useRef(null)
  const [pct, setPct] = useState(0)
  const [done, setDone] = useState(false)
  const [gone, setGone] = useState(false)
  const target = useRef({ v: 0 })

  // real progress: fonts + first page images
  useEffect(() => {
    const total = ASSETS.length + 1
    let n = 0
    const bump = () => { n++; gsap.to(target.current, { v: n / total, duration: 0.5, ease: 'power1.out', onUpdate: () => setPct(Math.round(target.current.v * 100)) }) }
    ASSETS.forEach((src) => { const i = new Image(); i.onload = i.onerror = bump; i.src = src })
    ;(document.fonts?.ready || Promise.resolve()).then(bump)
  }, [])

  // pen tool drawing, driven by the same progress
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    gsap.set(anchors.current.children, { scale: reduce ? 1 : 0 })
  }, [])
  useEffect(() => {
    const k = anchors.current.children
    ;[0, 1, 2, 3].forEach((i) => { if (pct >= (i + 1) * 22) gsap.to(k[i], { scale: 1, duration: 0.3, ease: 'back.out(3)', overwrite: 'auto' }) })
  }, [pct])

  // finish after min display time
  useEffect(() => {
    if (pct < 100) return
    const t = setTimeout(() => {
      gsap.to(fill.current, { opacity: 1, duration: 0.3 })
      gsap.to(anchors.current, { opacity: 0, duration: 0.2 })
      setTimeout(() => { setDone(true); setLoaded(); setTimeout(() => setGone(true), 800) }, 450)
    }, 500)
    return () => clearTimeout(t)
  }, [pct, setLoaded])

  if (gone) return null
  return (
    <div ref={root} className={'loader' + (done ? ' is-done' : '')} role="status" aria-live="polite" aria-label="Loading">
      <div className="loader__box">
        <svg viewBox="0 0 200 140" aria-hidden="true">
          <path ref={fill} className="loader__fill" d={FILL} />
          <path ref={path} className="loader__path" d={PATH} pathLength="1" style={{ strokeDasharray: 1, strokeDashoffset: 1 - pct / 100, transition: 'stroke-dashoffset .3s linear' }} />
          <g ref={anchors}>
            {[A, B, C, D].map((p, i) => <rect key={i} className="loader__anchor" x={p[0] - 4} y={p[1] - 4} width="8" height="8" />)}
          </g>
        </svg>
        <div className="loader__num">{pct}</div>
        <div className="loader__label">Setting up the desk</div>
      </div>
    </div>
  )
}
