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
const PgStore = pgSession(session);

// Database setup with error handling
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          ca: fs.readFileSync("./certs/ca.pem").toString(),
        }
      : false,
});

db.connect()
  .then(() => console.log("Database connected successfully"))
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Session configuration
app.use(
  session({
    store: new PgStore({
      pool: db,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      domain:
        process.env.NODE_ENV === "production"
          ? "secret-xb7x.onrender.com"
          : undefined,
    },
    name: "sessionId",
  })
);

app.use(passport.initialize());
app.use(passport.session());

// CORS headers middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }
  next();
};

// Session check route
app.get("/api/check-auth", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      success: true,
      isAuthenticated: true,
      user: {
        id: req.user.id,
        email: req.user.email,
      },
    });
  } else {
    res.json({
      success: false,
      isAuthenticated: false,
    });
  }
});

// Logout route with proper session cleanup
app.get("/api/logout", (req, res) => {
  const cookies = req.cookies;
  for (const cookie in cookies) {
    res.clearCookie(cookie, {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain:
        process.env.NODE_ENV === "production"
          ? "secret-xb7x.onrender.com"
          : undefined,
    });
  }

  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Error during logout" });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error destroying session" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });
});

// Protected secrets route
app.get("/api/secrets", isAuthenticated, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT secret_id, secret, created_at FROM secrets WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ success: true, secrets: result.rows });
  } catch (err) {
    console.error("Error retrieving secrets:", err);
    res
      .status(500)
      .json({ success: false, message: "Error retrieving secrets" });
  }
});

// Login route with enhanced error handling
app.post("/api/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error during login",
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info.message || "Invalid credentials",
      });
    }

    req.login(user, (err) => {
      if (err) {
        console.error("Session error:", err);
        return res.status(500).json({
          success: false,
          message: "Error establishing session",
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
      });
    });
  })(req, res, next);
});

// Registration route with validation
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    const userExists = await db.query("SELECT id FROM users WHERE email = $1", [
      username,
    ]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [username, hash]
    );

    req.login(result.rows[0], (err) => {
      if (err) {
        console.error("Login error after registration:", err);
        return res.status(500).json({
          success: false,
          message: "Error logging in after registration",
        });
      }
      res.json({
        success: true,
        user: {
          id: result.rows[0].id,
          email: result.rows[0].email,
        },
      });
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({
      success: false,
      message: "Error during registration",
    });
  }
});

// Google OAuth routes
app.get(
  "/api/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
  }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/secrets`);
  }
);

// Passport configuration
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [
        username,
      ]);
      if (result.rows.length === 0) {
        return done(null, false, { message: "User not found" });
      }

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return done(null, false, { message: "Invalid password" });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
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
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          email,
        ]);

        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, "google-oauth"]
          );
          return done(null, newUser.rows[0]);
        }

        return done(null, result.rows[0]);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, { id: user.id, email: user.email });
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Global error handler
app.use(errorHandler);

// Server startup
app
  .listen(port, () => {
    console.log(`Server running on port ${port}`);
  })
  .on("error", (err) => {
    console.error("Server startup error:", err);
    process.exit(1);
  });

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});
