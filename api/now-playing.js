// Vercel serverless function — GET /api/now-playing
// Returns currently playing Spotify track, or { isPlaying: false } when idle.
//
// Required env vars (set in Vercel project settings):
//   SPOTIFY_CLIENT_ID
//   SPOTIFY_CLIENT_SECRET
//   SPOTIFY_REFRESH_TOKEN   ← run scripts/spotify-setup.js once to get this

const TOKEN_URL         = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_URL   = 'https://api.spotify.com/v1/me/player/currently-playing';
const RECENT_URL        = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';

async function getAccessToken(clientId, clientSecret, refreshToken) {
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });
  return res.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    return res.status(500).json({ error: 'Spotify env vars not configured' });
  }

  try {
    const { access_token } = await getAccessToken(
      SPOTIFY_CLIENT_ID,
      SPOTIFY_CLIENT_SECRET,
      SPOTIFY_REFRESH_TOKEN
    );

    const npRes = await fetch(NOW_PLAYING_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    // 204 = nothing playing; anything ≥ 400 = error — fall back to recently played
    if (npRes.status !== 204 && npRes.status < 400) {
      const song = await npRes.json();
      if (song?.item) {
        return res.status(200).json({
          isPlaying: song.is_playing,
          title:    song.item.name,
          artist:   song.item.artists.map((a) => a.name).join(', '),
          albumArt: song.item.album.images[0]?.url ?? null,
          url:      song.item.external_urls.spotify,
        });
      }
    }

    // Nothing active — fetch the most recent track
    const recentRes = await fetch(RECENT_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (recentRes.ok) {
      const recent = await recentRes.json();
      const track = recent?.items?.[0]?.track;
      if (track) {
        return res.status(200).json({
          isPlaying: false,
          title:    track.name,
          artist:   track.artists.map((a) => a.name).join(', '),
          albumArt: track.album.images[0]?.url ?? null,
          url:      track.external_urls.spotify,
        });
      }
    }

    return res.status(200).json({ isPlaying: false });
  } catch (err) {
    console.error('now-playing error:', err);
    return res.status(200).json({ isPlaying: false });
  }
};
