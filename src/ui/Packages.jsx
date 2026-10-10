import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { useDialog } from './Sidebar'
import { CATEGORIES, CURRENCIES, FALLBACK_PER_USD } from '../packages'

const LS = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch { /* storage is optional */ } },
}

function useRates(active) {
  const [rates, setRates] = useState(() => {
    try { const c = JSON.parse(LS.get('fx') || 'null'); if (c && Date.now() - c.t < 864e5) return { per: c.per, live: true } } catch { /* ignore */ }
    return { per: FALLBACK_PER_USD, live: false }
  })
  useEffect(() => {
    if (!active || rates.live) return
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 5000)
    fetch('https://open.er-api.com/v6/latest/USD', { signal: ctl.signal })
      .then((r) => r.json())
      .then((j) => {
        if (j && j.rates && j.rates.PKR) {
          const per = {}; CURRENCIES.forEach((c) => { per[c.code] = j.rates[c.code] || FALLBACK_PER_USD[c.code] })
          LS.set('fx', JSON.stringify({ t: Date.now(), per })); setRates({ per, live: true })
        }
      })
      .catch(() => { /* keep the built-in rates */ })
      .finally(() => clearTimeout(to))
    return () => { clearTimeout(to); ctl.abort() }
  }, [active, rates.live])
  return rates
}

function fmt(pkr, code, per) {
  const v = code === 'PKR' ? pkr : (pkr / per.PKR) * per[code]
  const digits = code === 'PKR' || v >= 20 ? 0 : 2
  const n = digits ? Math.round(v) : Math.round(v * 100) / 100
  try { return new Intl.NumberFormat('en', { style: 'currency', currency: code, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n) } catch { return code + ' ' + n }
}

export default function Packages() {
  const { open, closePanel } = useDialog('packages')
  const [cat, setCat] = useState(CATEGORIES[0].id)
  const [cur, setCur] = useState(() => (LS.get('cur') && CURRENCIES.some((c) => c.code === LS.get('cur')) ? LS.get('cur') : 'PKR'))
  const rates = useRates(open && cur !== 'PKR')
  const category = useMemo(() => CATEGORIES.find((c) => c.id === cat), [cat])
  const pick = (c) => { setCur(c); LS.set('cur', c) }
  const start = (t) => { useStore.setState({ contactPref: { category: category.name, tier: t.name }, panel: 'contact' }) }

  return (
    <div className={'drawer-wrap' + (open ? ' is-open' : '')} aria-hidden={!open}>
      <div className="scrim" onClick={closePanel} />
      <aside className="drawer drawer--right" role="dialog" aria-modal="true" aria-label="Packages" inert={!open}>
        <div className="drawer__grip" aria-hidden="true" />
        <div className="drawer__head">
          <h2>Packages</h2>
          <button className="x" onClick={closePanel} aria-label="Close packages">Close</button>
        </div>
        <div className="pk-top">
          <p className="pk-intro">Starting prices for common jobs. Bigger jobs are quoted after a message.</p>
          <label className="pk-cur"><span>Show prices in</span>
            <select value={cur} onChange={(e) => pick(e.target.value)}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </label>
        </div>
        <div className="pk-tabs" role="tablist" aria-label="Package categories">
          {CATEGORIES.map((c) => (
            <button key={c.id} role="tab" id={'pk-t-' + c.id} aria-selected={cat === c.id} aria-controls="pk-panel" className={cat === c.id ? 'is-on' : ''} onClick={() => setCat(c.id)}>
              <i style={{ background: c.color }} />{c.name}
            </button>
          ))}
        </div>
        <div className="drawer__body pk-body" role="tabpanel" id="pk-panel" aria-labelledby={'pk-t-' + cat}>
          <ul className="pk-tiers">
            {category.tiers.map((t) => (
              <li key={t.id} className="pk-tier">
                <div className="pk-tier__top"><h3>{t.name}</h3><p className="pk-price">{fmt(t.pkr, cur, rates.per)}</p></div>
                <p className="pk-inc">{t.includes}</p>
                <p className="pk-meta">{t.rev} {t.rev === 1 ? 'revision' : 'revisions'}, delivered in {t.days} {t.days === 1 ? 'day' : 'days'}</p>
                <button className="pk-go" onClick={() => start(t)}>Start this package</button>
              </li>
            ))}
          </ul>
          <ul className="pk-notes">
            <li>A 50% advance starts the work. The rest is paid on delivery.</li>
            <li>Extra revisions and rush delivery (half the time, plus 30%) are priced on request.</li>
            {cur !== 'PKR' && <li>{rates.live ? 'Converted from PKR at today’s rate.' : 'Converted from PKR at an approximate rate; the live rate could not be loaded.'} The final price is confirmed in the message.</li>}
          </ul>
        </div>
      </aside>
    </div>
  )
}
