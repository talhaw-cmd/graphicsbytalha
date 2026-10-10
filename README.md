# graphicsbytalha

An interactive graphic design portfolio. You start at a Japanese study desk, scroll or click the book, and it opens into a page-flip book of posters, YouTube thumbnails and product mockups. A packages page with live currency conversion and a paper-plane contact form complete the site.

Designed and built by **Muhammad Talha Rauf** (Fiverr: [mtalha929](https://www.fiverr.com/mtalha929), GitHub: [talhaw-cmd](https://github.com/talhaw-cmd)).

## What's inside

- **Desk scene.** A 3D study desk built from code (no model files) with a window over Japanese houses, a lamp, a pen cup, a clock and a fan. The Rubik's cube is playable and its faces carry graphic design icons.
- **Scroll or click to open.** Scrolling down or clicking the book moves the camera to a top-down view and hands over to the real book. Scrolling up on the cover brings you back to the desk.
- **Page-flip book.** Drag, scroll, use the buttons or the keyboard. Contents, page index and an ending page are included. Pages go single-sided below 720 px. A zoom view opens any design full size.
- **Chapters and search.** A side panel lists chapters. The search box accepts chapter names or page numbers.
- **Packages.** Four categories (posters, thumbnails, packaging, mockups) with three tiers each. Prices start in PKR and can be switched to USD, GBP, EUR, AED, SAR, CAD or AUD. Rates come from open.er-api.com, are cached for 24 hours and fall back to built-in rates when offline.
- **Contact.** The form folds into a paper plane that flies across a sky and skywrites "Submit" in smoke. Messages are delivered to email through Web3Forms. If sending fails, the page unfolds and shows the error.
- **Performance and access.** The scene loads as a separate chunk, the 3D loop pauses while the book is open, there is a low-power mode, and reduced-motion settings are respected. Dialogs are keyboard accessible and Esc closes them.

## Tech

React 19, Vite, three.js with @react-three/fiber and drei, GSAP, zustand, and Archivo variable font. The book is a custom CSS 3D page-flip engine with spring physics, no library.

## Run it locally

You need Node.js 20 or newer.

```bash
npm install
cp .env.example .env     # on Windows: copy .env.example .env
npm run dev
```

Open the link the terminal prints (usually http://localhost:5173).

### Contact form key

1. Create a free access key at [web3forms.com](https://web3forms.com) using the email that should receive messages.
2. Put it in `.env`:

```
VITE_WEB3FORMS_KEY=your-access-key
```

3. Restart `npm run dev`. For a production build run `npm run build` again, because Vite reads the key at build time.

Without a key the form shows "Message not sent". `.env` is git-ignored, so the key stays off GitHub.

## Build and deploy

```bash
npm run build      # outputs dist/
npm run preview    # serves dist/ locally
```

Upload `dist/` to any static host. On Vercel or Netlify, connect the repo, add `VITE_WEB3FORMS_KEY` under Environment Variables, and deploy. In the Web3Forms dashboard, set the form's website URL to your live domain.

## Make it yours

| What | Where |
| --- | --- |
| Prices, tiers, currencies | `src/packages.js` |
| Chapters and page titles | `src/data.js` |
| Design images (900 px and 1600 px WebP) | `public/pages/` |
| Which image sits on which page | `IMAGE_OF` in `src/book/pages.jsx` |
| Colors and spacing | variables at the top of `src/styles.css` |

## Project structure

```
src/
  App.jsx            app shell
  data.js            chapters, titles, page count
  packages.js        packages and currencies
  book/              page-flip engine, book UI, page layouts
  scene/             desk scene, cube, textures
  state/             store, open/close flow, scroll and touch input
  ui/                bar, sidebar, packages, contact, loader, skywriting
public/pages/        portfolio images
```

## Notes

- The desk is an original illustration. It is not based on any existing character or franchise.
- Prices in `src/packages.js` are starting estimates. Change them to your own rates.

## License

The code is free to learn from. The portfolio images and brand name are © Muhammad Talha Rauf and may not be reused without permission.