---
title: Grass Bingo: a daily nature card your phone checks offline, with an open-weight model
published: false
tags: devchallenge, hf26challenge, opensource, ai
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05)*

## What I Built

**Grass Bingo** is a daily 4x4 bingo card of small things to find outside: a pinecone, a red leaf, moss, a snail, a cloud shaped like something. You tap a square, take a photo, and an open-weight CLIP model running in your browser checks whether the photo matches. Get four in a row and you have a bingo.

It is for anyone who wants a small reason to go for a walk. Kids, parents, someone on a lunch break, me after a long day of reviewing pull requests. Everyone gets the same card on the same day (it is seeded by the date), so you can compare with a friend without signing up for anything.

I wanted the screen to be the shortest part. You open the card, look at it once, put the phone away, and take it out again only when you find something. There is no feed or account, and nothing to scroll. A small timer counts how long you've been out, and at the end you can share a text-only summary.

## Demo

Live: **https://anandb71.github.io/grass-bingo/**

Add `?demo=1` to try it at your desk. Demo mode accepts any photo and skips the model download.

![Today's card](https://raw.githubusercontent.com/Anandb71/grass-bingo/main/screenshots/01-card.png)
![A diagonal bingo](https://raw.githubusercontent.com/Anandb71/grass-bingo/main/screenshots/02-bingo.png)
![Text-only share summary](https://raw.githubusercontent.com/Anandb71/grass-bingo/main/screenshots/03-share.png)

Real model runs, same pinecone photo. Uploading it to "Snail" gets rejected. Uploading it to "Pinecone" is accepted:

![CLIP rejects a pinecone as a snail](https://raw.githubusercontent.com/Anandb71/grass-bingo/main/screenshots/04-real-clip-reject.png)
![CLIP accepts the pinecone](https://raw.githubusercontent.com/Anandb71/grass-bingo/main/screenshots/05-real-clip-accept.png)

## Code

{% github Anandb71/grass-bingo %}

## How I Built It

- **Model:** [`Xenova/clip-vit-base-patch32`](https://huggingface.co/Xenova/clip-vit-base-patch32), an ONNX export of OpenAI's open-weight CLIP, run with [transformers.js](https://github.com/huggingface/transformers.js) (`@huggingface/transformers`) on WebAssembly, right in the browser.
- **How it checks a photo:** zero-shot image classification. Instead of just asking "is this a pinecone?", I give CLIP the target label plus a few distractor labels taken from other squares on the card. The photo counts if the target is the top label, or if its score is at least 0.35. That logic lives in a tiny pure function sitting behind a classifier interface, so I could unit test it with fake scores.
- **Offline:** the model downloads once and the browser caches it. A small service worker caches the app shell, so after the first visit it keeps working where you have no signal.
- **The rest:** Vite and plain TypeScript, a seeded card generator (45 outdoor items, filtered by season), bingo line detection, and progress saved in localStorage. No backend.
- **Tests:** 32 Vitest tests across card generation, bingo lines, the verify decision, storage, and the share summary. All pass, and `npm run build` is clean.
- **Deploy:** GitHub Actions builds the app and publishes it to GitHub Pages.

I built it with Cursor's agent and then checked it myself in headless Chromium. On my box, the first real check (which includes downloading and loading the model) took about 25 to 30 seconds. After that, a check took about 2 seconds.

## Why Does Open Innovation Matter?

Most of my working life is about not sending things where they don't need to go. With Arbor, the security tool I'm building, the whole point is that the analysis is deterministic and stays on your side. I wanted the same feeling here.

- **Your photos stay on your phone.** Pictures of your backyard, your street, and your kid's hand holding a leaf never reach a server. Everything happens in the browser tab, and then the image is thrown away. With a closed vision API, every square on the card would mean an upload.
- **It works without signal.** Parks, trails, and the back of a garden are exactly where reception gets bad. Open weights you can cache are the only reason the offline story works at all.
- **It costs nothing to run.** No API key, no per-image bill, and no backend for me to keep alive. Static hosting is enough, so the project can stay free and online for as long as GitHub Pages exists.
- **You can change it.** The labels, the threshold, and the model are all in plain code. If you want a birding card or a card in your own language, fork it and change the list.

This month I've had PRs merged into flake8-bugbear, scalar, pylint, pyscn, iamb, and wordpress-static-site-exporter. Open code is how I learned most of what I know, so it felt right to build something here that anyone can read, run, and change.

## My Agent Session

<!-- Optional: add DevRelay embed/link here if you save one, or delete this section. -->

## Prize Categories

None. This is an entry for the overall prize.

---

*Disclosure: I used AI assistance (Cursor's agent) to build the code and help draft this post. I tested, reviewed, and edited all of it.*
