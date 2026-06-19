// Vercel function — https://annaandy.com/api/callback
// Spotify redirects here after you authorize.
// It exchanges the auth code for tokens and shows your refresh token.
// One-time use — after copying SPOTIFY_REFRESH_TOKEN into Vercel env vars you're done.
//
// Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET already set in Vercel.

const REDIRECT_URI = 'https://annaandy-n4y6.vercel.app/api/callback';

module.exports = async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send(`<html><body style="font-family:sans-serif;padding:40px"><h2>Authorization denied</h2><p>${error}</p></body></html>`);
  }

  if (!code) {
    return res.status(400).send('<html><body style="font-family:sans-serif;padding:40px"><h2>No code received</h2></body></html>');
  }

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type:   'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });

    const tokens = await tokenRes.json();

    if (!tokens.refresh_token) {
      return res.status(500).send(
        `<html><body style="font-family:sans-serif;padding:40px"><h2>Token exchange failed</h2><pre>${JSON.stringify(tokens, null, 2)}</pre></body></html>`
      );
    }

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`<!DOCTYPE html>
<html>
<head><title>Spotify Setup</title></head>
<body style="font-family:system-ui,sans-serif;padding:48px;max-width:680px;line-height:1.5">
  <h2 style="margin:0 0 8px">✅ Got your refresh token</h2>
  <p style="color:#555;margin:0 0 24px">Add this to <strong>Vercel → Project → Settings → Environment Variables</strong> as <code>SPOTIFY_REFRESH_TOKEN</code>, then redeploy.</p>
  <pre style="background:#f4f4f2;padding:20px;border-radius:8px;word-break:break-all;font-size:13px">${tokens.refresh_token}</pre>
  <p style="color:#888;font-size:14px;margin-top:24px">You can delete the <code>/api/callback.js</code> file after this if you want — it's only needed for setup.</p>
</body>
</html>`);
  } catch (err) {
    console.error('callback error:', err);
    return res.status(500).send('<html><body style="font-family:sans-serif;padding:40px"><h2>Something went wrong</h2></body></html>');
  }
};
