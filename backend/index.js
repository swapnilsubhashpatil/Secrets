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
import cookieParser from "cookie-parser";

env.config();
const app = express();
const port = process.env.PORT || 3000;
const PgStore = pgSession(session);
// Create a pool for better connection management
const pool = new pg.Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl: {
    ca: fs.readFileSync("./certs/ca.pem").toString(),
  },
});
// fs.readFileSync("./certs/ca.pem").toString(),
// Test database connection

pool
  .query("SELECT NOW()")
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

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET));

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const createSessionTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);
    console.log("Session table verified/created successfully");
  } catch (err) {
    console.error("Error creating session table:", err);
    throw err;
  }
};

// Session configuration
const sessionConfig = {
  store: new PgStore({
    pool,
    tableName: "session",
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // Since Vercel uses HTTPS
    sameSite: "none", // Required for cross-domain cookies
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  name: "sessionId",
  proxy: true,
};

const initializeSessionStore = async () => {
  try {
    await createSessionTable();
    app.use(session(sessionConfig));
    console.log("Session store initialized successfully");
  } catch (err) {
    console.error("Failed to initialize session store:", err);
    process.exit(1);
  }
};

// Call the initialization function
initializeSessionStore();

// Adjust cookie security for production
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// Enhanced authentication middleware
const isAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
      redirectTo: "/login",
    });
  }
  next();
};

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
  next();
});

app.get("/", (req, res) => {
  res.json({
    status: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Session check route with detailed response
app.get("/api/check-auth", (req, res) => {
  res.json({
    success: true,
    isAuthenticated: req.isAuthenticated(),
    user: req.isAuthenticated()
      ? {
          id: req.user.id,
          email: req.user.email,
        }
      : null,
    sessionID: req.sessionID,
  });
});

// Enhanced logout route with proper cookie cleanup
app.get("/api/logout", (req, res) => {
  // Clear session cookie
  res.cookie("sessionId", "", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: new Date(0),
  });

  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({
        success: false,
        message: "Error during logout",
      });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({
          success: false,
          message: "Error destroying session",
        });
      }

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    });
  });
});

// Protected secrets routes
app.get("/api/secrets", isAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT secret_id, secret, created_at FROM secrets WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({
      success: true,
      secrets: result.rows,
    });
  } catch (err) {
    console.error("Error retrieving secrets:", err);
    res.status(500).json({
      success: false,
      message: "Error retrieving secrets",
    });
  }
});

app.post("/api/submit", isAuthenticated, async (req, res) => {
  try {
    const { secret, secretId } = req.body;

    if (!secret) {
      return res.status(400).json({
        success: false,
        message: "Secret content is required",
      });
    }

    if (secretId) {
      // Update existing secret
      const result = await pool.query(
        "UPDATE secrets SET secret = $1 WHERE secret_id = $2 AND user_id = $3 RETURNING *",
        [secret, secretId, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Secret not found or unauthorized",
        });
      }

      res.json({
        success: true,
        secret: result.rows[0],
      });
    } else {
      // Create new secret
      const result = await pool.query(
        "INSERT INTO secrets (user_id, secret) VALUES ($1, $2) RETURNING *",
        [req.user.id, secret]
      );

      res.json({
        success: true,
        secret: result.rows[0],
      });
    }
  } catch (err) {
    console.error("Error submitting secret:", err);
    res.status(500).json({
      success: false,
      message: "Error submitting secret",
    });
  }
});

app.post("/api/secrets/delete", isAuthenticated, async (req, res) => {
  try {
    const { secretId } = req.body;

    if (!secretId) {
      return res.status(400).json({
        success: false,
        message: "Secret ID is required",
      });
    }

    const result = await pool.query(
      "DELETE FROM secrets WHERE secret_id = $1 AND user_id = $2 RETURNING *",
      [secretId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Secret not found or unauthorized",
      });
    }

    res.json({
      success: true,
      message: "Secret deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting secret:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting secret",
    });
  }
});

// Enhanced login route with validation
app.post("/api/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        success: false,
        message: info?.message || "Authentication failed",
      });
    }

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error establishing session",
        });
      }

      // Set cookie explicitly
      res.cookie("sessionId", req.sessionID, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
      });
    });
  })(req, res, next);
});

// Enhanced registration route with validation
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(username)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  // Password strength validation
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters long",
    });
  }

  try {
    // Check if user already exists
    const userExists = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create new user
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [username, hash]
    );

    // Log in the newly registered user
    req.login(result.rows[0], (err) => {
      if (err) {
        console.error("Login error after registration:", err);
        return res.status(500).json({
          success: false,
          message: "Error logging in after registration",
        });
      }

      // Set session cookie
      res.cookie("sessionId", req.sessionID, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      // Return success response
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
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    session: true,
  }),
  (req, res) => {
    // Ensure user is authenticated
    if (!req.user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=auth_failed`
      );
    }

    // Set session cookie with proper security settings
    res.cookie("sessionId", req.sessionID, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Log successful authentication
    console.log("Google OAuth successful, user:", req.user.email);

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}/secrets`);
  }
);

// Passport Local Strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [
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

// Passport Google Strategy
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
        const result = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [email]
        );

        if (result.rows.length === 0) {
          const newUser = await pool.query(
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

// Server startup with enhanced error handling
app
  .listen(port, () => {
    console.log(`Server running on port ${port}`);
  })
  .on("error", (err) => {
    console.error("Server startup error:", err);
  });
