import { DEFAULT_FEED_URL } from './storage.js';

export async function fetchOffers(feedUrl = DEFAULT_FEED_URL) {
  const url = (feedUrl || DEFAULT_FEED_URL).trim();
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`No se pudo cargar el feed (${res.status})`);
  }
  const data = await res.json();
  return {
    generatedAt: data.generated_at || null,
    offers: Array.isArray(data.offers) ? data.offers : [],
  };
}

export function formatGeneratedAt(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
