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
  const aDisc = (a.discount_pct ?? 0) > 0 ? 1 : 0;
  const bDisc = (b.discount_pct ?? 0) > 0 ? 1 : 0;
  if (bDisc !== aDisc) return bDisc - aDisc;
  const byDiscount = (b.discount_pct ?? 0) - (a.discount_pct ?? 0);
  if (byDiscount !== 0) return byDiscount;
  return (b.published_at ?? '').localeCompare(a.published_at ?? '');
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

export function imageUrl(offer, siteOrigin = 'https://amazflash.com') {
  const img = (offer.image ?? '').trim();
  if (!img) return '';
  if (img.startsWith('http')) return img;
  return `${siteOrigin}${img.startsWith('/') ? '' : '/'}${img}`;
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
