const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const querystring = require('querystring');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

app.get('/', (req, res) => {
  res.send('Spotify Now Playing Widget');
});

app.get('/login', (req, res) => {
  const scope = 'user-read-currently-playing';
  const authQueryParams = querystring.stringify({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scope,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
  });
  res.redirect(`${SPOTIFY_AUTH_URL}?${authQueryParams}`);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const authOptions = {
    url: SPOTIFY_TOKEN_URL,
    form: {
      code: code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      grant_type: 'authorization_code',
    },
    headers: {
      Authorization: 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),
    },
    json: true,
  };

  try {
    const response = await axios.post(SPOTIFY_TOKEN_URL, querystring.stringify(authOptions.form), { headers: authOptions.headers });
    const accessToken = response.data.access_token;
    res.redirect(`/now-playing?access_token=${accessToken}`);
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    res.send('Error during authentication');
  }
});

app.get('/now-playing', async (req, res) => {
  const accessToken = req.query.access_token;
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching currently playing track:', error);
    res.send('Error fetching currently playing track');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 