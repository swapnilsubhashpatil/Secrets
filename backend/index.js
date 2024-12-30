import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcrypt";
import fs from "fs";
import env from "dotenv";
import pgSession from "connect-pg-simple";

env.config();
const app = express();
const port = process.env.PORT || 3000;

// Database setup
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl: {
    ca: fs.readFileSync("./certs/ca.pem").toString(),
  },
});

db.connect();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST"],
  })
);

app.use(
  session({
    store: new PgStore({
      pool: db,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // Required for HTTPS
      sameSite: "none", // Required for cross-domain
      httpOnly: true, // Prevents client-side access to the cookie
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: "secretsfrontend.vercel.app", // Your Vercel domain
    },
    name: "sessionId", // Custom cookie name
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Origin",
    "https://secretsfrontend.vercel.app"
  );
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/api/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/api/check-auth", (req, res) => {
  console.log("Session:", req.session);
  console.log("User:", req.user);
  if (req.isAuthenticated()) {
    res.status(200).json({ message: "Authenticated" });
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

app.get("/api/secrets", async (req, res) => {
  console.log(`Received ${req.method} request at ${req.url}`);
  console.log("Is Authenticated:", req.isAuthenticated());

  if (req.isAuthenticated()) {
    try {
      const result = await db.query(
        "SELECT secret_id, secret FROM secrets WHERE user_id = $1 ORDER BY created_at DESC",
        [req.user.id]
      );
      console.log("Secrets retrieved successfully:", result.rows);
      res.json({ secrets: result.rows });
    } catch (err) {
      console.error("Error retrieving secrets:", err);
      res.status(500).json({ error: "Error retrieving secrets" });
    }
  } else {
    console.log("User not authenticated. Redirecting to /login.");
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.get(
  "/api/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    failureRedirect: process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/login`
      : "http://localhost:5175/login",
  }),
  (req, res) => {
    res.redirect(
      process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/secrets`
        : "http://localhost:5175/secrets"
    );
  }
);

app.post("/api/login", async (req, res, next) => {
  try {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: info.message || "Invalid credentials",
        });
      }

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Failed to establish session",
          });
        }

        return res.status(200).json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
          },
        });
      });
    })(req, res, next);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
});

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userExists = await db.query("SELECT * FROM users WHERE email = $1", [
      username,
    ]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
      [username, hash]
    );
    req.login(result.rows[0], (err) => {
      if (err) return res.status(500).json({ message: "Error logging in" });
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/submit", async (req, res) => {
  const { secret, secretId } = req.body;

  try {
    if (secretId) {
      const result = await db.query(
        "UPDATE secrets SET secret = $1 WHERE secret_id = $2 AND user_id = $3 RETURNING secret_id",
        [secret, secretId, req.user.id]
      );
      res.json({ secret_id: result.rows[0].secret_id });
    } else {
      const result = await db.query(
        "INSERT INTO secrets (user_id, secret) VALUES ($1, $2) RETURNING secret_id",
        [req.user.id, secret]
      );
      res.json({ secret_id: result.rows[0].secret_id });
    }
  } catch (err) {
    console.error("Error saving secret:", err);
    res.status(500).json({ error: "Error saving secret" });
  }
});

app.post("/api/secrets/delete", async (req, res) => {
  const { secretId } = req.body;

  try {
    await db.query(
      "DELETE FROM secrets WHERE secret_id = $1 AND user_id = $2",
      [secretId, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error deleting the secret" });
  }
});

passport.use(
  new LocalStrategy(async (username, password, cb) => {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password);
        return valid
          ? cb(null, user)
          : cb(null, false, { message: "Invalid password" });
      }
      return cb(null, false, { message: "User not found" });
    } catch (err) {
      return cb(err);
    }
  })
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const email = profile.emails[0].value;
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          email,
        ]);

        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, "google"]
          );
          return cb(null, newUser.rows[0]);
        }
        return cb(null, result.rows[0]);
      } catch (err) {
        return cb(err);
      }
    }
  )
);

passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((user, cb) => cb(null, user));

app.listen(port, () => {
  console.log(`Server running`);
});
