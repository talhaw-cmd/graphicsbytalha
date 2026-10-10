import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useStore } from '../state/store'
import { useDialog } from './Sidebar'
import { fly } from './skywrite'

const KEY = import.meta.env.VITE_WEB3FORMS_KEY || ''
const NEEDS = ['Packaging', 'Poster', 'Thumbnail', 'Mockup', 'Other']
const NEED_OF = { 'Social media and posters': 'Poster', 'YouTube thumbnails': 'Thumbnail', 'Packaging and labels': 'Packaging', 'Mockups and branding': 'Mockup' }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const W = 280, H = 364

async function send(v) {
  if (!KEY) throw new Error('no key')
  const r = await fetch('https://api.web3forms.com/submit', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ access_key: KEY, subject: 'New message from graphicsbytalha: ' + v.need, from_name: v.name, name: v.name, email: v.email, need: v.need, package: v.pkg || '', message: v.message, botcheck: '' }),
  })
  const j = await r.json()
  if (!r.ok || !j.success) throw new Error(j.message || 'failed')
}

// triangle that appears when a top corner is folded onto the centre line (all in px)
function flap(w, h, side) {
  const ax = w / 2, ay = 0, bx = side < 0 ? 0 : w, by = h * 0.3, cx = side < 0 ? 0 : w, cy = 0
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L
  const vx = cx - ax, vy = cy - ay, pr = vx * ux + vy * uy
  const px = ax + pr * ux, py = ay + pr * uy
  return `polygon(${ax}px ${ay}px, ${bx}px ${by}px, ${2 * px - cx}px ${2 * py - cy}px)`
}

export default function Contact() {
  const { open, closePanel } = useDialog('contact')
  const pref = useStore((s) => s.contactPref)
  const lite = useStore((s) => s.lite)
  const [v, setV] = useState({ name: '', email: '', need: 'Poster', message: '', bot: '' })
  const [pkg, setPkg] = useState(null)
  const [err, setErr] = useState({})
  const [fail, setFail] = useState('')
  const [phase, setPhase] = useState('form') // form | folding | flying | sent
  const sheet = useRef(null), paper = useRef(null), inner = useRef(null), sky = useRef(null), cv = useRef(null), plane = useRef(null), crease = useRef(null)
  const fl = useRef(null), fr = useRef(null), done = useRef(null)
  const tl = useRef(null), flight = useRef(null), t0 = useRef(0), first = useRef(null)

  // entering: fresh paper, and pre-select what the visitor picked in Packages
  useEffect(() => {
    if (!open) return
    t0.current = Date.now()
    if (pref) { setPkg(pref.tier + ', ' + pref.category); if (NEED_OF[pref.category]) setV((x) => ({ ...x, need: NEED_OF[pref.category] })); useStore.setState({ contactPref: null }) }
    if (phase === 'form' && sheet.current) gsap.fromTo(sheet.current, { y: 50, rotation: -4, opacity: 0 }, { y: 0, rotation: -0.8, opacity: 1, duration: reduced() ? 0.01 : 0.55, ease: 'power3.out' })
    setTimeout(() => first.current && first.current.focus({ preventScroll: true }), 300)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // leaving: reset everything except what was typed (unless it was sent)
  useEffect(() => {
    if (open) return
    if (flight.current) flight.current.cancel()
    if (tl.current) tl.current.kill()
    const sent = phase === 'sent'
    gsap.set([sheet.current, paper.current, inner.current, sky.current, cv.current, plane.current, crease.current, fl.current, fr.current, done.current], { clearProps: 'all' })
    setPhase('form'); setFail(''); setErr({})
    if (sent) { setV({ name: '', email: '', need: 'Poster', message: '', bot: '' }); setPkg(null) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => { setV({ ...v, [k]: e.target.value }); if (err[k]) setErr({ ...err, [k]: '' }) }

  const submit = (e) => {
    e.preventDefault()
    const er = {}
    if (!v.name.trim()) er.name = 'Enter your name'
    if (!EMAIL.test(v.email.trim())) er.email = 'Enter an email like name@site.com'
    if (v.message.trim().length < 10) er.message = 'Write at least a short message (10 characters)'
    setErr(er); setFail('')
    if (Object.keys(er).length) { const k = Object.keys(er)[0]; const el = document.getElementById('ct-' + k); el && el.focus(); return }
    const bot = !!v.bot || Date.now() - t0.current < 2500 // honeypot filled, or filled in under 2.5s: skip the real send
    const req = bot ? Promise.resolve() : send({ ...v, pkg })
    runSequence(req)
  }

  function runSequence(req) {
    setPhase('folding')
    const ok = req.then(() => true, () => false)
    if (reduced()) {
      gsap.to(inner.current, { opacity: 0, duration: 0.2 })
      ok.then((good) => { if (good) finish(); else { gsap.to(inner.current, { opacity: 1, duration: 0.2 }); setPhase('form'); setFail('Message not sent. Check your connection and try again.') } })
      return
    }
    const r = paper.current.getBoundingClientRect()
    gsap.set(paper.current, { width: r.width, height: r.height })
    gsap.set(fl.current, { width: W, height: H }); gsap.set(fr.current, { width: W, height: H })
    fl.current.style.clipPath = flap(W, H, -1); fr.current.style.clipPath = flap(W, H, 1)
    const t = gsap.timeline({ defaults: { ease: 'power2.inOut' } })
    t.to(inner.current, { opacity: 0, duration: 0.25 })
      .to(paper.current, { width: W, height: H, duration: 0.55, ease: 'power3.inOut' }, 0.15)
      .to(sheet.current, { rotation: 0, duration: 0.4 }, 0.15)
      .to(sky.current, { opacity: 1, duration: 1.1, ease: 'sine.inOut' }, 0.6)
      .fromTo(crease.current, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.75)
      .fromTo(paper.current, { clipPath: 'polygon(50% 0%,100% 0%,100% 100%,0% 100%,0% 0%)' }, { clipPath: 'polygon(50% 0%,100% 30%,100% 100%,0% 100%,0% 30%)', duration: 0.5 }, 0.95)
      .fromTo([fl.current, fr.current], { opacity: 0 }, { opacity: 1, duration: 0.3 }, 1.05)
      .to(sheet.current, { scaleX: 0.24, scaleY: 0.32, rotation: 90, duration: 0.6, ease: 'power3.inOut' }, 1.6)
    t.eventCallback('onComplete', async () => {
      const good = await ok
      if (!good) { setFail('Message not sent. Check your connection and try again.'); setPhase('form'); t.reverse(); return }
      launch()
    })
    tl.current = t
  }

  function launch() {
    setPhase('flying')
    const rr = sheet.current.getBoundingClientRect(), c = [rr.left + rr.width / 2, rr.top + rr.height / 2]
    gsap.set(plane.current, { x: c[0] - 55, y: c[1] - 27, opacity: 1 })
    gsap.to(sheet.current, { opacity: 0, duration: 0.15 })
    flight.current = fly({
      canvas: cv.current, plane: plane.current, start: c, lite,
      onWritten: () => {},
      onDone: () => setTimeout(() => {
        gsap.to([cv.current, sky.current], { opacity: 0, duration: 1, ease: 'sine.inOut', onComplete: () => finish() })
      }, 1500),
    })
  }

  function finish() {
    setPhase('sent')
    gsap.fromTo(done.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.1 })
  }

  const busy = phase !== 'form'
  const close = () => { if (!busy || phase === 'sent') closePanel() }
  useEffect(() => {
    if (!open) return
    const k = (e) => { if (e.key === 'Escape' && busy && phase !== 'sent') e.stopPropagation() }
    addEventListener('keydown', k, true); return () => removeEventListener('keydown', k, true)
  }, [open, busy, phase])

  return (
    <div className={'ct' + (open ? ' is-open' : '')} data-phase={phase} role="dialog" aria-modal="true" aria-label="Contact" inert={!open}>
      <div className="ct__scrim" onClick={close} />
      <div className="ct__sky" ref={sky} aria-hidden="true"><i className="cl c1" /><i className="cl c2" /><i className="cl c3" /></div>
      <canvas className="ct__smoke" ref={cv} aria-hidden="true" />
      <div className="ct__stage"><div className="ct__sheet" ref={sheet}>
        <div className="ct__paper" ref={paper}>
          <div className="ct__inner" ref={inner}>
            <div className="ct__head">
              <div><h2>Start a project</h2><p>Tell me what you need. I reply within 24 hours.</p></div>
              <button type="button" className="x" onClick={close} aria-label="Close contact form">Close</button>
            </div>
            {pkg && (
              <p className="ct__pkg">Package: {pkg} <button type="button" onClick={() => setPkg(null)} aria-label="Remove package">Remove</button></p>
            )}
            <form onSubmit={submit} noValidate>
              <div className="fld"><label htmlFor="ct-name">Name</label>
                <input id="ct-name" ref={first} value={v.name} onChange={set('name')} autoComplete="name" aria-invalid={!!err.name} aria-describedby={err.name ? 'e-name' : undefined} />
                {err.name && <p id="e-name" className="err" role="alert">{err.name}</p>}</div>
              <div className="fld"><label htmlFor="ct-email">Email</label>
                <input id="ct-email" type="email" inputMode="email" value={v.email} onChange={set('email')} autoComplete="email" aria-invalid={!!err.email} aria-describedby={err.email ? 'e-email' : undefined} />
                {err.email && <p id="e-email" className="err" role="alert">{err.email}</p>}</div>
              <div className="fld"><label htmlFor="ct-need">What do you need</label>
                <select id="ct-need" value={v.need} onChange={set('need')}>{NEEDS.map((n) => <option key={n}>{n}</option>)}</select></div>
              <div className="fld"><label htmlFor="ct-message">Message</label>
                <textarea id="ct-message" rows="5" value={v.message} onChange={set('message')} aria-invalid={!!err.message} aria-describedby={err.message ? 'e-message' : undefined} />
                {err.message && <p id="e-message" className="err" role="alert">{err.message}</p>}</div>
              <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={v.bot} onChange={set('bot')} name="website" />
              {fail && <p className="err err--box" role="alert">{fail}</p>}
              <button type="submit" className="ct__send" disabled={busy}>Send message</button>
            </form>
          </div>
          <svg className="ct__crease" ref={crease} viewBox={`0 0 ${W} ${H}`} aria-hidden="true"><path d={`M${W / 2} 0V${H}`} /></svg>
          <i className="ct__flap" ref={fl} aria-hidden="true" /><i className="ct__flap" ref={fr} aria-hidden="true" />
        </div>
      </div></div>
      <svg className="ct__plane" ref={plane} viewBox="0 0 120 60" aria-hidden="true">
        <path d="M120 30 0 8 22 30Z" fill="#F3EBDD" /><path d="M120 30 22 30 0 52Z" fill="#cfc4ad" /><path d="M0 8 22 30 0 52" fill="none" stroke="#a79c86" strokeWidth="1" />
      </svg>
      <div className="ct__stage ct__stage--done"><div className="ct__done" ref={done} role="status">
        {phase === 'sent' && (<>
          <h2>Message sent</h2><p>I will reply within 24 hours.</p>
          <button type="button" className="ct__send" onClick={closePanel}>Back to the desk</button>
        </>)}
      </div></div>
    </div>
  )
}
