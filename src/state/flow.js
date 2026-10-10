// Desk <-> book hand-off. One place so scroll, click, sidebar and logo all take the same path.
import gsap from 'gsap'
import { useStore } from './store'

export const focus = { v: 0 } // 0 = camera on the desk, 1 = camera straight above the book
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const st = () => useStore.getState()
const set = (o) => useStore.setState(o)

export function openBook(page = 1) {
  const s = st()
  if (s.busy) return
  if (s.mode === 'book') { s.goToPage(page); return }
  set({ busy: true, phase: 'opening', panel: null })
  const done = () => {
    set({ mode: 'book' })
    setTimeout(() => { set({ busy: false, phase: 'idle' }); st().goToPage(page) }, reduce() ? 0 : 450)
  }
  if (reduce()) { focus.v = 1; done(); return }
  gsap.to(focus, { v: 1, duration: 1.25, ease: 'power2.inOut', onComplete: done })
}

export function closeBook() {
  const s = st()
  if (s.busy || s.mode !== 'book') return
  set({ busy: true, panel: null })
  const finish = () => {
    set({ mode: 'desk', phase: 'closing' })
    const end = () => set({ busy: false, phase: 'idle' })
    if (reduce()) { focus.v = 0; end(); return }
    gsap.to(focus, { v: 0, duration: 1.1, delay: 0.15, ease: 'power2.inOut', onComplete: end })
  }
  if (s.bookPages[1] !== 0) { s.goToPage(0); setTimeout(finish, reduce() ? 0 : 900) } else finish()
}
