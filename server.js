const express = require('express');
const axios = require('axios');
const session = require('express-session');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Static user store
const users = {
  'testuser': { password: 'password123', role: 'customer' },
  'adminuser': { password: 'adminpass', role: 'admin' }
};

// ForgeRock Bravo realm configuration
const CLIENT_ID = 'plainid_test_app';
const CLIENT_SECRET = 'Admin@12345';
const REDIRECT_URI = 'https://plainid.onrender.com/callback';
const FORGEROCK_AUTH_URL = 'https://openam-acnemea20230705.forgeblocks.com/am/oauth2/realms/root/realms/bravo/authorize';
const FORGEROCK_TOKEN_URL = 'https://openam-acnemea20230705.forgeblocks.com/am/oauth2/realms/root/realms/bravo/access_token';
const FORGEROCK_USERINFO_URL = 'https://openam-acnemea20230705.forgeblocks.com/am/oauth2/realms/root/realms/bravo/userinfo';

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

// Static data for assets (mock for PlainID evaluation)
const accounts = [
  { id: 'A101', type: 'savings', owner: 'testuser', balance: 1200 },
  { id: 'A102', type: 'checking', owner: 'adminuser', balance: 9800 }
];

const branches = [
  { id: 'B1', name: 'Main Branch', location: 'New York' },
  { id: 'B2', name: 'Downtown Branch', location: 'Chicago' }
];

const creditCards = [
  { id: 'C1', type: 'platinum', holder: 'testuser', limit: 10000 },
  { id: 'C2', type: 'gold', holder: 'adminuser', limit: 20000 }
];

const loans = [
  { id: 'L1', type: 'home', applicant: 'testuser', amount: 300000 },
  { id: 'L2', type: 'auto', applicant: 'adminuser', amount: 25000 }
];

const investments = [
  { id: 'I1', portfolio: 'stocks', owner: 'testuser', value: 15000 },
  { id: 'I2', portfolio: 'bonds', owner: 'adminuser', value: 20000 }
];

// Local Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (user && user.password === password) {
    req.session.user = { username, role: user.role };
    req.session.accessToken = 'static';
    return res.json({ success: true, role: user.role, message: 'Login successful' });
  }
  res.status(401).json({ success: false, message: 'Invalid username or password' });
});

// Registration
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password required' });
  if (users[username]) return res.status(400).json({ success: false, message: 'Username already exists' });

  users[username] = { password, role: 'customer' };
  res.json({ success: true, message: 'Registration successful, please login' });
});

// OAuth Login
app.get('/auth/forgerock', (req, res) => {
  const authUrl = `${FORGEROCK_AUTH_URL}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=openid%20profile%20email&prompt=login`;
  res.redirect(authUrl);
});

// OAuth Callback
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

    const userInfoRes = await axios.get(FORGEROCK_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const user = userInfoRes.data;
    user.role = (user.email === 'admin@example.com' || user.preferred_username === 'adminuser') ? 'admin' : 'customer';
    req.session.user = user;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth Error:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

// Dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.accessToken) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// User Info
app.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  const { name, email, username, role } = req.session.user;
  res.json({ name, email, username, role });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('https://plainid.onrender.com/?logged_out=true');
  });
});

// 🆕 Asset API Routes for PlainID
app.get('/api/assets/accounts/:id', (req, res) => {
  const asset = accounts.find(a => a.id === req.params.id);
  if (asset) return res.json(asset);
  res.status(404).json({ error: 'Account not found' });
});

app.get('/api/assets/branches/:id', (req, res) => {
  const asset = branches.find(b => b.id === req.params.id);
  if (asset) return res.json(asset);
  res.status(404).json({ error: 'Branch not found' });
});

app.get('/api/assets/cards/:id', (req, res) => {
  const asset = creditCards.find(c => c.id === req.params.id);
  if (asset) return res.json(asset);
  res.status(404).json({ error: 'Card not found' });
});

app.get('/api/assets/loans/:id', (req, res) => {
  const asset = loans.find(l => l.id === req.params.id);
  if (asset) return res.json(asset);
  res.status(404).json({ error: 'Loan not found' });
});

app.get('/api/assets/investments/:id', (req, res) => {
  const asset = investments.find(i => i.id === req.params.id);
  if (asset) return res.json(asset);
  res.status(404).json({ error: 'Investment not found' });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
