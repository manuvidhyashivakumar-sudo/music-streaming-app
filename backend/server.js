const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const songRoutes = require("./routes/songRoutes");
const playlistRoutes = require("./routes/playlistRoutes");
const authRoutes = require("./routes/authRoutes");
const { seedSongs } = require("./controllers/songController");
const { seedDefaultUser } = require("./controllers/authController");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.set("strictQuery", false);
mongoose.set("bufferCommands", false);

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to database.");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err.message || err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("Mongoose disconnected from database.");
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI?.trim();
const localMongoUri = "mongodb://127.0.0.1:27017/musicdb";

const connectToMongo = async (uri) => {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
};

const startServer = async () => {
  try {
    const uri = MONGO_URI || localMongoUri;
    console.log("MONGO_URI =", process.env.MONGO_URI);
    if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is not set");
  process.exit(1);
}
    await connectToMongo(uri);
    console.log(`MongoDB Connected (${uri.startsWith("mongodb+srv") ? "Atlas" : "Local"})`);
    await seedSongs();
    await seedDefaultUser();
    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection failed:", err.message || err);
    if (MONGO_URI && MONGO_URI !== localMongoUri) {
      console.warn("Falling back to local MongoDB at", localMongoUri);
      try {
        await connectToMongo(localMongoUri);
        console.log("MongoDB Connected (Local)");
        await seedSongs();
        await seedDefaultUser();
        app.listen(PORT, () => {
          console.log(`Server running on ${PORT}`);
        });
      } catch (fallbackError) {
        console.error("Local MongoDB connection failed:", fallbackError.message || fallbackError);
        console.error("Please start MongoDB locally or fix your MONGO_URI.");
        process.exit(1);
      }
    } else {
      console.error("Please start MongoDB locally or provide a valid MONGO_URI.");
      process.exit(1);
    }
  }
};

app.get("/", (req, res) => {
  res.send("Music Streaming API Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/playlists", playlistRoutes);

startServer();
