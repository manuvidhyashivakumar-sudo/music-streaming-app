const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    artist: {
      type: String,
      required: true,
    },

    album: String,

    movie: String,

    genre: String,

    imageUrl: String,

    audioUrl: String,

    likes: {
      type: Number,
      default: 0,
    },

    comments: [
      {
        user: {
          type: String,
          default: "Guest",
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Song", songSchema);