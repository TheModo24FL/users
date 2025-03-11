const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

let users = [];

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  users.push({ email, password });
  res.redirect("/login");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (user) {
    req.session.user = user;
    res.redirect("/profile");
  } else {
    res.send("Invalid credentials");
  }
});

app.get("/profile", (req, res) => {
  if (req.session.user) {
    res.send(`
            <h1>Profile</h1>
            <p>Welcome, ${req.session.user.email}</p>
            <button onclick="editEmail()">Edit email</button>
            <button onclick="editPassword()">Edit password</button>
            <button onclick="logout()">Logout</button>
            <script>
                function logout() {
                    fetch('/logout').then(() => {
                        window.location.href = '/login';
                    });
                }
                function editEmail() {
                    window.location.href = '/editEmail';
                }
                 function editPassword() {
                    window.location.href = '/editPassword';
                }
            </script>
        `);
  } else {
    res.redirect("/login");
  }
});


app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

app.use('/assets', express.static(path.join(__dirname, 'assets')))

app.use(express.static(path.join(__dirname, "proiect-gestionare-utilizatori")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/pages/index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "/pages/login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "/pages/register.html"));
});

app.get("/editEmail", (req, res) => {
  if (req.session.user) {
    res.send(`
            <h1>Edit email</h1>
            <form action="/updateEmail" method="POST">
                <label for="email">Current email:</label>
                <input type="email" id="email" name="email" value="${req.session.user.email}" readonly>
                <label for="newEmail">New Email:</label>
                <input type="email" id="newEmail" name="newEmail" required>
                <button type="submit">Submit</button>
            </form>
        `);
  } else {
    res.redirect("/login");
  }
});

app.get("/editPassword", (req, res) => {
    if (req.session.user) {
      res.send(`
              <h1>Edit password</h1>
              <form action="/updatePassword" method="POST">
                  <label for="password">Current password:</label>
                  <input type="password" id="password" name="password" required>
                  <label for="newPassword">New Password:</label>
                  <input type="password" id="newPassword" name="newPassword" required>
                  <button type="submit">Submit</button>
              </form>
          `);
    } else {
      res.redirect("/login");
    }
  });

app.post("/updateEmail", (req, res) => {
    const { newEmail } = req.body;
    if (req.session.user){
        const user = users.find((u) => u.email === req.session.user.email);
        user.email = newEmail;
        req.session.user = user;
        res.redirect("/profile");
    }
    else{
        res.redirect("/login")
    }
  });

app.post("/updatePassword", (req, res) => {
    const { password, newPassword } = req.body;
    if (req.session.user){
        const user = users.find((u) => u.email === req.session.user.email);
        if (password === req.session.user.password){
            user.password = newPassword;
            req.session.user = user;
            res.redirect("/profile")
        }
        else{
            res.send("Incorrect password")
        }
    }
    else{
        res.redirect("/login")
    }
  });
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
