const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const app = express();
const sqlite3 = require("sqlite3").verbose();
const PORT = 3000;
const { hashPassword, comparePasswords } = require("./assets/js/script.js");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv").config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(cookieParser());

function verifyToken(req, res, next) {
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log("token", token);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      console.log(req.user);
      next();
    } catch (error) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }
  if (!token) {
    return res.status(401).json({ error: "Unauthorized, no token" });
  }
}

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

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
        const token = generateToken(row.id);
        res.cookie("token", token, { expiresIn: "30d", httpOnly: true });
        return res.redirect("/profile");
      } else {
        return res.status(400).json({ error: "Invalid credentials" });
      }
    } else {
      return res.status(400).json({ error: "Invalid credentials" });
    }
  });
});

app.get("/profile", verifyToken, (req, res) => {
  res.sendFile(path.join(__dirname, "/pages/profile.html"));
});

app.get("/userData", verifyToken, (req, res) => {
  const userId = req.user.id;
  db.get("SELECT email FROM users WHERE id = ?", [userId], (error, row) => {
    if (error) {
      console.error("DB error", error.message);
      return res.status(500).json({ error: "DB error" });
    }
    res.json({
      email: row.email,
    });
  });
});

app.post("/updateEmail", verifyToken, (req, res) => {
  const { newEmail } = req.body;
  if (req.user.id) {
    const userId = req.user.id;
    db.run("UPDATE users SET email = ? WHERE id = ?", [newEmail, userId]);
    res.redirect("/profile");
  } else {
    res.redirect("/login");
  }
});

app.post("/updatePassword", verifyToken, async (req, res) => {
  const { password, newPassword, confirmPassword } = req.body;
  if (req.user) {
    if (newPassword === confirmPassword) {
      const userId = req.user.id;
      db.get(
        "SELECT * FROM users WHERE id = ?",
        [userId],
        async (error, row) => {
          if (error) {
            return res.status(500).json({ error: error.message });
          }
          if (row) {
            const match = await comparePasswords(password, row.password);
            const hashedPassword = await hashPassword(newPassword);
            if (match) {
              db.run("UPDATE users SET password = ? WHERE id = ?", [
                hashedPassword,
                userId,
              ]);
              return res.redirect("/profile");
            } else {
              return res.status(400).json({ error: "Incorrect password" });
            }
          }
        }
      );
    } else {
      return res.status(400).json({ error: "Passwords not match" });
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/isLoggedIn", (req, res) => {
  if (req.cookies && req.cookies.token) {
    res.json({ loggedIn: true });
  } else {
    res.json({ loggedIn: false });
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
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

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "/pages/about.html"));
});

app.get("/help", (req, res) => {
  res.sendFile(path.join(__dirname, "/pages/help.html"));
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
