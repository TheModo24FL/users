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
    res.sendFile(path.join(__dirname, "/pages/profile.html"));
  } else {
    res.redirect("/login");
  }
});


app.get("/userData", (req, res) => {
  if (req.session.user){
    res.json({email: req.session.user.email, password: req.session.user.password})
  }
  else{
    res.status(401).json({ error: 'User not logged in'})
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
  res.sendFile(path.join(__dirname, "/pages/editEmail.html"));
});

app.get("/editPassword", (req, res) => {
  res.sendFile(path.join(__dirname, "/pages/editPassword.html"));
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
