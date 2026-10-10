import { candidateLabels, NATURE_ITEMS, type NatureItem } from './catalog';
import { CARD_SIZE, generateCard, seasonFromDate, todayIso, type SeasonChoice } from './card';
import { detectBingoLines, formatBingoLines } from './bingo';
import { createClipClassifier } from './clipClassifier';
import { preparePhoto } from './photo';
import { createProgress, createProgressStore, foundIndices, markSquare, type CardProgress } from './storage';
import { formatCardDate, formatElapsed, shareSummary } from './summary';
import { createMockClassifier, verifyPhoto, type ImageClassifier } from './verify';

const date = todayIso();
const demo = new URLSearchParams(location.search).get('demo') === '1';
const store = createProgressStore(localStorage);

const dateEl = document.querySelector<HTMLElement>('#date');
const seasonEl = document.querySelector<HTMLSelectElement>('#season');
const elapsedEl = document.querySelector<HTMLTimeElement>('#elapsed');
const countEl = document.querySelector<HTMLElement>('#count');
const statusEl = document.querySelector<HTMLElement>('#status');
const celebrateEl = document.querySelector<HTMLElement>('#celebrate');
const celebrateCopy = document.querySelector<HTMLElement>('#celebrate-copy');
const boardEl = document.querySelector<HTMLElement>('#board');
const shareButton = document.querySelector<HTMLButtonElement>('#share');
const shareDialog = document.querySelector<HTMLDialogElement>('#share-dialog');
const shareText = document.querySelector<HTMLTextAreaElement>('#share-text');
const copyButton = document.querySelector<HTMLButtonElement>('#copy');
const nativeShareButton = document.querySelector<HTMLButtonElement>('#native-share');
const closeShareButton = document.querySelector<HTMLButtonElement>('#close-share');
const camera = document.querySelector<HTMLInputElement>('#camera');
const demoEl = document.querySelector<HTMLElement>('#demo');

if (
  !dateEl ||
  !seasonEl ||
  !elapsedEl ||
  !countEl ||
  !statusEl ||
  !celebrateEl ||
  !celebrateCopy ||
  !boardEl ||
  !shareButton ||
  !shareDialog ||
  !shareText ||
  !copyButton ||
  !nativeShareButton ||
  !closeShareButton ||
  !camera ||
  !demoEl
) {
  throw new Error('Grass Bingo is missing part of its page.');
}

const seasonSelect = seasonEl;
const elapsed = elapsedEl;
const status = statusEl;
const celebrate = celebrateEl;
const celebrateText = celebrateCopy;
const board = boardEl;
const count = countEl;

let season: SeasonChoice = store.recallSeason(date) ?? seasonFromDate(date);
let items: NatureItem[] = [];
let progress: CardProgress = createProgress(date, season, [], new Date().toISOString());
let busy = false;
let pendingIndex: number | null = null;
let statusMessage = '';

const classifier: ImageClassifier = demo
  ? createMockClassifier()
  : createClipClassifier((update) => {
      if (update.status === 'progress' && typeof update.progress === 'number') {
        setStatus(`Saving the on-device checker… ${Math.round(update.progress)}%`);
        return;
      }
      if (update.status === 'ready') {
        setStatus('Checker ready. It stays on this device for next time.');
        return;
      }
      setStatus('Loading the on-device checker. The first visit needs a connection.');
    });

seasonSelect.value = season;
dateEl.textContent = formatCardDate(date);
demoEl.hidden = !demo;
if (!navigator.share) nativeShareButton.hidden = true;

loadSeason(season);
render();
window.setInterval(paintTimer, 1000);

seasonSelect.addEventListener('change', () => {
  const next = seasonSelect.value as SeasonChoice;
  if (next === season || busy) {
    seasonSelect.value = season;
    return;
  }
  loadSeason(next);
  render();
  setStatus(`Showing the ${seasonLabel(next)} card. Each season keeps its own finds for today.`);
});

board.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-index]');
  if (!button || busy) return;
  const index = Number(button.dataset.index);
  const item = items[index];
  if (!item) return;
  if (progress.found[String(index)]) {
    setStatus(`${item.name} is already on your card.`);
    return;
  }
  pendingIndex = index;
  camera.value = '';
  camera.click();
});

camera.addEventListener('change', () => {
  const file = camera.files?.[0];
  const index = pendingIndex;
  pendingIndex = null;
  if (!file || index === null) return;
  void checkSquare(index, file);
});

camera.addEventListener('cancel', () => {
  pendingIndex = null;
});

shareButton.addEventListener('click', () => {
  shareText.value = buildSummary();
  shareDialog.showModal();
  copyButton.focus();
});

copyButton.addEventListener('click', async () => {
  shareText.value = buildSummary();
  try {
    await navigator.clipboard.writeText(shareText.value);
    setStatus('Summary copied. It is text only — no photos.');
  } catch {
    shareText.focus();
    shareText.select();
    setStatus('Select the summary and copy it. Nothing was uploaded.');
  }
});

nativeShareButton.addEventListener('click', async () => {
  const text = buildSummary();
  shareText.value = text;
  try {
    await navigator.share({ title: 'Grass Bingo', text });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    setStatus('Sharing was not available. Copy the text instead.');
  }
});

closeShareButton.addEventListener('click', () => {
  shareDialog.close();
});

function loadSeason(next: SeasonChoice): void {
  season = next;
  seasonSelect.value = next;
  store.rememberSeason(date, next);
  const saved = store.load(date, next);
  const restored = saved ? itemsFromIds(saved.itemIds) : null;
  if (saved && restored) {
    progress = saved;
    items = restored;
    return;
  }
  items = generateCard({ date, season: next });
  progress = createProgress(
    date,
    next,
    items.map((item) => item.id),
    new Date().toISOString(),
  );
  store.save(progress);
}

const byId = new Map(NATURE_ITEMS.map((item) => [item.id, item]));

function itemsFromIds(ids: string[]): NatureItem[] | null {
  const resolved = ids.map((id) => byId.get(id));
  if (resolved.some((item) => !item)) return null;
  return resolved as NatureItem[];
}

function render(): void {
  const lines = detectBingoLines(foundIndices(progress));
  const lineSquares = new Set(lines.flatMap((line) => line.indices));
  board.ariaBusy = busy ? 'true' : 'false';
  board.replaceChildren();
  items.forEach((item, index) => {
    const found = Boolean(progress.found[String(index)]);
    const row = Math.floor(index / 4) + 1;
    const column = (index % 4) + 1;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cell';
    button.dataset.index = String(index);
    button.setAttribute('role', 'gridcell');
    button.setAttribute('aria-rowindex', String(row));
    button.setAttribute('aria-colindex', String(column));
    button.setAttribute('aria-pressed', found ? 'true' : 'false');
    button.disabled = busy;
    if (lineSquares.has(index)) button.classList.add('in-bingo');
    const state = found ? 'Found' : busy ? 'Please wait' : 'Find';
    button.setAttribute('aria-label', `${item.name}, ${found ? 'found' : 'not found'}. ${found ? '' : 'Take a photo.'}`.trim());

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = item.name;
    const hint = document.createElement('span');
    hint.className = 'state';
    hint.textContent = state;
    button.append(name, hint);
    board.append(button);
  });

  const foundCount = foundIndices(progress).length;
  count.textContent = `${foundCount} of ${CARD_SIZE}`;
  celebrate.hidden = lines.length === 0;
  celebrateText.textContent =
    lines.length === 0
      ? ''
      : `You finished ${formatBingoLines(lines)}. Stay out a little longer if you like.`;
  paintTimer();
}

async function checkSquare(index: number, file: File): Promise<void> {
  const item = items[index];
  if (!item || progress.found[String(index)]) return;
  busy = true;
  render();
  setStatus(`Checking your photo for ${item.name.toLowerCase()}…`);
  try {
    const image = await preparePhoto(file);
    const labels = candidateLabels(item, items);
    const decision = await verifyPhoto(classifier, image, labels.target, labels.distractors);
    if (!decision.accepted) {
      setStatus(`That doesn't look like ${item.name.toLowerCase()} yet. Try a clearer shot outside.`);
      return;
    }
    progress = markSquare(progress, index, item.id, new Date().toISOString());
    store.save(progress);
    const lines = detectBingoLines(foundIndices(progress));
    setStatus(
      lines.length > 0
        ? `${item.name} counts. Bingo — ${formatBingoLines(lines)}.`
        : `${item.name} counts. Nice find.`,
    );
  } catch {
    setStatus('The checker could not read that photo. Try another shot.');
  } finally {
    busy = false;
    render();
    const button = board.querySelector<HTMLButtonElement>(`[data-index="${index}"]`);
    button?.focus();
  }
}

function paintTimer(): void {
  const started = Date.parse(progress.startedAt);
  const ms = Number.isNaN(started) ? 0 : Date.now() - started;
  const label = formatElapsed(ms);
  elapsed.textContent = label;
  elapsed.dateTime = durationStamp(ms);
}

function durationStamp(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `PT${hours}H${minutes}M${seconds}S`;
}

function buildSummary(): string {
  const lines = detectBingoLines(foundIndices(progress));
  const foundNames = items
    .filter((_, index) => progress.found[String(index)])
    .map((item) => item.name);
  const started = Date.parse(progress.startedAt);
  const elapsedLabel = formatElapsed(Number.isNaN(started) ? 0 : Date.now() - started);
  return shareSummary({
    dateLabel: formatCardDate(date),
    season: seasonLabel(season),
    foundNames,
    total: CARD_SIZE,
    bingoLabel: formatBingoLines(lines),
    elapsedLabel,
  });
}

function seasonLabel(value: SeasonChoice): string {
  if (value === 'any') return 'any season';
  return value;
}

function setStatus(message: string): void {
  if (message === statusMessage) return;
  statusMessage = message;
  status.textContent = message;
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('./sw.js');
  });
}
