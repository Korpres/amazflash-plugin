import { NICHES_BY_SLUG } from './niches.js';

const AMAZON_ASIN_RE = /^[A-Z0-9]{10}$/;

export function isAmazonOffer(offer) {
  const asin = (offer.asin ?? '').trim().toUpperCase();
  return AMAZON_ASIN_RE.test(asin);
}

function normalizeCategory(value) {
  return (value ?? '').trim().toLowerCase();
}

function channelMatchesNiche(channel, niche) {
  if (!channel) return false;
  const handle = channel.replace(/^@/, '').toLowerCase();
  return handle === niche.channelUsername.toLowerCase();
}

function categoryMatchesNiche(category, niche) {
  const norm = normalizeCategory(category);
  if (!norm) return false;
  return niche.categoryAliases.some(
    (alias) => norm === alias.toLowerCase() || norm.includes(alias.toLowerCase()),
  );
}

function titleMatchesNiche(offer, niche) {
  if (!niche.titlePattern) return false;
  const hay = `${offer.title || ''} ${(offer.bullets || []).join(' ')}`;
  return niche.titlePattern.test(hay);
}

function titleExcluded(offer, niche) {
  if (!niche.excludeTitlePattern) return false;
  const hay = `${offer.title || ''} ${(offer.bullets || []).join(' ')}`;
  return niche.excludeTitlePattern.test(hay);
}

export function offerMatchesNiche(offer, niche) {
  if (titleExcluded(offer, niche)) return false;
  if (channelMatchesNiche(offer.channel, niche)) return true;
  if (categoryMatchesNiche(offer.category, niche)) return true;
  if (titleMatchesNiche(offer, niche)) return true;
  return false;
}

function sortOffers(a, b) {
  const byDate = (b.published_at ?? '').localeCompare(a.published_at ?? '');
  if (byDate !== 0) return byDate;
  const byDiscount = (b.discount_pct ?? 0) - (a.discount_pct ?? 0);
  if (byDiscount !== 0) return byDiscount;
  return (a.asin ?? '').localeCompare(b.asin ?? '');
}

/** Ofertas Amazon filtradas por slugs de nicho seleccionados. */
export function filterOffersForNiches(offers, nicheSlugs) {
  const niches = nicheSlugs
    .map((slug) => NICHES_BY_SLUG[slug])
    .filter(Boolean);

  if (niches.length === 0) return [];

  const amazon = offers.filter(isAmazonOffer);
  const seen = new Set();
  const matched = [];

  for (const offer of amazon) {
    if (seen.has(offer.asin)) continue;
    const niche = niches.find((n) => offerMatchesNiche(offer, n));
    if (!niche) continue;
    const minDisc = niche.minDiscount ?? 20;
    if ((offer.discount_pct ?? 0) < minDisc) continue;
    seen.add(offer.asin);
    matched.push({ ...offer, _nicheSlug: niche.slug, _nicheName: niche.name });
  }

  return matched.sort(sortOffers);
}

export function formatPrice(value) {
  if (value == null || Number.isNaN(Number(value))) return '';
  return `${Number(value).toFixed(2).replace('.', ',')} €`;
}

export function amazonImageUrl(asin) {
  const a = (asin ?? '').trim().toUpperCase();
  if (!AMAZON_ASIN_RE.test(a)) return '';
  return `https://images-eu.ssl-images-amazon.com/images/P/${a}.01._SL300_.jpg`;
}

/** URLs de imagen en orden de preferencia (rehost del sitio primero). */
export function imageCandidates(offer, siteOrigin = 'https://amazflash.com') {
  const out = [];
  const push = (url) => {
    const u = (url ?? '').trim();
    if (u && !out.includes(u)) out.push(u);
  };

  const img = (offer.image ?? '').trim();
  if (img.startsWith('http')) push(img);
  else if (img) push(`${siteOrigin}${img.startsWith('/') ? '' : '/'}${img}`);

  const asin = (offer.asin ?? '').trim().toUpperCase();
  if (AMAZON_ASIN_RE.test(asin)) {
    push(`https://images-eu.ssl-images-amazon.com/images/P/${asin}.01._SL500_.jpg`);
    push(`https://m.media-amazon.com/images/P/${asin}.01._SL500_.jpg`);
    push(`https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SLMAIN_.jpg`);
    push(amazonImageUrl(asin));
  }

  return out;
}

/** Imagen principal del producto. */
export function imageUrl(offer, siteOrigin = 'https://amazflash.com') {
  return imageCandidates(offer, siteOrigin)[0] || '';
}

/** @deprecated Usar imageCandidates; mantenido por compatibilidad. */
export function imageFallbackUrl(offer, siteOrigin = 'https://amazflash.com') {
  const candidates = imageCandidates(offer, siteOrigin);
  return candidates[1] || '';
}

export const PLUGIN_CLICK_F = 'p';
export const PLUGIN_CLICK_FROM = 'amazflash-plugin';

export function offerClickUrl(offer, affiliateTag = 'amazflash0e-21') {
  let url =
    (offer.url ?? '').trim() ||
    `https://www.amazon.es/dp/${offer.asin}?tag=${affiliateTag}`;

  if (!url.toLowerCase().includes('amazflash.com')) return url;

  try {
    const u = new URL(url);
    u.searchParams.set('f', PLUGIN_CLICK_F);
    u.searchParams.set('from', PLUGIN_CLICK_FROM);
    return u.toString();
  } catch {
    return url;
  }
}
