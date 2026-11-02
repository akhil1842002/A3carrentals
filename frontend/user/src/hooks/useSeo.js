import { useEffect } from 'react';

/**
 * useSeo — Lightweight per-page SEO hook
 * Sets document.title + meta description dynamically on each route.
 *
 * @param {string} title        - Page title (without brand suffix)
 * @param {string} description  - Meta description (150–160 chars ideal)
 * @param {string} [canonical]  - Canonical URL for this page (optional)
 * @param {string[]} [keywords] - Additional page-specific keywords (optional)
 */
export default function useSeo({ title, description, canonical, keywords = [] }) {
  useEffect(() => {
    // ── Title ────────────────────────────────────────────────────────────
    const BRAND = 'A3 Car rental';
    if (title) {
      document.title = (title.includes('A3') || title.includes('Car rental')) ? title : `${title} | ${BRAND}`;
    } else {
      document.title = 'Best Car Rentals in Kaliakkavilai & Marthandam | A3';
    }

    // ── Helper: upsert a <meta> tag ───────────────────────────────────────
    const setMeta = (attrs, content) => {
      const selector = Object.entries(attrs)
        .map(([k, v]) => `meta[${k}="${v}"]`)
        .join('');
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // ── Description ──────────────────────────────────────────────────────
    if (description) {
      setMeta({ name: 'description' }, description);
      setMeta({ property: 'og:description' }, description);
      setMeta({ name: 'twitter:description' }, description);
    }

    // ── OG Title ─────────────────────────────────────────────────────────
    setMeta({ property: 'og:title' }, document.title);
    setMeta({ name: 'twitter:title' }, document.title);

    // ── Keywords (append page-specific to global) ─────────────────────────
    const base = 'car rentals near me, best car rentals near me, best car rentals, car rentals kaliakkavilai, car rentals panamkalai, car rentals marthandam, car rentals kuzhithurai, car rentals parasala, self drive cars kaliakkavilai, self drive car rentals near me, acting driver kaliakkavilai, acting driver marthandam, A3 Car rental';
    let keywordList = [];
    if (Array.isArray(keywords)) {
      keywordList = keywords.filter(Boolean);
    } else if (typeof keywords === 'string' && keywords.trim()) {
      keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean);
    }

    if (keywordList.length > 0) {
      setMeta({ name: 'keywords' }, `${base}, ${keywordList.join(', ')}`);
    }

    // ── Canonical URL ─────────────────────────────────────────────────────
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }

    // ── OG URL ────────────────────────────────────────────────────────────
    setMeta({ property: 'og:url' }, canonical || window.location.href);

  }, [title, description, canonical, Array.isArray(keywords) ? keywords.join(',') : keywords]);
}
