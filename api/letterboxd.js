// Vercel function — GET /api/letterboxd
// Fetches Letterboxd RSS directly (no CORS proxy, no caching middleman)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    const rssRes = await fetch('https://letterboxd.com/annaandy/rss/');
    const xml = await rssRes.text();

    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

    for (const item of items) {
      const titleM = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
      const linkM  = item.match(/<link>(.*?)<\/link>/);
      const descM  = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);

      if (!titleM) continue;

      // Only film diary entries have "Title, Year" format
      const m = titleM[1].match(/^(.+?),\s*(\d{4})(?:\s*[-–]\s*(.+))?$/);
      if (!m) continue;

      const posterM = descM && descM[1].match(/<img[^>]+src="([^"]+)"/);

      return res.status(200).json({
        name:   m[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
        year:   m[2],
        rating: m[3] ? m[3].trim() : '',
        poster: posterM ? posterM[1] : null,
        url:    linkM ? linkM[1].trim() : 'https://letterboxd.com/annaandy',
      });
    }

    return res.status(200).json(null);
  } catch (err) {
    console.error('letterboxd error:', err);
    return res.status(200).json(null);
  }
};
