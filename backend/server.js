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

app.use(cors());
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


