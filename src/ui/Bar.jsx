import { useStore } from '../state/store'
import { closeBook } from '../state/flow'

const Logo = () => (
  <svg viewBox="0 0 26 26" aria-hidden="true"><rect width="26" height="26" rx="6" fill="#E5402F" />
    <path d="M5 14 21 6l-6 14-2.5-5.5z" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" /></svg>
)
const Search = () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3.5 3.5" /></svg>)
const Menu = () => (<svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h16M3 11h16M3 16h16" /></svg>)

export default function Bar() {
  const { panel, openPanel } = useStore()
  return (
    <header className="bar">
      <button className="bar__logo" aria-label="graphicsbytalha, back to the desk" onClick={closeBook}><Logo />graphicsbytalha</button>
      <nav className="bar__nav" aria-label="Main">
        <button className="bar__btn" aria-expanded={panel === 'chapters'} onClick={() => openPanel('chapters')}>Chapters</button>
      </nav>
      <span className="bar__spacer" />
      <button className="bar__search" aria-label="Search chapters or page number" onClick={() => openPanel('chapters')}>
        <Search /><span>Search chapter or page</span>
      </button>
      <button className="bar__btn" aria-expanded={panel === 'packages'} onClick={() => openPanel('packages')}>Packages</button>
      <button className="bar__btn bar__cta" aria-expanded={panel === 'contact'} onClick={() => openPanel('contact')}>Contact</button>
      <button className="bar__icon" aria-label="Search" onClick={() => openPanel('chapters')}><Search /></button>
      <button className="bar__icon" aria-label="Menu" aria-expanded={panel === 'menu'} onClick={() => openPanel('menu')}><Menu /></button>
    </header>
  )
}
