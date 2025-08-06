const express = require('express');
const axios = require('axios');
const session = require('express-session');
const path = require('path');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid'); // Add this line
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Helper function to generate IDs like 'Axxxxxxxxx' (length 10)
function generateId(prefix = '', length = 10) {
  return prefix + uuidv4().replace(/-/g, '').substring(0, length - prefix.length);
}

// PostgreSQL pool setup
const pool = new Pool({
  host: 'ec2-3-145-200-54.us-east-2.compute.amazonaws.com',
  user: 'postgres',
  password: 'teiidpass',
  database: 'postgres',
  port: 5432
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

// OAuth settings
const CLIENT_ID = 'plainid_test_app';
const CLIENT_SECRET = 'Admin@12345';
const REDIRECT_URI = 'https://plainid.onrender.com/callback';
const FORGEROCK_AUTH_URL = 'https://openam-acnemea20230705.forgeblocks.com/am/oauth2/realms/root/realms/bravo/authorize';
const FORGEROCK_TOKEN_URL = 'https://openam-acnemea20230705.forgeblocks.com/am/oauth2/realms/root/realms/bravo/access_token';
const FORGEROCK_USERINFO_URL = 'https://openam-acnemea20230705.forgeblocks.com/am/oauth2/realms/root/realms/bravo/userinfo';

// Local login from PostgreSQL
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      req.session.user = { username: user.username, role: user.role };
      req.session.accessToken = 'static';
      return res.json({ success: true, role: user.role, message: 'Login successful' });
    }
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Register user into DB
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', [username, password, 'customer']);
    res.json({ success: true, message: 'Registration successful' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// OAuth login and callback
app.get('/auth/forgerock', (req, res) => {
  const authUrl = `${FORGEROCK_AUTH_URL}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=openid%20profile%20email&prompt=login`;
  res.redirect(authUrl);
});

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
    console.error('OAuth error:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

// CRUD APIs
app.get('/pip/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, role FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/pip/users', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', [username, password, role]);
    res.json({ message: 'User added' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// Branches
app.get('/pip/branches', async (req, res) => {
  const result = await pool.query('SELECT * FROM branches');
  res.json(result.rows);
});

app.post('/pip/branches', async (req, res) => {
  const { name, location, id } = req.body;
  // generate id if not provided
  const branchId = id || generateId('B');
  try {
    await pool.query('INSERT INTO branches (id, name, location) VALUES ($1, $2, $3)', [branchId, name, location]);
    res.json({ message: 'Branch created' });
  } catch (err) {
    console.error('Insert branch error:', err);
    res.status(500).json({ error: 'Failed to add branch' });
  }
});

// Accounts
app.get('/pip/accounts', async (req, res) => {
  const result = await pool.query('SELECT * FROM accounts');
  res.json(result.rows);
});

app.post('/pip/accounts', async (req, res) => {
  const { user_id, type, balance, name } = req.body;
  const accountId = generateId('A');
  try {
    await pool.query(
      'INSERT INTO accounts (id, user_id, type, balance, name) VALUES ($1, $2, $3, $4, $5)',
      [accountId, user_id, type, balance, name || null]
    );
    res.json({ message: 'Account created' });
  } catch (err) {
    console.error('Insert account error:', err);
    res.status(500).json({ error: 'Failed to add account' });
  }
});

// Other routes
app.get('/dashboard', (req, res) => {
  if (!req.session.accessToken) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  const { name, email, username, role } = req.session.user;
  res.json({ name, email, username, role });
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    res.clearCookie('connect.sid');
    res.redirect('https://plainid.onrender.com/?logged_out=true');
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
