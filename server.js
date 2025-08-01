const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Static user credentials
const STATIC_USERNAME = 'testuser';
const STATIC_PASSWORD = 'password123';

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (like index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Login route
//app.post('/login', (req, res) => {
//    const { username, password } = req.body;

//    if (username === STATIC_USERNAME && password === STATIC_PASSWORD) {
//        res.json({ success: true, message: 'Login successful' });
//    } else {
//        res.status(401).json({ success: false, message: 'Invalid username or password' });
//    }
//});

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

// Login handler
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users[username];

    if (user && user.password === password) {
        res.json({
            success: true,
            message: 'Login successful',
            role: user.role
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid username or password'
        });
    }
});

// Serve dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
