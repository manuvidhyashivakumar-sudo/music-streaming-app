const Song = require("../models/Song");

const sampleSongs = [
  {
    title: "Shape Of You",
    artist: "Ed Sheeran",
    album: "Divide",
    genre: "Pop",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    likes: 154,
    comments: [{ user: "Jane", text: "This song never gets old." }],
  },
  {
    title: "Believer",
    artist: "Imagine Dragons",
    album: "Evolve",
    genre: "Rock",
    imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    likes: 98,
    comments: [{ user: "Mike", text: "Great energy for workouts." }],
  },
  {
    title: "Perfect",
    artist: "Ed Sheeran",
    album: "Divide",
    genre: "Ballad",
    imageUrl: "https://images.unsplash.com/photo-1501612780327-45045538702b",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    likes: 112,
    comments: [{ user: "Anna", text: "Beautiful vocals." }],
  },
  {
    title: "Lose Yourself",
    artist: "Eminem",
    album: "8 Mile",
    genre: "Hip Hop",
    imageUrl: "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    likes: 142,
    comments: [{ user: "Tony", text: "Classic motivational track." }],
  },
  {
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    genre: "Synth Pop",
    imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    likes: 130,
    comments: [{ user: "Lisa", text: "Such a smooth production." }],
  },
  {
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    album: "Fine Line",
    genre: "Pop",
    imageUrl: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    likes: 148,
    comments: [{ user: "Sam", text: "Feels like summer." }],
  },
  {
    title: "Thunder",
    artist: "Imagine Dragons",
    album: "Evolve",
    genre: "Rock",
    imageUrl: "https://images.unsplash.com/photo-1485579149621-3123dd979885",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    likes: 99,
    comments: [{ user: "David", text: "Great stadium energy." }],
  },
  {
    title: "Someone Like You",
    artist: "Adele",
    album: "21",
    genre: "Ballad",
    imageUrl: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    likes: 122,
    comments: [{ user: "Mia", text: "So emotional." }],
  },
  {
    title: "Humble",
    artist: "Kendrick Lamar",
    album: "Damn",
    genre: "Hip Hop",
    imageUrl: "https://images.unsplash.com/photo-1516684669134-de6f4b8c4b3a",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    likes: 165,
    comments: [{ user: "Josh", text: "Powerful beat." }],
  },
  {
    title: "Starboy",
    artist: "The Weeknd",
    album: "Starboy",
    genre: "Synth Pop",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    likes: 121,
    comments: [{ user: "Nina", text: "Great vibe." }],
  },
  {
    title: "Uptown Funk",
    artist: "Mark Ronson",
    album: "Uptown Special",
    genre: "Funk",
    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    likes: 184,
    comments: [{ user: "Eli", text: "Instant dance floor hit." }],
  },
  {
    title: "Dance Monkey",
    artist: "Tones and I",
    album: "The Kids Are Coming",
    genre: "Pop",
    imageUrl: "https://images.unsplash.com/photo-1500534623283-312aade485b7",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    likes: 138,
    comments: [{ user: "Rae", text: "Can't stop singing it." }],
  },
  {
    title: "Radioactive",
    artist: "Imagine Dragons",
    album: "Night Visions",
    genre: "Rock",
    imageUrl: "https://images.unsplash.com/photo-1497032205916-ac775f0649ae",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
    likes: 130,
    comments: [{ user: "Leo", text: "Super intense." }],
  },
  {
    title: "Someone You Loved",
    artist: "Lewis Capaldi",
    album: "Divinely Uninspired to a Hellish Extent",
    genre: "Ballad",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
    likes: 105,
    comments: [{ user: "Eva", text: "Touching and raw." }],
  },
  {
    title: "SICKO MODE",
    artist: "Travis Scott",
    album: "Astroworld",
    genre: "Hip Hop",
    imageUrl: "https://images.unsplash.com/photo-1528408329260-e06f0403d1a8",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
    likes: 158,
    comments: [{ user: "Ava", text: "Hard-hitting track." }],
  },
  {
    title: "Blinding Lights (Remix)",
    artist: "The Weeknd",
    album: "After Hours",
    genre: "Synth Pop",
    imageUrl: "https://images.unsplash.com/photo-1497032205916-ac775f0649ae",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
    likes: 119,
    comments: [{ user: "Olly", text: "The mood is perfect." }],
  },
  {
    title: "Shallow",
    artist: "Lady Gaga & Bradley Cooper",
    album: "A Star Is Born",
    genre: "Ballad",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3",
    likes: 140,
    comments: [{ user: "Maddie", text: "So dramatic and beautiful." }],
  },
  {
    title: "Can’t Stop",
    artist: "Red Hot Chili Peppers",
    album: "By the Way",
    genre: "Rock",
    imageUrl: "https://images.unsplash.com/photo-1497032205916-ac775f0649ae",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-18.mp3",
    likes: 126,
    comments: [{ user: "Adam", text: "A rock anthem." }],
  },
  {
    title: "Circles",
    artist: "Post Malone",
    album: "Hollywood’s Bleeding",
    genre: "Pop",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-19.mp3",
    likes: 132,
    comments: [{ user: "Noah", text: "Super catchy." }],
  },
  {
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    genre: "Synth Pop",
    imageUrl: "https://images.unsplash.com/photo-1497032205916-ac775f0649ae",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-20.mp3",
    likes: 143,
    comments: [{ user: "Mila", text: "Perfect dance energy." }],
  },
  {
    title: "Heat Waves",
    artist: "Glass Animals",
    album: "Dreamland",
    genre: "Alternative",
    imageUrl: "https://images.unsplash.com/photo-1497032205916-ac775f0649ae",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-21.mp3",
    likes: 128,
    comments: [{ user: "Noel", text: "Great late-night vibe." }],
  },
];

let fallbackSongStore = sampleSongs.map((song, index) => ({ ...song, _id: String(index + 1) }));

const getFallbackSongs = () => fallbackSongStore.map((song) => ({ ...song }));

const isMongoAvailable = () => {
  try {
    return require("mongoose").connection.readyState === 1;
  } catch {
    return false;
  }
};

exports.createSong = async (req, res) => {
  try {
    if (!isMongoAvailable()) {
      const newSong = { ...req.body, _id: `${Date.now()}` };
      fallbackSongStore = [newSong, ...fallbackSongStore];
      return res.status(201).json(newSong);
    }

    const song = await Song.create(req.body);
    res.status(201).json(song);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.getSongs = async (req, res) => {
  try {
    if (!isMongoAvailable()) {
      const search = (req.query.search || "").toLowerCase();
      const filtered = search
        ? getFallbackSongs().filter((song) => {
            const haystack = `${song.title} ${song.artist} ${song.album} ${song.genre}`.toLowerCase();
            return haystack.includes(search);
          })
        : getFallbackSongs();
      return res.json(filtered.slice(0, 20));
    }

    const search = req.query.search || "";
    const query = search
      ? {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { artist: { $regex: search, $options: "i" } },
            { album: { $regex: search, $options: "i" } },
            { genre: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const songs = await Song.find(query).sort({ title: 1 }).limit(20);
    res.json(songs);
  } catch (error) {
    res.status(500).json(getFallbackSongs());
  }
};

exports.getSongById = async (req, res) => {
  try {
    if (!isMongoAvailable()) {
      const song = getFallbackSongs().find((item) => item._id === req.params.id || item.id === req.params.id);
      if (!song) {
        return res.status(404).json({ message: "Song not found" });
      }
      return res.json(song);
    }

    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }
    res.json(song);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.likeSong = async (req, res) => {
  try {
    if (!isMongoAvailable()) {
      const song = getFallbackSongs().find((item) => item._id === req.params.id || item.id === req.params.id);
      if (!song) {
        return res.status(404).json({ message: "Song not found" });
      }
      const updatedSong = { ...song, likes: (song.likes || 0) + 1 };
      fallbackSongStore = fallbackSongStore.map((item) => (item._id === req.params.id || item.id === req.params.id ? updatedSong : item));
      return res.json(updatedSong);
    }

    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true },
    );
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }
    res.json(song);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.addComment = async (req, res) => {
  try {
    if (!isMongoAvailable()) {
      const song = getFallbackSongs().find((item) => item._id === req.params.id || item.id === req.params.id);
      if (!song) {
        return res.status(404).json({ message: "Song not found" });
      }
      const updatedSong = {
        ...song,
        comments: [
          ...(song.comments || []),
          {
            user: req.body.user || "Guest",
            text: req.body.text,
            createdAt: new Date().toISOString(),
          },
        ],
      };
      fallbackSongStore = fallbackSongStore.map((item) => (item._id === req.params.id || item.id === req.params.id ? updatedSong : item));
      return res.json(updatedSong);
    }

    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    song.comments.push({
      user: req.body.user || "Guest",
      text: req.body.text,
      createdAt: new Date(),
    });
    await song.save();

    res.json(song);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.seedSongs = async () => {
  for (const sampleSong of sampleSongs) {
    await Song.findOneAndUpdate(
      { title: sampleSong.title, artist: sampleSong.artist },
      { $set: sampleSong },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
  const count = await Song.countDocuments();
  console.log(`Song collection has ${count} item${count === 1 ? "" : "s"}.`);
};