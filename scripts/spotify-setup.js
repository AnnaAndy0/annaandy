#!/usr/bin/env node
// Run: node scripts/spotify-setup.js
// Prints the Spotify auth URL to open in your browser.
// Spotify redirects to https://annaandy.com/api/callback which shows your refresh token.

const fs = require('fs');
const path = require('path');

// Load .env.local if present
try {
  const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  env.split('\n').forEach(function (line) {
    const eq = line.indexOf('=');
    if (eq > 0) {
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim();
      if (k && !process.env[k]) process.env[k] = v;
    }
  });
} catch (e) {}

const CLIENT_ID    = process.env.SPOTIFY_CLIENT_ID;
const REDIRECT_URI = 'https://annaandy-n4y6.vercel.app/api/callback';
const SCOPE        = 'user-read-currently-playing user-read-playback-state';

if (!CLIENT_ID) {
  console.error('\nError: SPOTIFY_CLIENT_ID not set in .env.local\n');
  process.exit(1);
}

const url =
  'https://accounts.spotify.com/authorize' +
  '?response_type=code' +
  '&client_id=' + encodeURIComponent(CLIENT_ID) +
  '&scope=' + encodeURIComponent(SCOPE) +
  '&redirect_uri=' + encodeURIComponent(REDIRECT_URI);

console.log('\nOpen this URL in your browser:\n');
console.log(url + '\n');
