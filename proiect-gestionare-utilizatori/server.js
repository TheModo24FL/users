const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const app = express();
const sqlite3 = require("sqlite3").verbose();
const PORT = 3000;
const { hashPassword, comparePasswords } = require("./assets/js/script.js");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

const db = new sqlite3.Database("usersDB.db");
db.run(
  `CREATE TABLE IF NOT EXISTS users ( id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, password TEXT)`
);
const insertUser = (email, password) => {
  const stmt = db.prepare("INSERT INTO users (email, password) VALUES (?,?)");
  stmt.run(email, password);
  stmt.finalize();
};

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], async (error, row) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (row) {
      return res
        .status(400)
        .json({ error: "Email associated already with an account" });
    }
    const hashedPassword = await hashPassword(password);
    insertUser(email, hashedPassword);
  });
  res.redirect("/login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], async (error, row) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (row) {
      const match = await comparePasswords(password, row.password);
      if (match) {
        req.session.user = row;
        return res.redirect("/profile");
      } else {
        return res.status(400).json({ error: "Invalid credentials" });
      }
    } else {
      return res.status(400).json({ error: "Invalid credentials" });
    }
  });
});

app.get("/profile", (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, "/pages/profile.html"));
  } else {
    res.redirect("/login");
  }
});

app.get("/userData", (req, res) => {
  if (req.session.user) {
    res.json({
      email: req.session.user.email,
      password: req.session.user.password,
    });
  } else {
    res.status(401).json({ error: "User not logged in" });
  }
});

app.post("/updateEmail", (req, res) => {
  const { newEmail } = req.body;
  if (req.session.user) {
    const currentEmail = req.session.user.email;
    db.run("UPDATE users SET email = ? WHERE email = ?", [
      newEmail,
      currentEmail,
    ]);
    req.session.user.email = newEmail;
    res.redirect("/profile");
  } else {
    res.redirect("/login");
  }
});

app.post("/updatePassword", async (req, res) => {
  const { password, newPassword } = req.body;
  if (req.session.user) {
    const currentEmail = req.session.user.email;
    db.get(
      "SELECT * FROM users WHERE email = ?",
      [currentEmail],
      async (error, row) => {
        if (error) {
          return res.status(500).json({ error: error.message });
        }
        if (row) {
          const match = await comparePasswords(password, row.password);
          const hashedPassword = await hashPassword(newPassword);
          if (match) {
            db.run("UPDATE users SET password = ? WHERE email = ?", [
              hashedPassword,
              currentEmail,
            ]);
            req.session.user.password = hashedPassword;
            return res.redirect("/profile");
          } else {
            return res.status(400).json({ error: "Incorrect password" });
          }
        }
      }
    );
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

app.use("/assets", express.static(path.join(__dirname, "assets")));

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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
