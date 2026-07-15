const express = require("express");
const cors = require("cors");
const songRoutes = require("./routes/songRoutes");
const playlistRoutes = require("./routes/playlistRoutes");
const authRoutes = require("./routes/authRoutes");
const connectDB = require("./config/database");
const { seedSongs } = require("./controllers/songController");
const { seedDefaultUser } = require("./controllers/authController");
require("dotenv").config();

const app = express();

process.env.JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  process.env.FRONTEND_URL,
  process.env.NETLIFY_URL,
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, ""));

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
      if (isNetlifyOrigin) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin not allowed"));
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Authorization", "X-Auth-Token"],
    credentials: true,
  }),
);
app.use(express.json());

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

const startServer = async () => {
  try {
    if (process.env.MONGO_URI) {
      await connectDB();
      await seedDefaultUser();
      await seedSongs();
    } else {
      console.warn("MONGO_URI not set. Running in local fallback mode without MongoDB.");
    }
  } catch (error) {
    console.warn("Database initialization skipped:", error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();


