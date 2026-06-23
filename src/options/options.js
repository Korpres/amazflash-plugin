import { DEFAULT_NICHES, NICHES } from '../lib/niches.js';
import { DEFAULT_FEED_URL, getSettings, saveSettings } from '../lib/storage.js';

const gridEl = document.getElementById('niche-grid');
const feedUrlEl = document.getElementById('feed-url');
const statusEl = document.getElementById('status');

let selected = new Set();
let saveTimer = null;

function renderGrid() {
  gridEl.innerHTML = NICHES.map(
    (n) => `
    <label class="niche-item">
      <input type="checkbox" value="${n.slug}" ${selected.has(n.slug) ? 'checked' : ''} />
      <span class="emoji">${n.emoji}</span>
      <span class="label">${n.name}</span>
    </label>`,
  ).join('');

  gridEl.querySelectorAll('input[type=checkbox]').forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) selected.add(input.value);
      else selected.delete(input.value);
      scheduleSave();
    });
  });
}

function scheduleSave() {
  clearTimeout(saveTimer);
  statusEl.textContent = 'Guardando…';
  saveTimer = setTimeout(async () => {
    await saveSettings({
      selectedNiches: [...selected],
      feedUrl: feedUrlEl.value.trim() || DEFAULT_FEED_URL,
    });
    statusEl.textContent = 'Guardado ✓';
    setTimeout(() => {
      if (statusEl.textContent === 'Guardado ✓') statusEl.textContent = '';
    }, 2000);
  }, 350);
}

document.getElementById('select-all').addEventListener('click', () => {
  selected = new Set(NICHES.map((n) => n.slug));
  renderGrid();
  scheduleSave();
});

document.getElementById('select-none').addEventListener('click', () => {
  selected = new Set();
  renderGrid();
  scheduleSave();
});

document.getElementById('select-default').addEventListener('click', () => {
  selected = new Set(DEFAULT_NICHES);
  renderGrid();
  scheduleSave();
});

feedUrlEl.addEventListener('input', scheduleSave);

(async () => {
  const settings = await getSettings();
  selected = new Set(settings.selectedNiches);
  feedUrlEl.value = settings.feedUrl;
  renderGrid();
})();
