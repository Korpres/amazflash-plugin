import { fetchOffers, formatGeneratedAt } from '../lib/api.js';
import {
  filterOffersForNiches,
  formatPrice,
  imageFallbackUrl,
  imageUrl,
  offerClickUrl,
} from '../lib/offers.js';
import { getSettings, PAGE_SIZE } from '../lib/storage.js';

const listEl = document.getElementById('list');
const metaEl = document.getElementById('meta');
const reloadBtn = document.getElementById('reload');
const loadMoreBtn = document.getElementById('load-more');
const optionsLink = document.getElementById('open-options');

let filtered = [];
let pageIndex = 0;
let loading = false;

optionsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

reloadBtn.addEventListener('click', () => loadOffers(true));
loadMoreBtn.addEventListener('click', () => {
  const nextStart = (pageIndex + 1) * PAGE_SIZE;
  if (nextStart >= filtered.length) return;
  pageIndex += 1;
  renderList();
});

function setState(html, className = 'state') {
  listEl.innerHTML = `<div class="${className}">${html}</div>`;
  loadMoreBtn.hidden = true;
}

function renderList() {
  if (filtered.length === 0) {
    setState(
      'No hay ofertas para los nichos seleccionados.<br><br><a href="#" id="go-options">Abrir configuración</a>',
    );
    document.getElementById('go-options')?.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
    return;
  }

  const start = pageIndex * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);

  listEl.innerHTML = slice
    .map((o) => {
      const src = imageUrl(o);
      const fb = imageFallbackUrl(o);
      const fbAttr =
        fb && fb !== src ? ` data-fallback="${escapeAttr(fb)}"` : '';
      return `
    <a class="offer" href="${escapeAttr(offerClickUrl(o))}" target="_blank" rel="noopener">
      <img src="${escapeAttr(src)}"${fbAttr} alt="" loading="lazy" onerror="if(this.dataset.fallback&&!this.dataset.fb){this.dataset.fb=1;this.src=this.dataset.fallback}" />
      <div class="offer-body">
        <p class="offer-title">${escapeHtml(o.title || o.asin)}</p>
        <div class="offer-meta">
          ${o.discount_pct ? `<span class="badge">−${o.discount_pct}%</span>` : ''}
          ${o.price != null ? `<span class="price">${formatPrice(o.price)}</span>` : ''}
          ${o.list_price != null && o.list_price > (o.price ?? 0)
            ? `<span class="price-old">${formatPrice(o.list_price)}</span>`
            : ''}
          <span class="niche-tag">${escapeHtml(o._nicheName || '')}</span>
        </div>
      </div>
    </a>`;
    })
    .join('');

  const hasMore = start + PAGE_SIZE < filtered.length;
  loadMoreBtn.hidden = !hasMore;
  loadMoreBtn.textContent = 'Cargar más';
}

async function loadOffers(force = false) {
  if (loading) return;
  loading = true;
  reloadBtn.disabled = true;
  loadMoreBtn.disabled = true;
  setState(force ? 'Actualizando…' : 'Cargando ofertas…');

  try {
    const settings = await getSettings();
    const { generatedAt, offers } = await fetchOffers(settings.feedUrl);
    filtered = filterOffersForNiches(offers, settings.selectedNiches);
    pageIndex = 0;

    const nichesLabel =
      settings.selectedNiches.length === 1
        ? '1 nicho'
        : `${settings.selectedNiches.length} nichos`;
    metaEl.textContent = generatedAt
      ? `${nichesLabel} · ${formatGeneratedAt(generatedAt)}`
      : `${nichesLabel} · ${filtered.length} ofertas`;

    renderList();
  } catch (err) {
    metaEl.textContent = 'Error al cargar';
    setState(
      `${escapeHtml(err.message || String(err))}<br><br>Comprueba que <code>offers-feed.json</code> esté publicado en amazflash.com.`,
      'state error',
    );
  } finally {
    loading = false;
    reloadBtn.disabled = false;
    loadMoreBtn.disabled = false;
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

loadOffers();
