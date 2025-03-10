const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

let users = [];

app.post('/register', (req, res) => {
    const { email, password } = req.body;
    users.push({ email, password });
    res.redirect('/pages/login.html');
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        req.session.user = user;
        res.redirect('/pages/profile.html');
    } else {
        res.send('Invalid credentials');
    }
});

app.get('/profile', (req, res) => {
    if (req.session.user) {
        res.send(`
            <h1>Profile</h1>
            <p>Welcome, ${req.session.user.email}</p>
            <button onclick="logout()">Logout</button>
            <script>
                function logout() {
                    fetch('/logout').then(() => {
                        window.location.href = '/pages/login.html';
                    });
                }
            </script>
        `);
    } else {
        res.redirect('/pages/login.html');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/pages/login.html');
});

app.use(express.static(path.join(__dirname, 'proiect-gestionare-utilizatori')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/pages/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
