// Page-flip engine (DOM + CSS 3D). Ported from design-book.html, driven by React refs.
export const RATIO = 1.2225 // page height / width (images are 1275 x 1559)

export function createBook({ book, wrap, floor, castR, castL, onState, onAction, isBlocked }) {
  const RM = matchMedia('(prefers-reduced-motion:reduce)').matches
  const root = document.documentElement
  const els = [...book.querySelectorAll('.leaf')]
  const N = els.length - 1 // leaves 0..N ; cur in 0..N+1 handled below
  const LAST = els.length // cur === LAST shows back cover
  let pw = 320, ph = 392, single = false, cur = 0, view = 'r', peek = null, touched = false, drag = null, dead = false
  let soundOn = true
  const S = { x: 0, v: 0, r: null }
  const leaves = els.map((el) => ({ el, a: 0, v: 0, t: 0, r: -1, want: 0, drag: false, timer: 0 }))
  const base = (i) => (i < cur ? 180 : 0)
  const peekOff = (i) => (peek === 'r' && i === cur ? 12 : peek === 'l' && i === cur - 1 ? -12 : 0)
  const txTarget = () => (single ? (view === 'r' ? -pw / 2 : pw / 2) : cur === 0 ? -pw / 2 : cur === LAST ? pw / 2 : 0)
  const spineX = () => { const r = book.getBoundingClientRect(); return r.left + r.width / 2 }

  /* sound */
  let ac = null
  function flip() {
    if (!soundOn) return
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)()
      if (ac.state === 'suspended') ac.resume()
      const len = (ac.sampleRate * 0.34) | 0, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0)
      for (let i = 0; i < len; i++) { const t = i / len; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.3) * (t < 0.05 ? t / 0.05 : 1) }
      const s = ac.createBufferSource(); s.buffer = buf
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.8
      f.frequency.setValueAtTime(2800, ac.currentTime); f.frequency.exponentialRampToValueAtTime(650, ac.currentTime + 0.32)
      const g = ac.createGain(); g.gain.value = 0.32
      s.connect(f); f.connect(g); g.connect(ac.destination); s.start()
    } catch (e) { /* audio is optional */ }
  }

  /* targets */
  function retarget(stagger, back, playSound) {
    const ch = []
    leaves.forEach((L, i) => { if (base(i) + peekOff(i) !== L.want) ch.push(i) })
    if (back) ch.reverse()
    ch.forEach((i, n) => {
      const L = leaves[i], b = base(i) + peekOff(i)
      L.want = b; clearTimeout(L.timer)
      const apply = () => { L.t = b; if (playSound) flip() }
      const d = stagger && !RM ? n * 95 : 0
      d ? (L.timer = setTimeout(apply, d)) : apply()
    })
  }
  const normalize = () => { if (cur === 0) view = 'r'; if (cur === LAST) view = 'l' }
  function setState(k, v) {
    k = Math.max(0, Math.min(LAST, k))
    if (k === cur && (!single || v === view)) return
    const back = k < cur, moved = k !== cur
    cur = k; view = v || (k === 0 ? 'r' : 'l'); normalize()
    ui(); retarget(true, back, moved)
  }
  // printed page numbers: leaf k holds pages 2k-1 (front) and 2k (back); cover = 0
  function gotoPage(p) {
    if (p <= 0) return setState(0, 'r')
    if (p % 2) setState(Math.ceil(p / 2), 'r'); else setState(p / 2 + 1, 'l')
  }
  function step(d) {
    const prev = cur
    if (single) {
      if (d > 0) { if (view === 'l' && cur < LAST) view = 'r'; else if (view === 'r' && cur < LAST) { cur++; view = 'l' } else return }
      else { if (view === 'r' && cur > 0) view = 'l'; else if (view === 'l' && cur > 0) { cur--; view = 'r' } else return }
    } else { const k = cur + d; if (k < 0 || k > LAST) return; cur = k }
    normalize(); ui(); retarget(false, d < 0, cur !== prev)
  }

  /* ui state out */
  function visible() {
    // returns visible printed pages: [left, right] (null when none)
    if (cur === 0) return [null, 0]
    if (cur === LAST) return [LAST * 2 - 2, null]
    const l = cur === 1 ? null : 2 * (cur - 1), r = 2 * cur - 1
    if (single) return view === 'l' ? [l ?? 'inside', null] : [null, r]
    return [l, r]
  }
  function ui() {
    const [l, r] = visible()
    onState && onState({
      cur, view, single, pages: [l, r],
      canPrev: cur > 0,
      canNext: single ? !(view === 'l' && cur === LAST) : cur !== LAST,
    })
  }
  const touch = () => { touched = true }

  /* size */
  let reserve = { top: 56, bottom: 96 }
  function size() {
    const vw = innerWidth, vh = innerHeight
    single = vw < 720
    const av = (vh - reserve.top - reserve.bottom - 12) / RATIO
    pw = single ? Math.min(vw * 0.9, av, 520) : Math.min(vw * 0.46, av, 560)
    ph = pw * RATIO
    root.style.setProperty('--pw', pw + 'px'); root.style.setProperty('--ph', ph + 'px')
    normalize(); S.x = txTarget(); S.v = 0; S.r = null; ui()
  }
  const onResize = () => size()
  addEventListener('resize', onResize)

  /* loop */
  const spring = (o, t, dt, K, C) => {
    const n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n
    for (let s = 0; s < n; s++) { o.v += (K * (t - o.a) - C * o.v) * h; o.a += o.v * h }
  }
  function paint(L, i) {
    const a = L.a
    L.el.style.transform = `rotateY(${-a}deg)`
    L.el.style.zIndex = a > 0.3 && a < 179.7 ? LAST + 3 : (a < 90 ? LAST - i : i) + 1
    L.el.style.setProperty('--sf', ((a < 90 ? a / 90 : 1) * 0.5).toFixed(3))
    L.el.style.setProperty('--sb', ((a > 90 ? (180 - a) / 90 : 1) * 0.5).toFixed(3))
  }
  let last = performance.now(), raf = 0
  function frame(now) {
    if (dead) return
    const dt = Math.min(0.05, (now - last) / 1000); last = now
    let mxs = 0, mxa = 0
    leaves.forEach((L, i) => {
      if (!L.drag) {
        if (RM) { L.a = L.t; L.v = 0 } else {
          spring(L, L.t, dt, 170, 21)
          if (L.a < 0) { L.a = 0; L.v = 0 } if (L.a > 180) { L.a = 180; L.v = 0 }
          if (Math.abs(L.t - L.a) < 0.03 && Math.abs(L.v) < 0.4) { L.a = L.t; L.v = 0 }
        }
      }
      if (L.a !== L.r) { paint(L, i); L.r = L.a }
      const s = Math.sin((L.a * Math.PI) / 180); if (s > mxs) { mxs = s; mxa = L.a }
    })
    const tt = txTarget(), o = { a: S.x, v: S.v }
    if (RM) { o.a = tt; o.v = 0 } else { spring(o, tt, dt, 120, 22); if (Math.abs(tt - o.a) < 0.05 && Math.abs(o.v) < 0.5) { o.a = tt; o.v = 0 } }
    S.x = o.a; S.v = o.v
    if (S.x !== S.r) {
      wrap.style.transform = `translate3d(${S.x.toFixed(2)}px,0,0)`
      const w = pw * (2 - Math.min(1, Math.abs(S.x) / (pw / 2)))
      floor.style.width = w + 'px'; floor.style.transform = `translateX(${(-w / 2 - S.x).toFixed(2)}px)`
      S.r = S.x
    }
    const c = Math.cos((mxa * Math.PI) / 180)
    castR.style.width = (c > 0 ? pw * c : 0) + 'px'; castL.style.width = (c < 0 ? -pw * c : 0) + 'px'
    castR.style.opacity = castL.style.opacity = (mxs * 0.55).toFixed(3)
    raf = requestAnimationFrame(frame)
  }

  /* pointer */
  const hitAt = (e) => { const el = document.elementFromPoint(e.clientX, e.clientY); return el ? el.closest('[data-goto],[data-action],a[href]') : null }
  const down = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    touch()
    drag = { x0: e.clientX, y0: e.clientY, moved: false, i: -1, id: e.pointerId, R: pw, fwd: true, v: 0, la: 0, lt: 0 }
  }
  const move = (e) => {
    if (drag) {
      const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0
      if (!drag.moved && Math.hypot(dx, dy) > 7) {
        drag.moved = true
        if (!single) {
          const sp = spineX(), r0 = drag.x0 - sp
          let i = -1
          if (r0 > 0 && cur < LAST) { i = cur; drag.fwd = true } else if (r0 <= 0 && cur > 0) { i = cur - 1; drag.fwd = false }
          if (i >= 0) {
            drag.i = i; drag.R = Math.min(pw, Math.max(Math.abs(r0), pw * 0.5))
            const L = leaves[i]; L.drag = true; L.v = 0; clearTimeout(L.timer)
            drag.la = L.a; drag.lt = performance.now()
            try { book.setPointerCapture(drag.id) } catch (_) { /* ignore */ }
            peek = null
          }
        }
      }
      if (drag.moved && drag.i >= 0) {
        const L = leaves[drag.i]
        const c = drag.fwd ? 1 - (drag.x0 - e.clientX) / drag.R : -1 + (e.clientX - drag.x0) / drag.R
        const a = (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI
        const now = performance.now(), dtm = Math.max(1, now - drag.lt) / 1000
        drag.v = drag.v * 0.6 + ((a - drag.la) / dtm) * 0.4; drag.la = a; drag.lt = now
        L.a = a; L.t = a
      }
      return
    }
    if (e.pointerType !== 'mouse' || single) return
    const r = (e.clientX - spineX()) / pw, rc = book.getBoundingClientRect()
    const inY = e.clientY > rc.top && e.clientY < rc.bottom
    let p = null
    if (inY) { if (r > 0.8 && r < 1.06 && cur < LAST) p = 'r'; else if (r < -0.8 && r > -1.06 && cur > 0) p = 'l' }
    if (p !== peek) { peek = p; retarget(false, false, false); book.style.cursor = p ? 'grab' : '' }
  }
  const up = (e) => {
    if (!drag) return
    const d = drag; drag = null
    if (d.i >= 0 && d.moved) {
      const L = leaves[d.i]; L.drag = false
      const fwd = Math.abs(d.v) > 220 ? d.v > 0 : L.a > 90
      const prev = cur
      cur = fwd ? d.i + 1 : d.i; normalize()
      L.v = d.v * 0.25; L.want = -1; ui()
      retarget(false, false, cur !== prev)
      return
    }
    const dx = e.clientX - d.x0
    if (!d.moved) {
      const h = hitAt(e)
      if (h && h.dataset && h.dataset.goto) { gotoPage(+h.dataset.goto); return }
      if (h && h.dataset && h.dataset.action) { onAction && onAction(h.dataset.action); return }
      if (h && h.tagName === 'A') return
      const sx = single ? innerWidth / 2 : spineX()
      step(e.clientX > sx ? 1 : -1)
    } else if (single || d.i < 0) { if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1) }
  }
  const cancel = () => { if (!drag) return; const d = drag; drag = null; if (d.i >= 0) { leaves[d.i].drag = false; leaves[d.i].want = -1; retarget(false, false, false) } }
  const leave = () => { if (peek && !drag) { peek = null; retarget(false, false, false); book.style.cursor = '' } }
  const noDrag = (e) => e.preventDefault()
  book.addEventListener('pointerdown', down); book.addEventListener('pointermove', move)
  book.addEventListener('pointerup', up); book.addEventListener('pointercancel', cancel)
  book.addEventListener('pointerleave', leave); book.addEventListener('dragstart', noDrag)

  const onKey = (e) => {
    if (isBlocked && isBlocked()) return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const tag = e.target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    const k = e.key
    if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); touch(); step(1) }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); touch(); step(-1) }
    else if (k === 'Home') { e.preventDefault(); touch(); setState(0, 'r') }
    else if (k === 'End') { e.preventDefault(); touch(); setState(LAST, 'l') }
  }
  addEventListener('keydown', onKey)

  /* start */
  size()
  raf = requestAnimationFrame((t) => { last = t; frame(t) })
  const t1 = setTimeout(() => {
    if (touched || RM || cur !== 0) return
    peek = 'r'; retarget(false, false, false)
    setTimeout(() => { if (peek === 'r' && !drag) { peek = null; retarget(false, false, false) } }, 1000)
  }, 1500)

  return {
    gotoPage, step, setState: (k, v) => { touch(); setState(k, v) },
    next: () => { touch(); step(1) }, prev: () => { touch(); step(-1) },
    setSound: (v) => { soundOn = v }, setReserve: (r) => { reserve = r; size() },
    destroy() {
      dead = true; cancelAnimationFrame(raf); clearTimeout(t1)
      removeEventListener('resize', onResize); removeEventListener('keydown', onKey)
      leaves.forEach((L) => clearTimeout(L.timer))
    },
  }
}
