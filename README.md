# Grass Bingo

A daily 4×4 nature bingo card that gets you outside. Tap a square, photograph what you found, and an open-weight CLIP model running in the browser decides whether the photo matches. There is no backend.

## Why open-weight and on-device

The checker is [`Xenova/clip-vit-base-patch32`](https://huggingface.co/Xenova/clip-vit-base-patch32), an ONNX build of CLIP, loaded with [Transformers.js](https://huggingface.co/docs/transformers.js). The weights are open, so the check does not depend on a proprietary vision API, an account, or a server that can see your pictures.

The model is downloaded once and cached in the browser. A small service worker then keeps the app shell available, so later visits work offline.

## Privacy

Photos are read locally, resized in memory, scored on the device, and discarded. They are not uploaded, not stored in `localStorage`, and not included when you share. The only saved data is which squares you found, when today's card started, and the season you picked. The share button copies a text summary only.

## Run it

```bash
npm install
npm test
npm run dev
```

Add `?demo=1` to play without downloading the model. Demo mode treats any photo as a match so the card can be screenshotted.

```bash
npm run build
npm run preview
```

`npm run build` typechecks, then builds a static `dist/` folder. The Vite base path is `./`, so the same build works on GitHub Pages under `/grass-bingo/`.

## How a day works

The card is a seeded shuffle of a curated outdoor list (oak leaf, pinecone, dandelion, bird, moss, a cloud shaped like something, puddle, mushroom, red and yellow leaves, bark, feather, flower, ant, stone, bench, dog, and more). The seed is the calendar date plus an optional season. Nothing about your location is used. A season prefers in-season finds, then everyday ones. The same date and season always deals the same card.

The "time outside" clock starts when that card is first created and keeps running from `localStorage` if you come back later.

A photo counts when the target label is the model's top match among the square and four other outdoor labels from the card, or when the target score is at least 0.35. Completing a row, column, or diagonal is a bingo.

## Deploy

Pushing to `main` runs the tests, builds `dist`, and publishes it with GitHub Actions. In the repository settings, set Pages to **GitHub Actions**.

## License

MIT. Copyright 2026 Anand Biju.
