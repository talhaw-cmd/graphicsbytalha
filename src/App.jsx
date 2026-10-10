import { lazy, Suspense } from 'react'
import Bar from './ui/Bar'
import Loader from './ui/Loader'
import Book from './book/Book'
import { useStore } from './state/store'
import { Sidebar, MenuSheet } from './ui/Sidebar'
import Packages from './ui/Packages'
import Contact from './ui/Contact'
import useFlowInput from './state/useFlowInput'

const DeskScene = lazy(() => import('./scene/DeskScene'))

export default function App() {
  const mode = useStore((s) => s.mode)
  const phase = useStore((s) => s.phase)
  useFlowInput()
  return (
    <>
      <Bar />
      <Suspense fallback={null}><DeskScene active={mode === 'desk'} phase={phase} /></Suspense>
      <Book active={mode === 'book'} />
      <Sidebar />
      <Packages />
      <Contact />
      <MenuSheet />
      <Loader />
    </>
  )
}
