/**
 * Cloudflare Pages Functions — SSR for quote sharing (Scheme B)
 *
 * For ?code=xxx on root path:
 *   1. Fetches the quote from Worker API
 *   2. Fetches /gallery/index.html from static assets
 *   3. Injects dynamic OG meta tags into the <head>
 *   4. Returns the full gallery page — 3D flip, frames, reactions, subscribe all intact
 *
 * For all other requests: passes through to static assets.
 */

const API_BASE = "https://jamestyle-analytics.jimsbond007.workers.dev";

async function fetchQuote(code) {
  try {
    const res = await fetch(`${API_BASE}/api/public/quote/${code}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only intercept ?code= on root path
    const code = url.searchParams.get("code");
    if (code && url.pathname === "/" && /^[a-z0-9]{4}$/i.test(code)) {
      const quote = await fetchQuote(code.toLowerCase());
      if (quote) {
        // 1. Fetch the full gallery page from static assets
        const galleryReq = new URL("/gallery/index.html", url.origin);
        const galleryRes = await env.ASSETS.fetch(galleryReq);
        if (!galleryRes.ok) {
          return env.ASSETS.fetch(request);
        }
        let html = await galleryRes.text();

        // 2. Build dynamic meta tags
        const title = escapeHtml(quote.title);
        const caption = escapeHtml(quote.caption);
        const imageUrl = `https://jamestyle.com/${quote.image}`;
        const pageUrl = `https://jamestyle.com/?code=${code}`;

        const dynamicHead = `
  <title>阿占隨意語錄 | ${title}</title>
  <meta name="description" content="${caption}">
  <meta property="og:title" content="阿占隨意語錄 | ${title}">
  <meta property="og:description" content="${caption}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="JameStyle">
  <meta property="og:locale" content="zh_HK">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="阿占隨意語錄 | ${title}">
  <meta name="twitter:description" content="${caption}">
  <meta name="twitter:image" content="${imageUrl}">`;

        // 3. Remove existing title, description, og:*, twitter:* tags
        html = html.replace(/<title>.*?<\/title>/gi, "");
        html = html.replace(/<meta[^>]*name="description"[^>]*>/gi, "");
        html = html.replace(/<meta[^>]*property="og:[^"]*"[^>]*>/gi, "");
        html = html.replace(/<meta[^>]*name="twitter:[^"]*"[^>]*>/gi, "");

        // 4. Inject dynamic tags before </head>
        html = html.replace(/<\/head>/i, dynamicHead + "\n</head>");

        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    }

    // Pass through to static assets
    return env.ASSETS.fetch(request);
  },
};
