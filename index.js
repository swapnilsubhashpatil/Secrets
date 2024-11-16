import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";

import session from "express-session";
import env from "dotenv";

const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  //   ssl: {
  //     rejectUnauthorized: true,
  //     ca: `-----BEGIN CERTIFICATE-----
  // MIIEQTCCAqmgAwIBAgIUfI1afi3bmFGk/ns2IP69LsbJG70wDQYJKoZIhvcNAQEM
  // BQAwOjE4MDYGA1UEAwwvY2E1NmMyZDEtYzIwNC00NzAwLWIyNTctOGE2OTY3ZTAw
  // ZjJjIFByb2plY3QgQ0EwHhcNMjQxMTA3MTIwMjE0WhcNMzQxMTA1MTIwMjE0WjA6
  // MTgwNgYDVQQDDC9jYTU2YzJkMS1jMjA0LTQ3MDAtYjI1Ny04YTY5NjdlMDBmMmMg
  // UHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBAL81WpzH
  // 4/hwXfDmpQ1/tICQNU4wblRR59wT+UPy4xKKkfk4rpjcvqiP7gWmuolYdCpl9EuG
  // S7GZ5TrT+/sK5efWr5xrWF32sYFRD0Ku/oyC/6ckW8Djhhy44XqaEWgRj6UidWz+
  // On3pepixc4hJAugTdL8KcY7737cPiviTlqh5izKcJ3aOmdN4XPA6E9HG3nrX6VuZ
  // U3R+fnd45tScQ5kGgdCE4GocK2jtm25wpvnkTZGw17KP0PChcKSGB0lLSA9cpn/M
  // Ts/OKJfxC6CQl8r/cKPzb/34ZdnlaG8h2YhkmvSdDK6imP3Sos+oLXmx1sDkQhM8
  // YhwtWloUwR/0ISuUUxJRdhzvJ1MaipzfnOUfJmn2/7Zlt0UfozOjQCvhJzaf69L+
  // tb106dVECSegcEKdOKKUAPvZsq83ES1qVuc7j9K8m4RZNMQYENjFFIZ/yPzskP6O
  // FLrZsRxgJlaXk/C3lf5R3N/7s3ruI2h8RGs8xN5eaFFjg+WCzuBYkjSFdQIDAQAB
  // oz8wPTAdBgNVHQ4EFgQUq+US2/yKuloaO6wLJs8qDyXIyMgwDwYDVR0TBAgwBgEB
  // /wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGBAJ6Z6bLn6WTj6/HW
  // v02R5m3HwVFwratUYA8IG2aa/vV9oRADEVaZTjlWNQrdGsXvboll2kU5zPDIlPK4
  // DABbrIyIU5Lx5wZSYM11beFW2BudyPMDVBNCWsquZ5fvolZ2mPNSIhHn7fWEpKIn
  // LAiEY7JlULmn7tQzFcLnfw2kPNgokUnGPjbeCbSiA5rjcak4I6MFIrGwVNScaH+D
  // yOmFhsuHtxLvSBsIOjnItV8vouJ9X86JDq/N+Ist/v7hYaVqMpU2zAiIwPEcDoCf
  // waYQuR+O4DhL24ZFYSqqlpDqxo8+hIVSeGubT7nA28inKF7aZ/bjHCwoOoyHx8no
  // VOFDi6rZG3BQxhu+ni8eLFMFCWXYRaIVvU5GLUKoZ10+ZHJ2LEJ0nEFIKJ5yyjb5
  // OBCq476W1SDma7Rk15w73fP7PTE3kZXPCUfcouWG+p1VWtTkr1LmQrl6YHEtjKNx
  // qCdr/OqIis0NfFHwnqwM+73DBdd4au8N2rNbze7Jb8J/Yebh0A==
  // -----END CERTIFICATE-----`,
  //   },
});

db.connect();

app.get("/", (req, res) => {
  let isMobile = false;
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      req.headers["user-agent"]
    )
  ) {
    isMobile = true;
  }
  res.render("home.ejs", { isMobile: isMobile });
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/secrets", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const result = await db.query(
        "SELECT secret_id, secret FROM secrets WHERE user_id = $1 ORDER BY created_at DESC", // Include secret_id in the query
        [req.user.id]
      );
      res.render("secrets.ejs", { secrets: result.rows, user_id: req.user.id });
    } catch (err) {
      console.error("Error retrieving secrets:", err);
      res.send("Error retrieving secrets");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit.ejs");
  } else {
    res.redirect("/login");
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.get("/contact", (req, res) => {
  const receiverEmail = "patilswapnilsubhash@gmail.com";
  const subject = "Contacting from Secrets Website";
  const body = "Hello,";

  const mailtoUrl = `mailto:${receiverEmail}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  res.redirect(mailtoUrl);
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.redirect("/login");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("success");
            res.redirect("/secrets");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/submit", async (req, res) => {
  const submittedSecret = req.body.secret;
  try {
    await db.query("INSERT INTO secrets (user_id, secret) VALUES ($1, $2)", [
      req.user.id,
      submittedSecret,
    ]);
    res.redirect("/secrets");
  } catch (err) {
    console.error("Error saving secret:", err);
    res.send("Error saving secret");
  }
});

// Route to handle deletion of a secret
app.post("/secrets/delete", async (req, res) => {
  const secretId = req.body.secretId;
  const userId = req.body.user_id;

  try {
    // Delete the secret with the specified ID for the logged-in user
    await db.query(
      "DELETE FROM secrets WHERE secret_id = $1 AND user_id = $2",
      [secretId, userId]
    );

    // Redirect to the secrets page after deletion
    res.redirect("/secrets");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error deleting the secret");
  }
});

passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        console.log(profile);
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2)",
            [profile.email, "google"]
          );
          setTimeout(() => {
            return cb(null, newUser.rows[0]);
          }, 5000);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
