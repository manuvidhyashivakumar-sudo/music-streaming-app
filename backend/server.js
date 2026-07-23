const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const songRoutes = require("./routes/songRoutes");
const playlistRoutes = require("./routes/playlistRoutes");
const authRoutes = require("./routes/authRoutes");
const connectDB = require("./config/database");
const { seedSongs } = require("./controllers/songController");
const { seedDefaultUser } = require("./controllers/authController");
const { getJwtSecret } = require("./utils/jwtSecret");
require("dotenv").config();

const app = express();

try {
  getJwtSecret();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const configuredFrontendOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_ORIGIN,
  process.env.CLIENT_URL,
  process.env.APP_URL,
  process.env.NETLIFY_URL,
  process.env.VERCEL_URL ? `https://${String(process.env.VERCEL_URL).replace(/^https?:\/\//i, "")}` : "",
  ...(String(process.env.FRONTEND_URLS || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)),
];

const explicitConfiguredFrontendOrigins = configuredFrontendOrigins
  .filter(Boolean)
  .map((origin) => String(origin).trim())
  .filter((origin) => !/^https?:\/\/(localhost|127\.0\.0\.1|::1)(:\d+)?\/?$/i.test(origin));

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  ...configuredFrontendOrigins,
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, ""));

const allowAllOrigins = String(process.env.CORS_ALLOW_ALL || "").toLowerCase() === "true";
const allowHttpsOriginsWhenNoExplicitConfig = explicitConfiguredFrontendOrigins.length === 0;

const isAllowedLocalDevOrigin = (origin) => {
  try {
    const parsed = new URL(origin);
    if (!/^https?:$/i.test(parsed.protocol)) return false;
    const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
    return isLocalHost;
  } catch {
    return false;
  }
};

const isEditorOrigin = (origin) => {
  const normalized = String(origin || "").toLowerCase();
  return normalized.startsWith("vscode-file://") || normalized.startsWith("vscode-webview://");
};

const isAllowedHostedFrontendOrigin = (origin) => {
  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname.toLowerCase();
    return (
      /\.netlify\.app$/i.test(hostname) ||
      /\.vercel\.app$/i.test(hostname) ||
      /\.onrender\.com$/i.test(hostname) ||
      /\.github\.io$/i.test(hostname)
    );
  } catch {
    return false;
  }
};

const isSafeHttpsOrigin = (origin) => {
  try {
    const parsed = new URL(origin);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients and same-origin requests without an Origin header.
      if (!origin) return callback(null, true);
      if (allowAllOrigins) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, "");
      if (allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      if (isAllowedLocalDevOrigin(normalizedOrigin) || isEditorOrigin(normalizedOrigin)) {
        return callback(null, true);
      }
      if (isAllowedHostedFrontendOrigin(normalizedOrigin)) {
        return callback(null, true);
      }

      if (allowHttpsOriginsWhenNoExplicitConfig && isSafeHttpsOrigin(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Accept", "Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Music Streaming API Running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api", (req, res) => {
  res.json({ status: "ok", service: "music-streaming-api" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/playlists", playlistRoutes);

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && Object.prototype.hasOwnProperty.call(error, "body")) {
    return res.status(400).json({ message: "Invalid JSON request body." });
  }
  return next(error);
});

const startServer = async () => {
  try {
    if (process.env.MONGO_URI) {
      await connectDB();
      await seedSongs();
    } else {
      console.warn("MONGO_URI not set. Running in local fallback mode without MongoDB.");
    }

    await seedDefaultUser();
  } catch (error) {
    console.warn("Database initialization skipped:", error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();


