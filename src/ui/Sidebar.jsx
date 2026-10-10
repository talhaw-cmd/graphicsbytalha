import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { openBook } from '../state/flow'
import { CHAPTERS, PAGE_TITLES, TOTAL_PAGES, chapterOf } from '../data'

export function useDialog(name) {
  const panel = useStore((s) => s.panel)
  const closePanel = useStore((s) => s.closePanel)
  const open = panel === name
  const opener = useRef(null)
  useEffect(() => {
    if (!open) return
    opener.current = document.activeElement
    const k = (e) => { if (e.key === 'Escape') { e.stopPropagation(); closePanel() } }
    addEventListener('keydown', k)
    return () => {
      removeEventListener('keydown', k)
      const o = opener.current
      if (o && o.focus && document.contains(o)) o.focus()
    }
  }, [open, closePanel])
  return { open, closePanel }
}

const rangeText = (c) => (c.from === c.to ? 'p. ' + c.from : 'p. ' + c.from + '–' + c.to)

// returns [{page, title, sub}] for a query
function search(q) {
  const t = q.trim().toLowerCase()
  if (!t) return null
  const out = []
  if (/^\d+$/.test(t)) {
    const n = +t
    if (n === 0) out.push({ page: 0, title: 'Cover', sub: 'Go to the cover' })
    else if (n <= TOTAL_PAGES) out.push({ page: n, title: 'Go to page ' + n, sub: PAGE_TITLES[n] })
    else return { rows: [], msg: 'The book has ' + TOTAL_PAGES + ' pages. Try a number from 1 to ' + TOTAL_PAGES + '.' }
    return { rows: out }
  }
  for (const [n, title] of Object.entries(PAGE_TITLES)) {
    const ch = chapterOf(+n)
    if (title.toLowerCase().includes(t) || ch.name.toLowerCase().includes(t)) out.push({ page: +n, title, sub: 'Page ' + n + ' · ' + ch.name })
  }
  if ('cover'.includes(t)) out.unshift({ page: 0, title: 'Cover', sub: 'Go to the cover' })
  return out.length ? { rows: out } : { rows: [], msg: 'Nothing matches “' + q.trim() + '”. Try a chapter name or a page number.' }
}

export function Sidebar() {
  const { open, closePanel } = useDialog('chapters')
  const bookPages = useStore((s) => s.bookPages)
  const [q, setQ] = useState('')
  const input = useRef(null)
  const here = bookPages.find((p) => typeof p === 'number' && p > 0) ?? (bookPages[1] === 0 ? 0 : null)
  const activeChapter = here ? chapterOf(here) : null
  const result = useMemo(() => search(q), [q])

  useEffect(() => { if (open) { setQ(''); setTimeout(() => input.current && input.current.focus(), 30) } }, [open])

  const go = (p) => { useStore.getState().closePanel(); openBook(p) }
  const first = result && result.rows[0]

  return (
    <div className={'drawer-wrap' + (open ? ' is-open' : '')} aria-hidden={!open}>
      <div className="scrim" onClick={closePanel} />
      <aside className="drawer drawer--left" role="dialog" aria-modal="true" aria-label="Chapters" inert={!open}>
        <div className="drawer__grip" aria-hidden="true" />
        <div className="drawer__head">
          <h2>Chapters</h2>
          <button className="x" onClick={closePanel} aria-label="Close chapters">Close</button>
        </div>
        <form className="find" onSubmit={(e) => { e.preventDefault(); if (first) go(first.page) }} role="search">
          <label className="sr" htmlFor="find-q">Search by chapter name or page number</label>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3.5 3.5" /></svg>
          <input id="find-q" ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chapter or page number" autoComplete="off" inputMode="search" enterKeyHint="go" />
          {q && <button type="button" className="find__clear" onClick={() => { setQ(''); input.current.focus() }} aria-label="Clear search">Clear</button>}
        </form>
        <div className="drawer__body">
          {result ? (
            result.rows.length ? (
              <ul className="list">
                {result.rows.map((r) => (
                  <li key={r.page}><button onClick={() => go(r.page)}><span className="t">{r.title}</span><span className="s">{r.sub}</span></button></li>
                ))}
              </ul>
            ) : <p className="empty">{result.msg}</p>
          ) : (
            <ul className="list">
              <li><button onClick={() => go(0)} className={here === 0 ? 'is-on' : ''}><i style={{ background: '#EE1C25' }} /><span className="t">Cover</span></button></li>
              {CHAPTERS.map((c) => (
                <li key={c.id}>
                  <button onClick={() => go(c.from)} className={activeChapter && activeChapter.id === c.id ? 'is-on' : ''} aria-current={activeChapter && activeChapter.id === c.id ? 'true' : undefined}>
                    <i style={{ background: c.color }} /><span className="t">{c.name}</span><span className="r">{rangeText(c)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  )
}

export function MenuSheet() {
  const { open, closePanel } = useDialog('menu')
  const to = (p) => { useStore.setState({ panel: p }) }
  return (
    <div className={'drawer-wrap' + (open ? ' is-open' : '')} aria-hidden={!open}>
      <div className="scrim" onClick={closePanel} />
      <aside className="drawer drawer--sheet" role="dialog" aria-modal="true" aria-label="Menu" inert={!open}>
        <div className="drawer__grip" aria-hidden="true" />
        <div className="drawer__head"><h2>Menu</h2><button className="x" onClick={closePanel}>Close</button></div>
        <ul className="list list--big">
          <li><button onClick={() => to('chapters')}><span className="t">Chapters</span></button></li>
          <li><button onClick={() => to('packages')}><span className="t">Packages</span></button></li>
          <li><button onClick={() => to('contact')}><span className="t">Contact</span></button></li>
        </ul>
      </aside>
    </div>
  )
}
