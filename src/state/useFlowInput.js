import { useEffect } from 'react'
import { useStore } from './store'
import { openBook, closeBook } from './flow'
import { touchOnCube } from '../scene/Cube'

// Scroll / swipe / Esc: desk -> opens the book; book -> next or previous page; at the cover, up goes back to the desk.
export default function useFlowInput() {
  useEffect(() => {
    let acc = 0, lastW = 0, lock = 0
    const free = (t) => { const s = useStore.getState(); return s.loaded && !s.panel && !s.busy && !(t && t.closest && t.closest('.zoom,.drawer,[role=dialog]')) }
    const act = (dir) => {
      const s = useStore.getState()
      if (s.mode === 'desk') { if (dir > 0) openBook(1) } else s.stepBook(dir)
    }
    const onWheel = (e) => {
      if (!free(e.target)) return
      const now = performance.now()
      if (now - lastW > 220) acc = 0
      lastW = now
      if (now < lock) return
      acc += e.deltaY
      if (Math.abs(acc) < 40) return
      const dir = acc > 0 ? 1 : -1; acc = 0
      lock = now + (useStore.getState().mode === 'desk' ? 1800 : 650)
      act(dir)
    }
    let t0 = null
    const onTS = (e) => { const t = e.touches[0]; t0 = e.touches.length === 1 && free(e.target) ? { x: t.clientX, y: t.clientY, cube: touchOnCube.on, hud: !!e.target.closest('.desk-hud,.bk-ctl,.bar') } : null }
    const onTE = (e) => {
      if (!t0) return
      const t = e.changedTouches[0], dx = t.clientX - t0.x, dy = t.clientY - t0.y, s0 = t0; t0 = null
      if (s0.cube || s0.hud || Math.abs(dy) < 70 || Math.abs(dx) > 50 || !free(e.target)) return
      act(dy < 0 ? 1 : -1)
    }
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      const s = useStore.getState()
      if (s.mode === 'book' && !s.panel && !s.busy && !document.querySelector('.zoom')) closeBook()
    }
    addEventListener('wheel', onWheel, { passive: true })
    addEventListener('touchstart', onTS, { passive: true }); addEventListener('touchend', onTE, { passive: true })
    addEventListener('keydown', onKey)
    return () => { removeEventListener('wheel', onWheel); removeEventListener('touchstart', onTS); removeEventListener('touchend', onTE); removeEventListener('keydown', onKey) }
  }, [])
}
