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

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  process.env.FRONTEND_URL,
  process.env.NETLIFY_URL,
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, ""));

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

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients and same-origin requests without an Origin header.
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, "");
      let isNetlifyOrigin = false;
      try {
        const parsed = new URL(normalizedOrigin);
        isNetlifyOrigin = /\.netlify\.app$/i.test(parsed.hostname);
      } catch {
        isNetlifyOrigin = false;
      }

      if (allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      if (isAllowedLocalDevOrigin(normalizedOrigin) || isEditorOrigin(normalizedOrigin)) {
        return callback(null, true);
      }
      if (isNetlifyOrigin) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
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

app.use("/api/auth", authRoutes);
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


