import { DEFAULT_NICHES } from './niches.js';

export const DEFAULT_FEED_URL = 'https://amazflash.com/offers-feed.json';
export const PAGE_SIZE = 5;

const DEFAULTS = {
  selectedNiches: DEFAULT_NICHES,
  feedUrl: DEFAULT_FEED_URL,
};

export function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULTS, (data) => {
      resolve({
        selectedNiches: Array.isArray(data.selectedNiches) && data.selectedNiches.length
          ? data.selectedNiches
          : DEFAULT_NICHES,
        feedUrl: (data.feedUrl || DEFAULT_FEED_URL).trim(),
      });
    });
  });
}

export function saveSettings(partial) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(partial, resolve);
  });
}
