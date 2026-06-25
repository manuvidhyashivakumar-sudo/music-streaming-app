import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

const MusicContext = createContext();

const fallbackSongs = [
  {
    _id: "1",
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
    _id: "2",
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
    _id: "3",
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
    _id: "4",
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
    _id: "5",
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
    _id: "6",
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
    _id: "7",
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
    _id: "8",
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
    _id: "9",
    title: "Humble",
    artist: "Kendrick Lamar",
    album: "Damn",
    genre: "Hip Hop",
    imageUrl: "https://images.unsplash.com/photo-1516684669134-de6f4b8c4b3a",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    likes: 165,
    comments: [{ user: "Ava", text: "Hard-hitting track." }],
  },
  {
    _id: "10",
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
    _id: "11",
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
    _id: "12",
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
    _id: "13",
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
    _id: "14",
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
    _id: "15",
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
    _id: "16",
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
    _id: "17",
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
    _id: "18",
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
    _id: "19",
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
    _id: "20",
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

export function MusicProvider({ children }) {
  const [songs, setSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authError, setAuthError] = useState("");
  const audioRef = useRef(null);

  useEffect(() => {
    async function loadSongs() {
      try {
        const response = await axios.get("/api/songs");
        const backendSongs = Array.isArray(response.data) ? response.data : [];
        if (backendSongs.length) {
          const combinedSongs = [...backendSongs];
          const backendTitles = new Set(backendSongs.map((song) => song.title));
          for (const fallbackSong of fallbackSongs) {
            if (combinedSongs.length >= 20) break;
            if (!backendTitles.has(fallbackSong.title)) {
              combinedSongs.push({ ...fallbackSong, _id: fallbackSong._id });
            }
          }
          const finalSongs = combinedSongs.slice(0, 20);
          setSongs(finalSongs);
          if (!currentSong) {
            setCurrentSong(finalSongs[0]);
          }
          return;
        }
      } catch (error) {
        console.warn("Unable to fetch songs from backend, using fallback data.", error.message);
      }

      setSongs(fallbackSongs.slice(0, 20));
      if (!currentSong) {
        setCurrentSong(fallbackSongs[0]);
      }
    }

    loadSongs();
    const savedPlaylists = localStorage.getItem("musicify-playlists");
    if (savedPlaylists) {
      const parsed = JSON.parse(savedPlaylists);
      setPlaylists(parsed);
      setSelectedPlaylistId(parsed[0]?.id ?? "default");
    } else {
      setPlaylists([{ id: "default", title: "Favorites", songs: [] }]);
      setSelectedPlaylistId("default");
    }

    const savedToken = localStorage.getItem("musicify-token");
    const savedUser = localStorage.getItem("musicify-current-user");
    if (savedToken) {
      setToken(savedToken);
    }
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const fetchProfile = async () => {
        try {
          const response = await axios.get("/api/auth/profile");
          setUser(response.data);
          setAuthError("");
        } catch {
          setToken(null);
          setUser(null);
        }
      };
      fetchProfile();
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, [token]);

  useEffect(() => {
    if (!currentSong && songs.length) {
      setCurrentSong(songs[0]);
    }
  }, [songs, currentSong]);

  useEffect(() => {
    localStorage.setItem("musicify-playlists", JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem("musicify-current-user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("musicify-token", token);
    } else {
      localStorage.removeItem("musicify-token");
    }
  }, [token]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    if (currentSong && audio.src !== currentSong.audioUrl) {
      audio.load();
    }
    if (isPlaying) {
      audio.play().catch((error) => {
        console.warn("Audio play failed:", error);
      });
    } else {
      audio.pause();
    }
  }, [currentSong, isPlaying, volume]);

  const searchResults = useMemo(
    () =>
      songs.filter((song) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          term.length === 0 ||
          song.title.toLowerCase().includes(term) ||
          song.artist.toLowerCase().includes(term) ||
          song.album?.toLowerCase().includes(term) ||
          song.genre?.toLowerCase().includes(term);
        const matchesGenre = selectedGenre ? song.genre === selectedGenre : true;
        return matchesSearch && matchesGenre;
      }),
    [songs, searchTerm, selectedGenre],
  );

  const playSong = (song) => {
    if (!song) {
      setIsPlaying(false);
      return;
    }

    if (currentSong?._id === song._id) {
      setIsPlaying((prev) => !prev);
      return;
    }

    setCurrentSong(song);
    setIsPlaying(true);
  };

  const nextTrack = () => {
    if (!songs.length || !currentSong) return;
    const currentIndex = songs.findIndex((song) => song._id === currentSong._id);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= songs.length) {
      nextIndex = 0;
    }
    setCurrentSong(songs[nextIndex]);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    if (!songs.length || !currentSong) return;
    const currentIndex = songs.findIndex((song) => song._id === currentSong._id);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = songs.length - 1;
    }
    setCurrentSong(songs[prevIndex]);
    setIsPlaying(true);
  };

  const handleEnded = () => {
    if (repeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      return;
    }

    if (shuffle) {
      const nextSong = songs[Math.floor(Math.random() * songs.length)];
      setCurrentSong(nextSong);
      setIsPlaying(true);
      return;
    }

    nextTrack();
  };

  const loginUser = async (email, password) => {
    try {
      const response = await axios.post("/api/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      setToken(response.data.token);
      setUser(response.data.user);
      setAuthError("");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setAuthError(
        error.response?.data?.message ||
          error.message ||
          "Login failed. Please try again.",
      );
      return false;
    }
  };

  const registerUser = async (name, email, password) => {
    try {
      const response = await axios.post("/api/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setToken(response.data.token);
      setUser(response.data.user);
      setAuthError("");
      return true;
    } catch (error) {
      console.error("Register error:", error);
      setAuthError(
        error.response?.data?.message ||
          error.message ||
          "Registration failed. Please try again.",
      );
      return false;
    }
  };

  const logoutUser = () => {
    setUser(null);
    setToken(null);
    setAuthError("");
  };

  const updatePassword = async (currentPassword, newPassword) => {
    if (!token) {
      setAuthError("You must be logged in to update your password.");
      return false;
    }

    try {
      await axios.patch(
        "/api/auth/profile/password",
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setAuthError("Password updated successfully.");
      return true;
    } catch (error) {
      setAuthError(error.response?.data?.message || "Password update failed.");
      return false;
    }
  };

  const toggleLike = async (songId) => {
    try {
      const response = await axios.patch(`/api/songs/${songId}/like`);
      setSongs((previous) => previous.map((song) => (song._id === songId ? response.data : song)));
    } catch (error) {
      setSongs((previous) =>
        previous.map((song) =>
          song._id === songId
            ? {
                ...song,
                likes: song.likes + 1,
              }
            : song,
        ),
      );
    }
  };

  const addComment = async (songId, text) => {
    if (!text.trim()) return null;
    try {
      const response = await axios.post(`/api/songs/${songId}/comments`, {
        text,
        user: "Guest",
      });
      setSongs((previous) => previous.map((song) => (song._id === songId ? response.data : song)));
      return response.data;
    } catch {
      setSongs((previous) =>
        previous.map((song) =>
          song._id === songId
            ? {
                ...song,
                comments: [
                  ...(song.comments || []),
                  {
                    user: "Guest",
                    text,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : song,
        ),
      );
      return null;
    }
  };

  const createPlaylist = (title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    setPlaylists((previous) => [...previous, { id, title: trimmed, songs: [] }]);
    setSelectedPlaylistId(id);
  };

  const addToPlaylist = (songId, playlistId) => {
    setPlaylists((previous) =>
      previous.map((playlist) => {
        if (playlist.id !== playlistId) {
          return playlist;
        }

        if (playlist.songs.includes(songId)) {
          return playlist;
        }

        return {
          ...playlist,
          songs: [...playlist.songs, songId],
        };
      }),
    );
  };

  const removeFromPlaylist = (songId, playlistId) => {
    setPlaylists((previous) =>
      previous.map((playlist) =>
        playlist.id !== playlistId
          ? playlist
          : {
              ...playlist,
              songs: playlist.songs.filter((id) => id !== songId),
            },
      ),
    );
  };

  const selectedPlaylist = playlists.find((playlist) => playlist.id === selectedPlaylistId) || playlists[0] || null;

  const playlistSongs = useMemo(
    () =>
      songs.filter((song) => selectedPlaylist?.songs.includes(song._id)),
    [songs, selectedPlaylist],
  );

  return (
    <MusicContext.Provider
      value={{
        songs,
        searchTerm,
        setSearchTerm,
        selectedGenre,
        setSelectedGenre,
        searchResults,
        currentSong,
        isPlaying,
        volume,
        shuffle,
        repeat,
        playlists,
        selectedPlaylist,
        playlistSongs,
        audioRef,
        user,
        token,
        authError,
        setAuthError,
        playSong,
        setIsPlaying,
        nextTrack,
        prevTrack,
        setVolume,
        setShuffle,
        setRepeat,
        toggleLike,
        addComment,
        createPlaylist,
        addToPlaylist,
        removeFromPlaylist,
        setSelectedPlaylistId,
        loginUser,
        registerUser,
        logoutUser,
        updatePassword,
        handleEnded,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export const useMusic = () => useContext(MusicContext);
