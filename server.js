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
