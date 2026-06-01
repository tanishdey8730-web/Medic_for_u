/**
 * Fetches medical context from Wikipedia (free API, no key required).
 */

async function fetchWikipediaSummary(query) {
  const title = encodeURIComponent(query.replace(/ /g, "_"));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "MediAI/2.0 (health-education; contact@example.com)" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title,
      extract: data.extract,
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${title}`,
      thumbnail: data.thumbnail?.source || null,
    };
  } catch {
    return null;
  }
}

async function researchConditions(conditions) {
  const insights = [];
  const seen = new Set();

  for (const cond of conditions.slice(0, 2)) {
    const query = cond.wikiQuery || cond.name;
    if (seen.has(query)) continue;
    seen.add(query);

    const wiki = await fetchWikipediaSummary(query);
    if (wiki) {
      insights.push({
        condition: cond.name,
        source: "Wikipedia",
        url: wiki.url,
        summary: wiki.extract,
        thumbnail: wiki.thumbnail,
      });
    }
  }

  return insights;
}

module.exports = { fetchWikipediaSummary, researchConditions };
