import { CHAPTERS, PAGE_TITLES } from '../data'

// printed page number -> image file (named by the order of the images you sent)
export const IMAGE_OF = { 3: 'p02', 4: 'p10', 5: 'p11', 6: 'p12', 7: 'p13', 8: 'p07', 9: 'p03', 10: 'p04', 11: 'p08', 12: 'p05', 13: 'p06', 14: 'p09' }
export const ALT = {
  3: 'Chapter page: Media Posters', 4: 'Posters for a BBQ restaurant and a burger house',
  5: 'Posters for a nail polish range and a gold beauty brand', 6: 'Posters for a special burger and the Patriot Monster Burger',
  7: 'Posters for Air Jordan and a new shoe', 8: 'Chapter page: YouTube Thumbnails',
  9: 'YouTube thumbnails: Youtube Thumbnail Design, New Features in Instagram', 10: 'YouTube thumbnails: Instagram or Facebook, How You Earn Money',
  11: 'Chapter page: Decent Mockups', 12: 'Mockups of a chips bag and a cap', 13: 'Mockups of a sports bottle and a burger box',
  14: 'Mockups of a book cover and a football shirt',
}
export const img = (f, w) => `/pages/${f}-${w}.webp`

export function PageImage({ n, eager }) {
  const f = IMAGE_OF[n]
  return (
    <img className="pimg" src={img(f, 900)} srcSet={`${img(f, 900)} 900w, ${img(f, 1600)} 1600w`}
      sizes="(max-width:719px) 90vw, 46vw" alt={ALT[n]} width="1275" height="1559"
      loading={eager ? 'eager' : 'lazy'} decoding="async" draggable="false" />
  )
}

export const Cover = () => (
  <img className="pimg" src={img('cover', 900)} alt="Portfolio, Talha Rauf, Graphic Designer 2022 to 2024" width="864" height="1056" draggable="false" />
)

const Blob = ({ className, d }) => (<svg className={'blob ' + className} viewBox="0 0 100 100" aria-hidden="true"><path d={d} /></svg>)
const B1 = 'M0 0H62C70 20 40 34 52 56C60 72 30 86 0 100Z'
const B2 = 'M100 100H38C30 80 60 66 48 44C40 28 70 14 100 0Z'

export const InsideCover = () => (
  <div className="pg pg--red">
    <svg className="plane" viewBox="0 0 200 140" aria-hidden="true"><path d="M10 72 190 12 112 128 92 84Z" /></svg>
  </div>
)

export const Contents = () => (
  <div className="pg">
    <Blob className="blob--tr" d={B1} />
    <h2 className="cond red">Contents</h2>
    <p className="cond outline" aria-hidden="true">Contents</p>
    <ul className="rows">
      {CHAPTERS.filter((c) => c.id !== 'contents').map((c) => (
        <li key={c.id} data-goto={c.from}>
          <i style={{ background: c.color }} />
          <span>{c.name}</span><em>{c.from}</em>
        </li>
      ))}
    </ul>
    <p className="note">Tap a line to go to that page.</p>
  </div>
)

export const Index = () => (
  <div className="pg">
    <h2 className="cond red sm">Page index</h2>
    <ul className="rows rows--tight">
      {Object.entries(PAGE_TITLES).filter(([n]) => +n >= 3).map(([n, t]) => (
        <li key={n} data-goto={n}><span>{t}</span><em>{n}</em></li>
      ))}
    </ul>
  </div>
)

export const Ending = () => (
  <div className="pg pg--end">
    <Blob className="blob--tr" d={B1} />
    <h2 className="cond red xl">Thank<br />you</h2>
    <p className="cond outline xl" aria-hidden="true">Thank<br />you</p>
    <p className="brand">graphicsbytalha</p>
    <p className="note">Talha Rauf, Graphic Designer</p>
    <button type="button" className="cta" data-action="contact">Start a project</button>
  </div>
)

export const BackCover = () => (
  <div className="pg pg--red pg--back">
    <p className="cond white">graphics<br />by talha</p>
    <p className="note">Graphic Designer 2022 to 2024</p>
  </div>
)
