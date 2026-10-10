import { useEffect, useMemo, useRef, useState } from 'react'
import { createBook } from './engine'
import { useStore } from '../state/store'
import { closeBook } from '../state/flow'
import { Cover, InsideCover, Contents, Index, Ending, BackCover, PageImage, IMAGE_OF, ALT, img } from './pages'
import './book.css'

const pageContent = (n) => {
  if (n === 1) return <Contents />
  if (n === 2) return <Index />
  if (n === 15) return <Ending />
  return <PageImage n={n} eager={n <= 5} />
}
// leaf 0: cover / inside cover; leaves 1..7: pages 2k-1 / 2k; leaf 8: page 15 / back cover
const LEAVES = [
  { hard: 1, f: <Cover />, b: <InsideCover /> },
  ...[1, 2, 3, 4, 5, 6, 7].map((k) => ({ f: pageContent(2 * k - 1), b: pageContent(2 * k) })),
  { hard: 1, board: 1, f: pageContent(15), b: <BackCover /> },
]

function label(s) {
  if (!s) return 'Cover'
  const [l, r] = s.pages
  if (s.cur === 0) return 'Cover'
  if (r === null && l !== null) return l === 'inside' ? 'Inside cover' : s.cur === LEAVES.length ? 'Back cover' : 'Page ' + l
  if (l === null) return 'Page ' + r
  return 'Pages ' + l + ' and ' + r
}

export default function Book({ active = true }) {
  const bookEl = useRef(null), wrapEl = useRef(null), floorEl = useRef(null), castR = useRef(null), castL = useRef(null)
  const eng = useRef(null)
  const [st, setSt] = useState(null)
  const [sound, setSound] = useState(true)
  const [zoom, setZoom] = useState(false)
  const [hint, setHint] = useState(true)
  const { openPanel, setBookPages, panel } = useStore()
  const stRef = useRef(null)
  stRef.current = st
  const blocked = useRef(false)
  blocked.current = !!panel || zoom || !active

  useEffect(() => {
    const e = createBook({
      book: bookEl.current, wrap: wrapEl.current, floor: floorEl.current, castR: castR.current, castL: castL.current,
      onState: (s) => { setSt(s); setBookPages(s.pages); setHint(false) },
      onAction: (a) => { if (a === 'contact') openPanel('contact') },
      isBlocked: () => blocked.current,
    })
    eng.current = e
    const un = useStore.subscribe((s, p) => {
      if (s.req.n !== p.req.n && s.req.page !== null) e.gotoPage(s.req.page)
      if (s.step.n !== p.step.n) {
        if (s.step.d > 0) e.next()
        else if (stRef.current && stRef.current.cur === 0) closeBook()
        else e.prev()
      }
    })
    return () => { un(); e.destroy() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { eng.current && eng.current.setSound(sound) }, [sound])
  useEffect(() => {
    if (!zoom) return
    const k = (e) => { if (e.key === 'Escape') setZoom(false) }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [zoom])

  const shown = useMemo(() => (st ? st.pages.filter((p) => typeof p === 'number' && IMAGE_OF[p]) : []), [st])

  return (
    <div className={'bk-stage' + (active ? '' : ' is-off')} aria-hidden={!active}>
      <div className="bk-wrap" ref={wrapEl}>
        <div className="bk-floor" ref={floorEl} />
        <div className="bk" ref={bookEl} role="group" aria-label="Book: graphic design portfolio by Talha Rauf">
          <div className="cast cast--r" ref={castR} /><div className="cast cast--l" ref={castL} />
          {LEAVES.map((L, i) => (
            <div key={i} className={'leaf' + (L.hard ? ' hard' : '')}>
              <div className={'face front' + (L.board ? ' board' : '')}>{L.board ? <div className="inner">{L.f}</div> : L.f}<i className="gut" /><i className="sh" /></div>
              <div className="face back">{L.b}<i className="gut" /><i className="sh" /></div>
            </div>
          ))}
        </div>
      </div>
      {hint && <p className="bk-hint">Drag a page corner, click a page, or use the arrow keys.</p>}
      <div className="bk-ctl" role="group" aria-label="Book controls">
        <button type="button" disabled={!st?.canPrev} onClick={() => eng.current.prev()}>Previous</button>
        <span className="bk-lab" aria-live="polite">{label(st)}</span>
        <button type="button" disabled={!st?.canNext} onClick={() => eng.current.next()}>Next</button>
        <button type="button" disabled={!shown.length} onClick={() => setZoom(true)}>Zoom</button>
        <button type="button" className="hide-s" aria-pressed={sound} onClick={() => setSound(!sound)}>{sound ? 'Sound on' : 'Sound off'}</button>
      </div>
      {zoom && (
        <div className="zoom" role="dialog" aria-label="Page zoom" onClick={() => setZoom(false)}>
          <button className="zoom__close" onClick={() => setZoom(false)}>Close</button>
          {shown.map((p) => <img key={p} src={img(IMAGE_OF[p], 1600)} alt={ALT[p]} />)}
        </div>
      )}
    </div>
  )
}
