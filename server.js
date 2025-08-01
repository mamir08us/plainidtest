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

const users = {
    'testuser': { password: 'password123', role: 'customer' },
    'adminuser': { password: 'adminpass', role: 'admin' }
};

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users[username];

    if (user && user.password === password) {
        res.json({
            success: true,
            message: 'Login successful',
            role: user.role // ✅ This is what your frontend uses
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid username or password'
        });
    }
});


// Example protected route (after successful login)
//app.get('/dashboard', (req, res) => {
//    res.send('<h1>Welcome to the Dashboard!</h1><p>You have successfully logged in.</p>');
//});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});