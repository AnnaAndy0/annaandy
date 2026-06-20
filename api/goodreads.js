// Vercel function — GET /api/goodreads
// Fetches Goodreads RSS directly (no CORS proxy, no caching middleman)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    const rssRes = await fetch(
      'https://www.goodreads.com/review/list_rss/119804013-anna?shelf=currently-reading'
    );
    const xml = await rssRes.text();

    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

    if (!items.length) return res.status(200).json(null);

    const item = items[0];
    const titleM  = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
    const linkM   = item.match(/<link>(.*?)<\/link>/);
    const descM   = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);

    const coverM  = descM && descM[1].match(/<img[^>]+src="([^"]+)"/);
    const authorM = descM && descM[1].match(/by\s+<a[^>]*>([^<]+)<\/a>/i);

    const cover = coverM
      ? coverM[1].replace(/\._[A-Z]{2}\d+_\./, '._SX400_.')
      : null;

    return res.status(200).json({
      title:  titleM ? titleM[1] : null,
      author: authorM ? authorM[1] : null,
      cover,
      url: linkM ? linkM[1].trim() : 'https://www.goodreads.com/user/show/119804013-anna',
    });
  } catch (err) {
    console.error('goodreads error:', err);
    return res.status(200).json(null);
  }
};
