const express = require('express');
const axios = require('axios');
const session = require('express-session');
const path = require('path');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const {
  FORGEROCK_AUTH_URL,
  FORGEROCK_TOKEN_URL,
  FORGEROCK_USERINFO_URL,
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
} = process.env;

const app = express();
const port = process.env.PORT || 3000;

// Helper: generate IDs like 'Axxxxxxxxx' (length 10)
function generateId(prefix = '', length = 10) {
  return prefix + uuidv4().replace(/-/g, '').substring(0, length - prefix.length);
}

// PostgreSQL pool setup
const pool = new Pool({
  host: process.env.PGHOST || 'ec2-3-145-200-54.us-east-2.compute.amazonaws.com',
  user: process.env.PGUSER || 'teiid',
  password: process.env.PGPASSWORD || 'teiidpass',
  database: process.env.PGDATABASE || 'bankdb',
  port: Number(process.env.PGPORT || 5432),
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
});

// Ensure users.email column exists (idempotent)
(async () => {
  try {
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'email'
        ) THEN
          ALTER TABLE public.users ADD COLUMN email VARCHAR(255);
        END IF;
      END $$;
    `);
  } catch (e) {
    console.warn('⚠️ Could not ensure users.email column:', e.message);
  }
})();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

// -----------------------------
// Local login from PostgreSQL
// -----------------------------
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // NOTE: For demo parity with your original code, this uses plain password compare.
    // In production, store hashed passwords (bcrypt) and compare securely.
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      req.session.user = { username: user.username, role: user.role, email: user.email || null };
      req.session.accessToken = 'static';
      return res.json({ success: true, role: user.role, message: 'Login successful' });
    }
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// -----------------------------
// Register user into DB
// -----------------------------
app.post('/register', async (req, res) => {
  const { username, password, email, role } = req.body;

  // role optional; default to 'customer' if not provided
  const resolvedRole = role || 'customer';

  try {
    const existing = await pool.query('SELECT 1 FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    await pool.query(
      'INSERT INTO users (username, password, role, email) VALUES ($1, $2, $3, $4)',
      [username, password, resolvedRole, email || null]
    );
    res.json({ success: true, message: 'Registration successful' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// -----------------------------
// OAuth login and callback (ForgeRock)
// -----------------------------
app.get('/auth/forgerock', (req, res) => {
  if (!FORGEROCK_AUTH_URL || !CLIENT_ID || !REDIRECT_URI) {
    return res.status(500).send('ForgeRock env vars not configured');
  }
  const authUrl =
    `${FORGEROCK_AUTH_URL}?response_type=code&client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=openid%20profile%20email&prompt=login`;
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!FORGEROCK_TOKEN_URL || !FORGEROCK_USERINFO_URL || !CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    return res.status(500).send('ForgeRock env vars not configured');
  }
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

    const user = userInfoRes.data || {};
    user.role = (user.email === 'admin@example.com' || user.preferred_username === 'adminuser') ? 'admin' : 'customer';
    req.session.user = user;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

// -----------------------------
// Users CRUD (PIP)
// -----------------------------

// List users
app.get('/pip/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user
app.post('/pip/users', async (req, res) => {
  const { username, password, role, email } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'username, password, and role are required' });
  }
  try {
    await pool.query(
      'INSERT INTO users (username, password, role, email) VALUES ($1, $2, $3, $4)',
      [username, password, role, email || null]
    );
    res.json({ message: 'User added' });
  } catch (err) {
    console.error('Insert user error:', err);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// Update user (email, role) by id
app.put('/pip/users/:id', async (req, res) => {
  const { id } = req.params;
  const { email, role } = req.body;
  if (email == null && role == null) {
    return res.status(400).json({ error: 'Nothing to update' });
  }
  try {
    if (email != null && role != null) {
      await pool.query('UPDATE users SET email = $1, role = $2 WHERE id = $3', [email, role, id]);
    } else if (email != null) {
      await pool.query('UPDATE users SET email = $1 WHERE id = $2', [email, id]);
    } else if (role != null) {
      await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    }
    res.json({ message: 'User updated' });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user by id
app.delete('/pip/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// -----------------------------
// Branches
// -----------------------------
app.get('/pip/branches', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM branches ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch branches error:', err);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

app.post('/pip/branches', async (req, res) => {
  const { name, location, id } = req.body;
  const branchId = id || generateId('B');
  try {
    await pool.query('INSERT INTO branches (id, name, location) VALUES ($1, $2, $3)', [branchId, name, location]);
    res.json({ message: 'Branch created' });
  } catch (err) {
    console.error('Insert branch error:', err);
    res.status(500).json({ error: 'Failed to add branch' });
  }
});

// -----------------------------
// Accounts
// -----------------------------
app.get('/pip/accounts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM accounts ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch accounts error:', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
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

// -----------------------------
// Other routes
// -----------------------------
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
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect(process.env.LOGOUT_REDIRECT || 'https://plainid.onrender.com/?logged_out=true');
  });
});

// -----------------------------
// Start server
// -----------------------------
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
