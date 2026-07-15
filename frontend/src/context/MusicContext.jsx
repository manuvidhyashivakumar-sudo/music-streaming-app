import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";

const getApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_URL?.trim();
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(hostname);

  if (configured && !configured.includes("localhost") && !configured.includes("127.0.0.1")) {
    return configured.replace(/\/$/, "");
  }

  if (isLocalHost) {
    return "/api";
  }

  return "https://music-streaming-app.onrender.com/api";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 12000,
});

const MusicContext = createContext();

const normalizeUser = (account) => {
  if (!account || typeof account !== "object") return null;

  const id = account._id || account.id || "";
  const name = typeof account.name === "string" ? account.name.trim() : "";
  const email = typeof account.email === "string" ? account.email.trim().toLowerCase() : "";

  if (!name && !email) return null;

  return {
    id,
    name: name || "Guest",
    email,
  };
};

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
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);
  const audioRef = useRef(null);

  const normalizeSong = (song) => {
    if (!song || typeof song !== "object") return null;

    return {
      ...song,
      _id: song._id || song.id || "",
      title: song.title || "Untitled track",
      artist: song.artist || "Unknown artist",
      likes: typeof song.likes === "number" ? song.likes : 0,
      comments: Array.isArray(song.comments) ? song.comments : [],
    };
  };

  const getSongIdentifier = (songOrId) => {
    if (songOrId && typeof songOrId === "object") {
      return String(songOrId._id || songOrId.id || songOrId.title || "");
    }
    return String(songOrId || "");
  };

  const normalizePlaylist = (playlist) => {
    if (!playlist || typeof playlist !== "object") {
      return { id: `playlist-${Date.now()}`, title: "Untitled playlist", songs: [] };
    }

    const normalizedTitle =
      playlist.title ||
      playlist.name ||
      playlist.playlistName ||
      playlist.label ||
      "Untitled playlist";

    return {
      id: playlist._id || playlist.id || `playlist-${Date.now()}`,
      title: normalizedTitle,
      songs: (playlist.songs || [])
        .map((song) => (typeof song === "string" ? song : song?._id || song?.id || song?.songId))
        .map((songId) => (songId ? String(songId) : ""))
        .filter(Boolean),
    };
  };

  const extractPlaylistPayload = (payload) => {
    if (!payload) return null;
    if (Array.isArray(payload)) return payload[0] || null;
    return payload.playlist || payload.data?.playlist || payload.data || payload;
  };

  const extractAuthPayload = (payload) => {
    if (!payload) return null;
    if (payload.user && payload.token) return payload;
    if (payload.data?.user && payload.data?.token) return payload.data;
    if (payload.data?.data?.user && payload.data?.data?.token) return payload.data.data;
    return payload;
  };

  const loadSongs = useCallback(async (query = "") => {
    setIsLoadingSongs(true);
    try {
      const response = await api.get("/songs", { params: { search: query } });
      const backendSongs = Array.isArray(response.data) ? response.data : [response.data].filter(Boolean);
      const normalizedSongs = backendSongs.map(normalizeSong).filter(Boolean);
      if (normalizedSongs.length) {
        const combinedSongs = [...normalizedSongs];
        const backendTitles = new Set(normalizedSongs.map((song) => song.title));
        for (const fallbackSong of fallbackSongs) {
          if (combinedSongs.length >= 20) break;
          if (!backendTitles.has(fallbackSong.title)) {
            combinedSongs.push({ ...fallbackSong, _id: fallbackSong._id });
          }
        }
        const finalSongs = combinedSongs.slice(0, 20);
        setSongs(finalSongs);
        setCurrentSong((current) => (current && finalSongs.some((song) => song._id === current._id) ? current : finalSongs[0]));
        setIsLoadingSongs(false);
        return;
      }
    } catch (error) {
      console.warn("Unable to fetch songs from backend, using fallback data.", error.message);
    }

    setSongs(fallbackSongs.slice(0, 20));
    setCurrentSong((current) => (current && fallbackSongs.some((song) => song._id === current._id) ? current : fallbackSongs[0]));
    setIsLoadingSongs(false);
  }, []);

  const loadPlaylists = useCallback(async () => {
    setIsLoadingPlaylists(true);
    try {
      const response = await api.get("/playlists");
      const payload = response.data;
      const backendPlaylists = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.playlists)
          ? payload.playlists
          : Array.isArray(payload?.data)
            ? payload.data
            : [payload?.playlist || payload].filter(Boolean);
      const normalizedPlaylists = backendPlaylists.map(normalizePlaylist).filter(Boolean);
      if (normalizedPlaylists.length) {
        setPlaylists(normalizedPlaylists);
        setSelectedPlaylistId((current) => current || normalizedPlaylists[0]?.id || "default");
        setIsLoadingPlaylists(false);
        return;
      }
    } catch (error) {
      console.warn("Unable to fetch playlists from backend.", error.message);
    }

    const savedPlaylists = localStorage.getItem("musicify-playlists");
    if (savedPlaylists) {
      try {
        const parsed = JSON.parse(savedPlaylists);
        const normalizedSavedPlaylists = Array.isArray(parsed) ? parsed.map(normalizePlaylist).filter(Boolean) : [];
        const fallbackPlaylists = normalizedSavedPlaylists.length ? normalizedSavedPlaylists : [{ id: "default", title: "Favorites", songs: [] }];
        setPlaylists(fallbackPlaylists);
        setSelectedPlaylistId(fallbackPlaylists[0]?.id ?? "default");
      } catch {
        setPlaylists([{ id: "default", title: "Favorites", songs: [] }]);
        setSelectedPlaylistId("default");
      }
    } else {
      setPlaylists([{ id: "default", title: "Favorites", songs: [] }]);
      setSelectedPlaylistId("default");
    }
    setIsLoadingPlaylists(false);
  }, []);

  useEffect(() => {
    loadSongs("");
    loadPlaylists();

    const savedToken = localStorage.getItem("musicify-token");
    const savedUser = localStorage.getItem("musicify-current-user");
    if (savedToken && savedToken !== "undefined" && savedToken !== "null") {
      setToken(savedToken);
    } else {
      localStorage.removeItem("musicify-token");
    }
    if (savedUser && savedUser !== "undefined") {
      try {
        setUser(normalizeUser(JSON.parse(savedUser)));
      } catch {
        localStorage.removeItem("musicify-current-user");
      }
    }
    setIsAuthReady(!(savedToken && savedToken !== "undefined" && savedToken !== "null"));
  }, [loadPlaylists, loadSongs]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSongs(searchTerm);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadSongs, searchTerm]);

  useEffect(() => {
    if (token) {
      setIsAuthReady(false);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      const fetchProfile = async () => {
        try {
          const response = await api.get("/auth/profile");
          const profileUser = normalizeUser(response.data?.user || response.data);
          if (profileUser) {
            setUser(profileUser);
            setAuthError("");
          }
        } catch (error) {
          const status = error.response?.status;
          // Keep the current authenticated session when profile fetch fails due transient network/CORS errors.
          if (!status || (status !== 401 && status !== 403)) {
            setAuthError("");
            return;
          }

          const savedUser = localStorage.getItem("musicify-current-user");
          if (savedUser && savedUser !== "undefined") {
            try {
              const parsed = normalizeUser(JSON.parse(savedUser));
              if (parsed) {
                setUser(parsed);
                setAuthError("");
              } else {
                setToken(null);
                setUser(null);
              }
            } catch {
              setToken(null);
              setUser(null);
            }
          } else {
            setToken(null);
            setUser(null);
          }
        } finally {
          setIsAuthReady(true);
        }
      };
      fetchProfile();
    } else {
      delete api.defaults.headers.common.Authorization;
      setIsAuthReady(true);
    }
  }, [token]);

  useEffect(() => {
    if (!currentSong && songs.length) {
      setCurrentSong(songs[0]);
    }
  }, [songs, currentSong]);

  useEffect(() => {
    if (!playlists.length) {
      setSelectedPlaylistId(null);
      return;
    }

    const hasSelectedPlaylist = playlists.some(
      (playlist) => String(playlist.id || playlist._id) === String(selectedPlaylistId),
    );

    if (!hasSelectedPlaylist) {
      const firstPlaylistId = playlists[0]?.id || playlists[0]?._id || null;
      setSelectedPlaylistId(firstPlaylistId);
    }
  }, [playlists, selectedPlaylistId]);

  useEffect(() => {
    if (isLoadingPlaylists) return;
    localStorage.setItem("musicify-playlists", JSON.stringify(playlists));
  }, [isLoadingPlaylists, playlists]);

  useEffect(() => {
    const normalizedUser = normalizeUser(user);
    if (normalizedUser) {
      localStorage.setItem("musicify-current-user", JSON.stringify(normalizedUser));
    } else {
      localStorage.removeItem("musicify-current-user");
    }
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
      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const authPayload = extractAuthPayload(response.data);
      const normalizedUser = normalizeUser(authPayload?.user || authPayload);
      const nextToken = authPayload?.token;

      if (!nextToken || !normalizedUser) {
        throw new Error("Invalid auth response from server.");
      }

      setToken(nextToken);
      setUser(normalizedUser);
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
      const response = await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      const authPayload = extractAuthPayload(response.data);
      const normalizedUser = normalizeUser(authPayload?.user || authPayload);
      const nextToken = authPayload?.token;

      if (!nextToken || !normalizedUser) {
        throw new Error("Invalid auth response from server.");
      }

      setToken(nextToken);
      setUser(normalizedUser);
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
      await api.patch(
        "/auth/profile/password",
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

  const toggleLike = async (songOrId) => {
    const normalizedSongId = getSongIdentifier(songOrId);
    if (!normalizedSongId) return;

    const currentSong = songs.find((entry) => getSongIdentifier(entry) === normalizedSongId);
    const optimisticLikeCount = (currentSong?.likes || 0) + 1;

    setSongs((previous) =>
      previous.map((song) =>
        getSongIdentifier(song) === normalizedSongId
          ? {
              ...song,
              likes: optimisticLikeCount,
            }
          : song,
      ),
    );

    if (currentSong?._id === normalizedSongId) {
      setCurrentSong((previous) => (previous ? { ...previous, likes: optimisticLikeCount } : previous));
    }

    try {
      const response = await api.patch(`/songs/${normalizedSongId}/like`);
      const updatedSong = normalizeSong(response.data);
      if (updatedSong) {
        setSongs((previous) =>
          previous.map((song) => (getSongIdentifier(song) === normalizedSongId ? { ...song, ...updatedSong, likes: typeof updatedSong.likes === "number" ? updatedSong.likes : optimisticLikeCount } : song)),
        );
        if (currentSong?._id === normalizedSongId) {
          setCurrentSong((previous) => (previous ? { ...previous, ...updatedSong } : previous));
        }
      }
    } catch (error) {
      console.warn("Unable to sync like update.", error.message);
    }
  };

  const addComment = async (songId, text) => {
    if (!text.trim()) return null;
    try {
      const response = await api.post(`/songs/${songId}/comments`, {
        text,
        user: "Guest",
      });
      setSongs((previous) => previous.map((song) => (song._id === songId ? response.data : song)));
      if (currentSong?._id === songId) {
        setCurrentSong(response.data);
      }
      return response.data;
    } catch {
      const optimisticComment = {
        user: "Guest",
        text,
        createdAt: new Date().toISOString(),
      };
      setSongs((previous) =>
        previous.map((song) =>
          song._id === songId
            ? {
                ...song,
                comments: [...(song.comments || []), optimisticComment],
              }
            : song,
        ),
      );
      if (currentSong?._id === songId) {
        setCurrentSong((previous) => previous ? { ...previous, comments: [...(previous.comments || []), optimisticComment] } : previous);
      }
      return null;
    }
  };

  const createPlaylist = async (title) => {
    const trimmed = title.trim();
    if (!trimmed) return null;

    try {
      const response = await api.post("/playlists", { title: trimmed, name: trimmed });
      const payload = extractPlaylistPayload(response.data);
      const createdPlaylist = normalizePlaylist(payload || { title: trimmed });
      const finalizedPlaylist = {
        ...createdPlaylist,
        title: createdPlaylist.title === "Untitled playlist" ? trimmed : createdPlaylist.title,
      };
      setPlaylists((previous) => [...previous, finalizedPlaylist]);
      setSelectedPlaylistId(finalizedPlaylist.id);
      return finalizedPlaylist;
    } catch (error) {
      const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      const fallbackPlaylist = { id, title: trimmed, songs: [] };
      setPlaylists((previous) => [...previous, fallbackPlaylist]);
      setSelectedPlaylistId(id);
      console.warn("Unable to save playlist to backend.", error.message);
      return fallbackPlaylist;
    }
  };

  const addToPlaylist = async (songOrId, playlistId) => {
    const normalizedSongId = getSongIdentifier(songOrId);
    if (!normalizedSongId) return;

    const fallbackPlaylistId = playlists[0]?.id || playlists[0]?._id;
    const resolvedPlaylistId = playlistId || selectedPlaylistId || fallbackPlaylistId;
    if (!resolvedPlaylistId) return;

    const normalizedPlaylistId = String(resolvedPlaylistId);
    const playlist = playlists.find((entry) => String(entry.id || entry._id) === normalizedPlaylistId);
    if (!playlist || playlist.songs.some((id) => String(id) === normalizedSongId)) return;

    try {
      await api.patch(`/playlists/${normalizedPlaylistId}/add`, { songId: normalizedSongId });
    } catch (error) {
      console.warn("Unable to sync playlist with backend.", error.message);
    }

    setPlaylists((previous) =>
      previous.map((entry) => {
        if (String(entry.id || entry._id) !== normalizedPlaylistId) return entry;
        return { ...entry, songs: [...new Set([...entry.songs.map(String), normalizedSongId])] };
      }),
    );
  };

  const removeFromPlaylist = async (songId, playlistId) => {
    if (!songId || !playlistId) return;

    const normalizedSongId = String(songId);
    const normalizedPlaylistId = String(playlistId);

    try {
      await api.patch(`/playlists/${normalizedPlaylistId}/remove`, { songId: normalizedSongId });
    } catch (error) {
      console.warn("Unable to sync playlist removal with backend.", error.message);
    }

    setPlaylists((previous) =>
      previous.map((entry) =>
        String(entry.id || entry._id) !== normalizedPlaylistId
          ? entry
          : {
              ...entry,
              songs: entry.songs.filter((id) => String(id) !== normalizedSongId),
            },
      ),
    );
  };

  const selectedPlaylist =
    playlists.find((playlist) => String(playlist.id || playlist._id) === String(selectedPlaylistId)) || playlists[0] || null;

  const playlistSongs = useMemo(
    () =>
      songs.filter(
        (song) => song && selectedPlaylist?.songs.some((songId) => String(songId) === getSongIdentifier(song)),
      ),
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
        isAuthReady,
        authError,
        setAuthError,
        isLoadingSongs,
        isLoadingPlaylists,
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
