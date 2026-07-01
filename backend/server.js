const express = require("express");
const cors = require("cors");
const songRoutes = require("./routes/songRoutes");
const playlistRoutes = require("./routes/playlistRoutes");
const authRoutes = require("./routes/authRoutes");
const { seedSongs } = require("./controllers/songController");
const { seedDefaultUser } = require("./controllers/authController");
const connectDB = require("./config/database");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());


const PORT = process.env.PORT || 5000;


app.get("/", (req, res) => {
  res.send("Music Streaming API Running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/playlists", playlistRoutes);


