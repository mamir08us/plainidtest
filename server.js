/*Static Content before Forgerock Integration

const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

const users = {
  'testuser': { password: 'password123', role: 'customer' },
  'adminuser': { password: 'adminpass', role: 'admin' }
};

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (user && user.password === password) {
    res.json({
      success: true,
      role: user.role,
      message: 'Login successful'
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

// New registration endpoint
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (users[username]) {
    return res.status(400).json({ success: false, message: 'Username already exists' });
  }
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  users[username] = { password, role: 'customer' }; // default role is customer
  res.json({ success: true, message: 'Registration successful, please login' });
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

*/

const express = require('express');
const axios = require('axios');
const session = require('express-session');
const path = require('path');

const app = express();
const port = 3000;

// 🔐 ForgeRock Bravo Realm Configuration
const CLIENT_ID = 'plainid'; 
const CLIENT_SECRET = 'Admin@12345'; 
const REDIRECT_URI = 'https://plainid.onrender.com/callback';

const FORGEROCK_AUTH_URL = 'https://openam-acnemea20230705.forgeblocks.com:443/am/oauth2/realms/root/realms/bravo/authorize';
const FORGEROCK_TOKEN_URL = 'https://openam-acnemea20230705.forgeblocks.com:443/am/oauth2/realms/root/realms/bravo/access_token';
const FORGEROCK_USERINFO_URL = 'https://openam-acnemea20230705.forgeblocks.com:443/am/oauth2/realms/root/realms/bravo/userinfo';

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

// 👉 Redirect to ForgeRock login page
app.get('/auth/forgerock', (req, res) => {
  const authUrl = `${FORGEROCK_AUTH_URL}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=openid%20profile%20email`;
  res.redirect(authUrl);
});

// 🔁 Handle OAuth2 callback
app.get('/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const tokenRes = await axios.post(
      FORGEROCK_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenRes.data.access_token;
    req.session.accessToken = accessToken;

    // 🔎 Get user profile (optional but useful)
    const userInfoRes = await axios.get(FORGEROCK_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    req.session.user = userInfoRes.data;
    console.log('✅ User Info:', userInfoRes.data);

    res.redirect('/dashboard');
  } catch (error) {
    console.error('❌ OAuth Error:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

// 🔐 Dashboard (only for authenticated users)
app.get('/dashboard', (req, res) => {
  if (!req.session.accessToken) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// 🚪 Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

