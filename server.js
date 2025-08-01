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
