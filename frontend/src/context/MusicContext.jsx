import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";

const getApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_URL?.trim();
  const configuredOrigin = import.meta.env.VITE_API_ORIGIN?.trim();
  const localDevFallback = "http://localhost:5000/api";
  const deployedFallback = "https://music-streaming-app.onrender.com/api";

  if (import.meta.env.DEV) {
    const allowRemoteDevApi = String(import.meta.env.VITE_ALLOW_REMOTE_DEV_API || "").toLowerCase() === "true";
    if (!allowRemoteDevApi) {
      return localDevFallback;
    }
  }

  if (configured) {
    const cleanedConfigured = configured.replace(/\/$/, "");
    if (/^https?:\/\//i.test(cleanedConfigured) && !/\/api(\/|$)/i.test(cleanedConfigured)) {
      return `${cleanedConfigured}/api`;
    }
    return cleanedConfigured;
  }

  if (configuredOrigin) {
    const cleanedOrigin = configuredOrigin.replace(/\/$/, "");
    return /\/api(\/|$)/i.test(cleanedOrigin) ? cleanedOrigin : `${cleanedOrigin}/api`;
  }

  if (!import.meta.env.DEV && typeof window !== "undefined") {
    const currentOrigin = String(window.location.origin || "").replace(/\/$/, "");
    if (currentOrigin) {
      return `${currentOrigin}/api`;
    }
  }

  if (import.meta.env.DEV) {
    return localDevFallback;
  }

  return deployedFallback;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 12000,
  withCredentials: true,
});

const normalizeApiBaseUrl = (rawUrl = "") => {
  const value = String(rawUrl || "").trim().replace(/\/$/, "");
  if (!value || !/^https?:\/\//i.test(value)) return "";
  return value;
};

const parseEnvCandidates = (rawValue = "") =>
  String(rawValue || "")
    .split(",")
    .map((entry) => normalizeApiBaseUrl(entry))
    .filter(Boolean);

const buildRenderOriginVariants = (origin = "") => {
  const normalized = normalizeApiBaseUrl(origin);
  if (!normalized) return [];

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase();
    if (!host.endsWith(".onrender.com")) return [];

    const labels = host.split(".");
    const serviceName = labels[0] || "";
    const suffix = ".onrender.com";

    const replacements = [
      serviceName.replace(/-app$/i, "-backend"),
      serviceName.replace(/-frontend$/i, "-backend"),
      serviceName.replace(/-web$/i, "-backend"),
      `${serviceName}-backend`,
      `${serviceName}-api`,
      serviceName.replace(/-app$/i, "-api"),
      serviceName.replace(/-frontend$/i, "-api"),
    ]
      .map((entry) => String(entry || "").trim().toLowerCase())
      .filter(Boolean);

    const seen = new Set([serviceName]);
    const variants = [];

    for (const candidateServiceName of replacements) {
      if (seen.has(candidateServiceName)) continue;
      seen.add(candidateServiceName);
      variants.push(`${parsed.protocol}//${candidateServiceName}${suffix}`);
    }

    return variants;
  } catch {
    return [];
  }
};

const buildApiBaseCandidates = () => {
  const prefixCandidates = ["", "/api", "/v1", "/api/v1"];
  const hintCandidates = parseEnvCandidates(import.meta.env.VITE_API_CANDIDATES);
  const seedUrls = [
    ...hintCandidates,
    import.meta.env.VITE_API_URL,
    import.meta.env.VITE_API_ORIGIN,
    import.meta.env.VITE_PROXY_TARGET,
    getApiBaseUrl(),
    typeof window !== "undefined" ? `${window.location.origin}/api` : "",
    "https://music-streaming-app.onrender.com",
    "https://music-streaming-backend.onrender.com",
    "https://music-streaming-api.onrender.com",
    "https://musicify-backend.onrender.com",
  ]
    .map(normalizeApiBaseUrl)
    .filter(Boolean);

  const expandedSeeds = [];
  for (const seed of seedUrls) {
    expandedSeeds.push(seed);

    try {
      const parsed = new URL(seed);
      const renderVariants = buildRenderOriginVariants(parsed.origin);
      for (const variantOrigin of renderVariants) {
        expandedSeeds.push(variantOrigin);
      }
    } catch {
      // Ignore invalid URLs in seed expansion.
    }
  }

  const seen = new Set();
  const candidates = [];

  for (const seed of expandedSeeds) {
    try {
      const parsed = new URL(seed);
      const origin = parsed.origin;
      const path = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname.replace(/\/$/, "") : "";

      if (path) {
        const seededPathCandidate = `${origin}${path}`;
        if (!seen.has(seededPathCandidate)) {
          seen.add(seededPathCandidate);
          candidates.push(seededPathCandidate);
        }
      }

      for (const prefix of prefixCandidates) {
        const candidate = `${origin}${prefix}`;
        if (seen.has(candidate)) continue;
        seen.add(candidate);
        candidates.push(candidate);
      }
    } catch {
      // Ignore invalid URLs in env values.
    }
  }

  return candidates;
};

const MusicContext = createContext();
const AUTH_STORAGE_KEY = "musicify_auth_token";
const MAX_AUTH_BASE_ATTEMPTS = Math.max(
  2,
  Number.parseInt(String(import.meta.env.VITE_MAX_AUTH_BASE_ATTEMPTS || ""), 10) || (import.meta.env.DEV ? 2 : 20),
);

const authRouteFamilies = [
  {
    login: "/auth/login",
    register: "/auth/register",
    profile: "/auth/profile",
  },
  {
    login: "/users/login",
    register: "/users/register",
    profile: "/users/profile",
  },
];

const isNonApiResponse = (data, headers = {}) => {
  const contentType = String(headers?.["content-type"] || headers?.["Content-Type"] || "").toLowerCase();
  if (contentType.includes("text/html")) return true;

  if (typeof data === "string") {
    const value = data.trim().toLowerCase();
    if (!value) return false;
    if (value.startsWith("<!doctype html") || value.startsWith("<html")) return true;
    if (value.includes("welcome to our music app") || value.includes("welcome to the music streaming platform api")) {
      return true;
    }
  }

  return false;
};

const normalizeUser = (account) => {
  if (!account || typeof account !== "object") return null;

  const id = account._id || account.id || "";
  const name =
    typeof account.name === "string"
      ? account.name.trim()
      : typeof account.username === "string"
        ? account.username.trim()
        : typeof account.fullName === "string"
          ? account.fullName.trim()
          : "";
  const email =
    typeof account.email === "string"
      ? account.email.trim().toLowerCase()
      : typeof account.mail === "string"
        ? account.mail.trim().toLowerCase()
        : typeof account.userEmail === "string"
          ? account.userEmail.trim().toLowerCase()
          : "";

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
  const [activeQueueSongIds, setActiveQueueSongIds] = useState([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(true);
  const [authError, setAuthError] = useState("");
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);
  const [playlistCounterPulse, setPlaylistCounterPulse] = useState({ id: null, tick: 0 });
  const audioRef = useRef(null);
  const playlistPulseTimerRef = useRef(null);
  const activeAuthRoutesRef = useRef(authRouteFamilies[0]);
  const latestAuthCheckRef = useRef(0);
  const playlistHydrationRef = useRef(new Set());
  const registerRequestRef = useRef(null);
  const playlistMutationLockRef = useRef(new Set());

  const readStoredAuthToken = useCallback(() => {
    if (typeof window === "undefined") return "";
    return String(window.localStorage.getItem(AUTH_STORAGE_KEY) || "").trim();
  }, []);

  const persistAuthToken = useCallback((token) => {
    if (typeof window === "undefined") return;
    const normalizedToken = String(token || "").trim();
    if (!normalizedToken) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(AUTH_STORAGE_KEY, normalizedToken);
  }, []);

  const getAuthConfig = useCallback(() => {
    const token = readStoredAuthToken();
    if (!token) {
      return {};
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }, [readStoredAuthToken]);

  const fetchProfileWithFallback = useCallback(async (requestConfig = {}) => {
    let lastError = null;

    const primary = activeAuthRoutesRef.current || authRouteFamilies[0];
    const orderedFamilies = [primary, ...authRouteFamilies.filter((entry) => entry.profile !== primary.profile)];

    for (const family of orderedFamilies) {
      try {
        const response = await api.get(family.profile, requestConfig);
        if (isNonApiResponse(response.data, response.headers)) {
          continue;
        }
        activeAuthRoutesRef.current = family;
        return response;
      } catch (error) {
        const status = error?.response?.status;
        lastError = error;
        if (status && status !== 404 && status !== 405) {
          throw error;
        }
      }
    }

    throw lastError || new Error("Unable to fetch profile.");
  }, []);

  const triggerPlaylistCounterPulse = (playlistId) => {
    if (!playlistId) return;
    const normalizedId = String(playlistId);
    const tick = Date.now();
    setPlaylistCounterPulse({ id: normalizedId, tick });
    if (playlistPulseTimerRef.current) {
      window.clearTimeout(playlistPulseTimerRef.current);
    }
    playlistPulseTimerRef.current = window.setTimeout(() => {
      setPlaylistCounterPulse((previous) =>
        previous.id === normalizedId ? { id: null, tick: previous.tick } : previous,
      );
      playlistPulseTimerRef.current = null;
    }, 900);
  };

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

  const isMongoObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

  const resolveBackendSongId = async (songOrId) => {
    const directId = getSongIdentifier(songOrId);
    if (isMongoObjectId(directId)) return directId;

    if (!songOrId || typeof songOrId !== "object") return directId;

    const title = String(songOrId.title || "").trim();
    const artist = String(songOrId.artist || "").trim();
    if (!title) return directId;

    try {
      const response = await api.get("/songs", {
        params: { search: `${title} ${artist}`.trim() },
      });
      const backendSongs = Array.isArray(response.data) ? response.data : [response.data].filter(Boolean);
      const normalizedSongs = backendSongs.map(normalizeSong).filter(Boolean);
      const matchedSong = normalizedSongs.find(
        (candidate) =>
          candidate.title?.toLowerCase() === title.toLowerCase() &&
          (artist ? candidate.artist?.toLowerCase() === artist.toLowerCase() : true),
      );

      const resolvedId = matchedSong?._id;
      return resolvedId ? String(resolvedId) : directId;
    } catch {
      return directId;
    }
  };

  const normalizePlaylist = (playlist) => {
    if (!playlist || typeof playlist !== "object") {
      return {
        id: `playlist-${Date.now()}`,
        title: "Untitled playlist",
        songs: [],
        songDetails: [],
        songCount: 0,
      };
    }

    const normalizedTitle =
      playlist.title ||
      playlist.name ||
      playlist.playlistName ||
      playlist.label ||
      "Untitled playlist";

    const rawSongs = Array.isArray(playlist.songs) ? playlist.songs : [];
    const extractRawSongId = (song) => {
      if (!song) return "";
      if (typeof song === "string") return song;

      if (typeof song === "object") {
        const idCandidate = song._id || song.id || song.songId;
        if (idCandidate) return String(idCandidate);

        const asString = typeof song.toString === "function" ? String(song.toString()) : "";
        if (asString && asString !== "[object Object]") return asString;
      }

      return "";
    };

    const looksLikeFullSongObject = (song) =>
      Boolean(
        song &&
          typeof song === "object" &&
          (song.title || song.artist || song.audioUrl || song.imageUrl || song.album || song.genre),
      );

    const songDetails = rawSongs
      .map((song) => (looksLikeFullSongObject(song) ? normalizeSong(song) : null))
      .filter(Boolean);

    const songIds = rawSongs
      .map((song) => extractRawSongId(song))
      .map((songId) => (songId ? String(songId) : ""))
      .filter(Boolean);

    return {
      id: playlist._id || playlist.id || `playlist-${Date.now()}`,
      title: normalizedTitle,
      description: typeof playlist.description === "string" ? playlist.description : "",
      privacy: ["private", "public", "unlisted"].includes(playlist.privacy)
        ? playlist.privacy
        : playlist.isPublic
          ? "public"
          : "private",
      isPublic:
        typeof playlist.isPublic === "boolean"
          ? playlist.isPublic
          : (playlist.privacy || "private") === "public",
      createdAt: playlist.createdAt || "",
      updatedAt: playlist.updatedAt || "",
      likedBy: Array.isArray(playlist.likedBy)
        ? playlist.likedBy.map((entry) => String(entry || "")).filter(Boolean)
        : [],
      likes: typeof playlist.likes === "number" ? playlist.likes : 0,
      comments: Array.isArray(playlist.comments) ? playlist.comments : [],
      songs: songIds,
      songDetails,
      songCount: Math.max(songIds.length, songDetails.length, Number(playlist.songCount) || 0),
    };
  };

  const extractPlaylistPayload = (payload) => {
    if (!payload) return null;
    if (Array.isArray(payload)) return payload[0] || null;
    return payload.playlist || payload.data?.playlist || payload.data || payload;
  };

  const extractAuthPayload = (payload) => {
    if (!payload) return null;

    if (typeof payload === "string") {
      try {
        const parsed = JSON.parse(payload);
        return extractAuthPayload(parsed);
      } catch {
        return payload;
      }
    }

    if (payload.user && payload.token) return payload;
    if (payload.data?.user && payload.data?.token) return payload.data;
    if (payload.data?.data?.user && payload.data?.data?.token) return payload.data.data;
    if (payload.result?.user || payload.result?.token) return payload.result;
    if (payload.payload?.user || payload.payload?.token) return payload.payload;
    if (payload.response?.user || payload.response?.token) return payload.response;
    return payload;
  };

  const extractAuthToken = (payload) => {
    if (!payload) return "";

    const candidates = [
      payload?.token,
      payload?.accessToken,
      payload?.jwt,
      payload?.authToken,
      payload?.data?.token,
      payload?.data?.accessToken,
      payload?.data?.jwt,
      payload?.data?.authToken,
      payload?.result?.token,
      payload?.result?.accessToken,
      payload?.payload?.token,
      payload?.payload?.accessToken,
    ];

    for (const candidate of candidates) {
      const normalized = String(candidate || "").trim();
      if (normalized) return normalized;
    }

    return "";
  };

  const findNestedMatch = (value, predicate, depth = 0, seen = new Set()) => {
    if (depth > 5 || value == null) return null;

    if (typeof value === "object") {
      if (seen.has(value)) return null;
      seen.add(value);
    }

    if (predicate(value)) return value;

    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findNestedMatch(item, predicate, depth + 1, seen);
        if (found) return found;
      }
      return null;
    }

    if (typeof value === "object") {
      for (const nested of Object.values(value)) {
        const found = findNestedMatch(nested, predicate, depth + 1, seen);
        if (found) return found;
      }
    }

    return null;
  };

  const extractUserFromPayload = (payload) => {
    return (
      payload?.user ||
      payload?.data?.user ||
      payload?.profile?.user ||
      payload?.result?.data?.user ||
      payload?.account?.user ||
      payload?.account ||
      payload?.profile ||
      payload?.data?.account ||
      payload?.data?.profile ||
      payload?.data?.currentUser ||
      payload?.result?.user ||
      payload?.payload?.user ||
      payload?.auth?.user ||
      findNestedMatch(
        payload,
        (candidate) =>
          candidate &&
          typeof candidate === "object" &&
          !Array.isArray(candidate) &&
          (typeof candidate.email === "string" || typeof candidate.name === "string") &&
          (candidate.id || candidate._id || candidate.email),
      ) ||
      null
    );
  };

  const resolveLoginAgainstBase = useCallback(
    async (baseUrl, normalizedEmailInput, password) => {
      const previousBaseUrl = api.defaults.baseURL;

      api.defaults.baseURL = baseUrl;

      try {
        let response = null;
        let selectedFamily = null;
        const primary = activeAuthRoutesRef.current || authRouteFamilies[0];
        const orderedFamilies = [primary, ...authRouteFamilies.filter((entry) => entry.login !== primary.login)];

        for (const family of orderedFamilies) {
          try {
            response = await api.post(family.login, {
              email: normalizedEmailInput,
              password,
            });
            if (isNonApiResponse(response.data, response.headers)) {
              response = null;
              continue;
            }
            selectedFamily = family;
            break;
          } catch (error) {
            const status = error?.response?.status;
            if (status && status !== 404 && status !== 405) {
              throw error;
            }
          }
        }

        if (!response || !selectedFamily) {
          return { ok: false, reason: "No supported login route on candidate base URL." };
        }

        activeAuthRoutesRef.current = selectedFamily;

        const authPayload = extractAuthPayload(response.data);
        let normalizedUser = normalizeUser(extractUserFromPayload(authPayload) || authPayload);

        const resolvedToken = extractAuthToken(authPayload);

        if (!normalizedUser || !resolvedToken) {
          try {
            const profileResponse = await api.get(
              selectedFamily.profile,
              resolvedToken
                ? {
                    headers: {
                      Authorization: `Bearer ${resolvedToken}`,
                    },
                  }
                : undefined,
            );
            normalizedUser = normalizeUser(profileResponse.data?.user || profileResponse.data);
          } catch {
            return { ok: false, reason: "Login succeeded but profile fetch/token parsing failed." };
          }
        }

        return {
          ok: true,
          baseUrl,
          user: normalizedUser,
          token: resolvedToken,
        };
      } catch {
        return { ok: false, reason: "Network/CORS/auth request failed for this base URL." };
      } finally {
        api.defaults.baseURL = previousBaseUrl;
      }
    },
    [],
  );

  const resolveLoginWithFallbackBases = useCallback(
    async (normalizedEmailInput, password) => {
      const currentBase = normalizeApiBaseUrl(api.defaults.baseURL || "");
      const candidates = [currentBase, ...buildApiBaseCandidates()].filter(Boolean).slice(0, MAX_AUTH_BASE_ATTEMPTS);
      const seen = new Set();
      const attemptedCandidates = [];
      let lastReason = "";

      for (const candidate of candidates) {
        if (seen.has(candidate)) continue;
        seen.add(candidate);
        attemptedCandidates.push(candidate);

        const result = await resolveLoginAgainstBase(candidate, normalizedEmailInput, password);
        if (result.ok) {
          api.defaults.baseURL = candidate;
          return result;
        }
        if (result.reason) {
          lastReason = result.reason;
        }
      }

      return { ok: false, attemptedCandidates, reason: lastReason };
    },
    [resolveLoginAgainstBase],
  );

  const resolveRegisterAgainstBase = useCallback(
    async (baseUrl, payload) => {
      const previousBaseUrl = api.defaults.baseURL;

      api.defaults.baseURL = baseUrl;

      try {
        let response = null;
        let selectedFamily = null;
        const primary = activeAuthRoutesRef.current || authRouteFamilies[0];
        const orderedFamilies = [primary, ...authRouteFamilies.filter((entry) => entry.register !== primary.register)];

        for (const family of orderedFamilies) {
          try {
            response = await api.post(family.register, payload);
            if (isNonApiResponse(response.data, response.headers)) {
              response = null;
              continue;
            }
            selectedFamily = family;
            break;
          } catch (error) {
            const status = error?.response?.status;
            if (status && status !== 404 && status !== 405) {
              throw error;
            }
          }
        }

        if (!response || !selectedFamily) {
          return { ok: false, reason: "No supported register route on candidate base URL." };
        }

        activeAuthRoutesRef.current = selectedFamily;
        return { ok: true, response, selectedFamily, baseUrl };
      } catch (error) {
        return {
          ok: false,
          reason: error?.response?.data?.message || "Network/CORS/register request failed for this base URL.",
        };
      } finally {
        api.defaults.baseURL = previousBaseUrl;
      }
    },
    [],
  );

  const resolveRegisterWithFallbackBases = useCallback(
    async (payload) => {
      const currentBase = normalizeApiBaseUrl(api.defaults.baseURL || "");
      const candidates = [currentBase, ...buildApiBaseCandidates()].filter(Boolean).slice(0, MAX_AUTH_BASE_ATTEMPTS);
      const seen = new Set();
      const attemptedCandidates = [];
      let lastReason = "";

      for (const candidate of candidates) {
        if (seen.has(candidate)) continue;
        seen.add(candidate);
        attemptedCandidates.push(candidate);

        const result = await resolveRegisterAgainstBase(candidate, payload);
        if (result.ok) {
          api.defaults.baseURL = candidate;
          return result;
        }
        if (result.reason) {
          lastReason = result.reason;
        }
      }

      return { ok: false, attemptedCandidates, reason: lastReason };
    },
    [resolveRegisterAgainstBase],
  );

  const loadSongs = useCallback(async (query = "") => {
    setIsLoadingSongs(true);
    try {
      const response = await api.get("/songs", { params: { search: query } });
      const backendSongs = Array.isArray(response.data) ? response.data : [response.data].filter(Boolean);
      const normalizedSongs = backendSongs.map(normalizeSong).filter(Boolean);
      if (normalizedSongs.length) {
        setSongs(normalizedSongs);
        setCurrentSong((current) => (current && normalizedSongs.some((song) => song._id === current._id) ? current : normalizedSongs[0]));
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
    if (!user) {
      setPlaylists([]);
      setSelectedPlaylistId(null);
      setIsLoadingPlaylists(false);
      return;
    }

    setIsLoadingPlaylists(true);
    try {
      const response = await api.get("/playlists", getAuthConfig());
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
      setPlaylists([]);
      setSelectedPlaylistId(null);
    } catch (error) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        setPlaylists([]);
        setSelectedPlaylistId(null);
      } else {
        console.warn("Unable to fetch playlists from backend.", error.message);
      }
    }
    setIsLoadingPlaylists(false);
  }, [getAuthConfig, user]);

  const refreshPlaylistById = useCallback(
    async (playlistId) => {
      const normalizedPlaylistId = String(playlistId || "").trim();
      if (!normalizedPlaylistId || !user) return null;

      try {
        const response = await api.get(`/playlists/${normalizedPlaylistId}`, getAuthConfig());
        const payload = extractPlaylistPayload(response.data);
        const refreshedPlaylist = normalizePlaylist(payload || { id: normalizedPlaylistId, title: "Untitled playlist", songs: [] });

        setPlaylists((previous) => {
          const exists = previous.some((entry) => String(entry.id || entry._id) === normalizedPlaylistId);
          if (!exists) {
            return [...previous, refreshedPlaylist];
          }

          return previous.map((entry) =>
            String(entry.id || entry._id) === normalizedPlaylistId ? refreshedPlaylist : entry,
          );
        });

        return refreshedPlaylist;
      } catch {
        return null;
      }
    },
    [getAuthConfig, user],
  );

  useEffect(() => {
    loadSongs("");
    setIsAuthReady(true);
  }, [loadSongs]);

  useEffect(() => {
    if (!user) {
      setPlaylists([]);
      setSelectedPlaylistId(null);
      setIsLoadingPlaylists(false);
      return;
    }

    loadPlaylists();
  }, [loadPlaylists, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSongs(searchTerm);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadSongs, searchTerm]);

  useEffect(() => {
    const authCheckId = latestAuthCheckRef.current + 1;
    latestAuthCheckRef.current = authCheckId;
    setIsAuthReady(false);

    const fetchProfile = async () => {
      try {
        const response = await fetchProfileWithFallback(getAuthConfig());
        if (latestAuthCheckRef.current !== authCheckId) {
          return;
        }

        const profileUser = normalizeUser(response.data?.user || response.data);
        if (profileUser) {
          setUser(profileUser);
          setAuthError("");
        } else {
          setUser(null);
        }
      } catch (error) {
        if (latestAuthCheckRef.current !== authCheckId) {
          return;
        }

        const status = error.response?.status;
        if (status === 401 || status === 403) {
          persistAuthToken("");
          setUser(null);
        } else {
          setAuthError(error.response?.data?.message || "Unable to validate session.");
        }
      } finally {
        if (latestAuthCheckRef.current === authCheckId) {
          setIsAuthReady(true);
        }
      }
    };

    fetchProfile();
  }, [fetchProfileWithFallback, getAuthConfig]);

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
    if (!selectedPlaylistId || !user) return;

    const selected = playlists.find(
      (playlist) => String(playlist.id || playlist._id) === String(selectedPlaylistId),
    );

    if (!selected || !Array.isArray(selected.songs) || !selected.songs.length) return;

    const selectedId = String(selected.id || selected._id || "");
    const hydrationKey = `${selectedId}:${selected.songs.join(",")}`;
    if (playlistHydrationRef.current.has(hydrationKey)) {
      return;
    }

    const detailIdSet = new Set(
      (selected.songDetails || [])
        .map((song) => String(song?._id || song?.id || ""))
        .filter(Boolean),
    );

    const missingSongIds = selected.songs.filter((songId) => !detailIdSet.has(String(songId)));
    if (!missingSongIds.length) {
      playlistHydrationRef.current.add(hydrationKey);
      return;
    }

    playlistHydrationRef.current.add(hydrationKey);

    const hydrateSongs = async () => {
      try {
        const responses = await Promise.all(
          missingSongIds.map(async (songId) => {
            try {
              const response = await api.get(`/songs/${songId}`);
              return normalizeSong(response.data);
            } catch {
              return null;
            }
          }),
        );

        const hydratedSongs = responses.filter(Boolean);
        if (!hydratedSongs.length) {
          return;
        }

        setPlaylists((previous) =>
          previous.map((playlist) => {
            const playlistId = String(playlist.id || playlist._id || "");
            if (playlistId !== selectedId) return playlist;

            const existingById = new Map(
              (playlist.songDetails || [])
                .map((song) => [String(song?._id || song?.id || ""), song])
                .filter(([songId]) => Boolean(songId)),
            );

            for (const song of hydratedSongs) {
              const songId = String(song?._id || song?.id || "");
              if (songId) {
                existingById.set(songId, song);
              }
            }

            const orderedSongDetails = (playlist.songs || [])
              .map((songId) => existingById.get(String(songId)))
              .filter(Boolean);

            return {
              ...playlist,
              songDetails: orderedSongDetails,
              songCount: (playlist.songs || []).length,
            };
          }),
        );
      } finally {
        // Keep hydration key to avoid repeated network loops.
      }
    };

    hydrateSongs();
  }, [playlists, selectedPlaylistId, user]);

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

  useEffect(
    () => () => {
      if (playlistPulseTimerRef.current) {
        window.clearTimeout(playlistPulseTimerRef.current);
      }
    },
    [],
  );

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

    setActiveQueueSongIds([]);
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const buildQueueFromIds = useCallback(
    (queueIds = []) => {
      if (!Array.isArray(queueIds) || !queueIds.length) return [];

      const songsById = new Map(
        songs
          .map((song) => [String(song?._id || song?.id || ""), normalizeSong(song)])
          .filter(([songId, song]) => Boolean(songId && song)),
      );

      return queueIds
        .map((songId) => songsById.get(String(songId || "")) || null)
        .filter(Boolean);
    },
    [songs],
  );

  const playPlaylist = useCallback(
    (playlistItems = [], options = {}) => {
      const normalizedSongs = Array.isArray(playlistItems)
        ? playlistItems.map((song) => normalizeSong(song)).filter(Boolean)
        : [];
      if (!normalizedSongs.length) {
        return false;
      }

      const shouldShuffle = Boolean(options?.shuffle);
      const queueSongs = shouldShuffle
        ? [...normalizedSongs].sort(() => Math.random() - 0.5)
        : normalizedSongs;
      const queueIds = queueSongs
        .map((song) => String(song?._id || song?.id || ""))
        .filter(Boolean);

      setActiveQueueSongIds(queueIds);
      setCurrentSong(queueSongs[0]);
      setIsPlaying(true);
      return true;
    },
    [],
  );

  const nextTrack = () => {
    if (!currentSong) return;

    const queuedSongs = buildQueueFromIds(activeQueueSongIds);
    if (queuedSongs.length) {
      const currentIndex = queuedSongs.findIndex((song) => String(song?._id || song?.id || "") === String(currentSong?._id || currentSong?.id || ""));
      const safeIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = safeIndex + 1 >= queuedSongs.length ? 0 : safeIndex + 1;
      setCurrentSong(queuedSongs[nextIndex]);
      setIsPlaying(true);
      return;
    }

    if (!songs.length) return;
    const currentIndex = songs.findIndex((song) => song._id === currentSong._id);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= songs.length) {
      nextIndex = 0;
    }
    setCurrentSong(songs[nextIndex]);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    if (!currentSong) return;

    const queuedSongs = buildQueueFromIds(activeQueueSongIds);
    if (queuedSongs.length) {
      const currentIndex = queuedSongs.findIndex((song) => String(song?._id || song?.id || "") === String(currentSong?._id || currentSong?.id || ""));
      const safeIndex = currentIndex >= 0 ? currentIndex : 0;
      const prevIndex = safeIndex - 1 < 0 ? queuedSongs.length - 1 : safeIndex - 1;
      setCurrentSong(queuedSongs[prevIndex]);
      setIsPlaying(true);
      return;
    }

    if (!songs.length) return;
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
      const queuedSongs = buildQueueFromIds(activeQueueSongIds);
      const sourceSongs = queuedSongs.length ? queuedSongs : songs;
      if (!sourceSongs.length) return;
      const nextSong = sourceSongs[Math.floor(Math.random() * sourceSongs.length)];
      setCurrentSong(nextSong);
      setIsPlaying(true);
      return;
    }

    nextTrack();
  };

  const loginUser = async (email, password) => {
    try {
      const normalizedEmailInput = email.trim().toLowerCase();
      const loginResult = await resolveLoginWithFallbackBases(normalizedEmailInput, password);
      if (!loginResult.ok) {
        throw new Error(
          `Login failed. Could not reach a valid backend auth endpoint. ${loginResult.reason || ""} Tried: ${(loginResult.attemptedCandidates || []).join(", ") || "none"}. Set VITE_API_URL to your backend service URL (for example https://<your-backend>.onrender.com/api).`,
        );
      }

      setUser(loginResult.user || null);
      persistAuthToken(loginResult.token || "");
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
    if (registerRequestRef.current) {
      return registerRequestRef.current;
    }

    registerRequestRef.current = (async () => {
    try {
      const normalizedNameInput = name.trim();
      const normalizedEmailInput = email.trim().toLowerCase();

      if (!normalizedNameInput || !normalizedEmailInput || !password) {
        setAuthError("Name, email, and password are required.");
        return false;
      }

      if (!/^\S+@\S+\.\S+$/.test(normalizedEmailInput)) {
        setAuthError("Please provide a valid email address.");
        return false;
      }

      if (password.length < 6) {
        setAuthError("Password must be at least 6 characters long.");
        return false;
      }

      const registerResult = await resolveRegisterWithFallbackBases({
        username: normalizedNameInput,
        name: normalizedNameInput,
        email: normalizedEmailInput,
        password,
      });

      if (!registerResult.ok) {
        throw new Error(
          `No valid register endpoint found on backend server. ${registerResult.reason || ""} Tried: ${(registerResult.attemptedCandidates || []).join(", ") || "none"}`,
        );
      }

      const { response, selectedFamily } = registerResult;

      activeAuthRoutesRef.current = selectedFamily;

      const authPayload = extractAuthPayload(response.data);
      const resolvedToken = extractAuthToken(authPayload);
      let normalizedUser = normalizeUser(extractUserFromPayload(authPayload) || authPayload);

      if (!normalizedUser || !resolvedToken) {
        try {
          const profileResponse = await api.get(
            selectedFamily.profile,
            resolvedToken
              ? {
                  headers: {
                    Authorization: `Bearer ${resolvedToken}`,
                  },
                }
              : undefined,
          );
          normalizedUser = normalizeUser(profileResponse.data?.user || profileResponse.data);
        } catch {
          normalizedUser = null;
        }
      }

      // Some server deployments may not establish session after register.
      // Reuse login path to force a known-good session and token.
      if (!normalizedUser || !resolvedToken) {
        const autoLoginSuccess = await loginUser(normalizedEmailInput, password);
        if (autoLoginSuccess) {
          setAuthError("");
          return true;
        }

        setAuthError("Registration successful, but automatic login failed. Please login.");
        return "requires-login";
      }

      setUser(normalizedUser);
      persistAuthToken(resolvedToken || readStoredAuthToken());
      setAuthError("");
      return true;
    } catch (error) {
      console.error("Register error:", error);

      if (error.response?.status === 409) {
        setAuthError(error.response?.data?.message || "Email is already registered. Please login.");
        return "requires-login";
      }

      setAuthError(
        error.response?.data?.message ||
          error.message ||
          "Registration failed. Please try again.",
      );
      return false;
    } finally {
      registerRequestRef.current = null;
    }
    })();

    return registerRequestRef.current;
  };

  const logoutUser = async () => {
    try {
      await api.post("/auth/logout", {}, getAuthConfig());
    } catch {
      // Ignore logout API failures and still clear local state.
    }
    persistAuthToken("");
    setUser(null);
    setAuthError("");
  };

  const updatePassword = async (currentPassword, newPassword) => {
    if (!user) {
      setAuthError("You must be logged in to update your password.");
      return false;
    }

    try {
      await api.patch(
        "/auth/profile/password",
        { currentPassword, newPassword },
        getAuthConfig(),
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

  const createPlaylist = async (title, options = {}) => {
    const trimmed = String(title || "").trim();
    if (!trimmed) return null;

    if (!user) {
      setAuthError("Please login to create a playlist.");
      return null;
    }

    try {
      const normalizedPrivacy = ["private", "public", "unlisted"].includes(String(options?.privacy || "").toLowerCase())
        ? String(options.privacy).toLowerCase()
        : "private";
      const normalizedDescription = String(options?.description || "").trim();
      const response = await api.post(
        "/playlists",
        {
          title: trimmed,
          name: trimmed,
          description: normalizedDescription,
          privacy: normalizedPrivacy,
          isPublic: normalizedPrivacy === "public",
        },
        getAuthConfig(),
      );
      const payload = extractPlaylistPayload(response.data);
      const createdPlaylist = normalizePlaylist(payload || { title: trimmed });
      const finalizedPlaylist = {
        ...createdPlaylist,
        title: createdPlaylist.title === "Untitled playlist" ? trimmed : createdPlaylist.title,
      };
      setPlaylists((previous) => [...previous, finalizedPlaylist]);
      setSelectedPlaylistId(finalizedPlaylist.id);
      setAuthError("");
      return finalizedPlaylist;
    } catch (error) {
      setAuthError(error.response?.data?.message || "Unable to create playlist.");
      return null;
    }
  };

  const updatePlaylistDetails = async (playlistId, payload = {}) => {
    if (!playlistId) return false;

    if (!user) {
      setAuthError("Please login to modify playlists.");
      return false;
    }

    const normalizedPlaylistId = String(playlistId);
    const updatePayload = {};

    if (typeof payload.title === "string" && payload.title.trim()) {
      updatePayload.title = payload.title.trim();
    }

    if (Object.prototype.hasOwnProperty.call(payload, "description")) {
      updatePayload.description = String(payload.description || "").trim();
    }

    if (Object.prototype.hasOwnProperty.call(payload, "privacy")) {
      const normalizedPrivacy = String(payload.privacy || "").toLowerCase();
      if (["private", "public", "unlisted"].includes(normalizedPrivacy)) {
        updatePayload.privacy = normalizedPrivacy;
        updatePayload.isPublic = normalizedPrivacy === "public";
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, "isPublic") && typeof payload.isPublic === "boolean") {
      updatePayload.isPublic = payload.isPublic;
      if (!updatePayload.privacy) {
        updatePayload.privacy = payload.isPublic ? "public" : "private";
      }
    }

    if (!Object.keys(updatePayload).length) return false;

    try {
      const response = await api.put(
        `/playlists/${normalizedPlaylistId}`,
        updatePayload,
        getAuthConfig(),
      );

      const payloadData = extractPlaylistPayload(response.data);
      const fallbackBase =
        playlists.find((entry) => String(entry.id || entry._id) === normalizedPlaylistId) ||
        { id: normalizedPlaylistId, title: "Untitled playlist", songs: [] };
      const updatedPlaylist = normalizePlaylist(payloadData || { ...fallbackBase, ...updatePayload });

      setPlaylists((previous) =>
        previous.map((entry) =>
          String(entry.id || entry._id) === normalizedPlaylistId ? updatedPlaylist : entry,
        ),
      );
      setAuthError("");
      return true;
    } catch (error) {
      setAuthError(error.response?.data?.message || "Unable to update playlist details.");
      return false;
    }
  };

  const addToPlaylist = async (songOrId, playlistId) => {
    const normalizedSongId = await resolveBackendSongId(songOrId);
    if (!normalizedSongId) {
      return { ok: false, message: "Unable to resolve song." };
    }

    if (!user) {
      setAuthError("Please login to add songs to a playlist.");
      return { ok: false, message: "Please login to add songs to a playlist." };
    }

    const fallbackPlaylistId = playlists[0]?.id || playlists[0]?._id;
    let resolvedPlaylistId = playlistId || selectedPlaylistId || fallbackPlaylistId;
    let resolvedPlaylist = null;

    if (!resolvedPlaylistId) {
      const created = await createPlaylist("Favorites");
      const createdId = created?.id || created?._id;
      if (!createdId) {
        setAuthError("Unable to create a playlist. Please try again.");
        return { ok: false, message: "Unable to create a playlist. Please try again." };
      }
      resolvedPlaylistId = createdId;
      resolvedPlaylist = normalizePlaylist(created);
    }

    const normalizedPlaylistId = String(resolvedPlaylistId);
    const mutationKey = `${normalizedPlaylistId}:${normalizedSongId}`;
    if (playlistMutationLockRef.current.has(mutationKey)) {
      return { ok: true, message: "Song add already in progress." };
    }

    playlistMutationLockRef.current.add(mutationKey);

    const playlist =
      resolvedPlaylist ||
      playlists.find((entry) => String(entry.id || entry._id) === normalizedPlaylistId) ||
      null;
    if (!playlist && !resolvedPlaylistId) {
      setAuthError("Please select a playlist first.");
      return { ok: false, message: "Please select a playlist first." };
    }

    if (playlist?.songs?.some((id) => String(id) === normalizedSongId)) {
      setAuthError("Song already exists in this playlist.");
      return { ok: true, message: "Song already exists in this playlist." };
    }

    try {
      const response = await api.patch(
        `/playlists/${normalizedPlaylistId}/add`,
        {
          songId: normalizedSongId,
          song:
            songOrId && typeof songOrId === "object"
              ? {
                  title: songOrId.title,
                  artist: songOrId.artist,
                  album: songOrId.album,
                  genre: songOrId.genre,
                  imageUrl: songOrId.imageUrl || songOrId.image,
                  audioUrl: songOrId.audioUrl,
                }
              : undefined,
        },
        getAuthConfig(),
      );
      const payload = extractPlaylistPayload(response.data);
      const backendAdded = Boolean(response.data?.added ?? response.data?.data?.added ?? false);
      const optimisticSongDetail =
        songOrId && typeof songOrId === "object"
          ? normalizeSong({
              ...songOrId,
              _id: normalizedSongId,
              id: normalizedSongId,
            })
          : null;
      const optimisticPlaylistBase = {
        ...(playlist || { id: normalizedPlaylistId, title: "Untitled playlist", songs: [], songDetails: [] }),
        songs: [...(playlist?.songs || []), normalizedSongId],
        songDetails: optimisticSongDetail
          ? [...(playlist?.songDetails || []), optimisticSongDetail]
          : [...(playlist?.songDetails || [])],
      };
      const normalizedPayload = payload ? normalizePlaylist(payload) : null;
      const mergedSongs = normalizedPayload?.songs?.length
        ? normalizedPayload.songs
        : optimisticPlaylistBase.songs;
      const mergedSongDetailsById = new Map(
        [...(optimisticPlaylistBase.songDetails || []), ...(normalizedPayload?.songDetails || [])]
          .map((song) => [String(song?._id || song?.id || ""), normalizeSong(song)])
          .filter(([songId, song]) => Boolean(songId && song)),
      );
      const mergedSongDetails = mergedSongs
        .map((songId) => mergedSongDetailsById.get(String(songId || "")) || null)
        .filter(Boolean);
      const updatedPlaylist = normalizePlaylist({
        ...optimisticPlaylistBase,
        ...(normalizedPayload || {}),
        songs: mergedSongs,
        songDetails: mergedSongDetails,
        songCount: Math.max(mergedSongs.length, mergedSongDetails.length, normalizedPayload?.songCount || 0),
      });

      setPlaylists((previous) => {
        const exists = previous.some((entry) => String(entry.id || entry._id) === normalizedPlaylistId);
        if (!exists) {
          return [...previous, updatedPlaylist];
        }
        return previous.map((entry) =>
          String(entry.id || entry._id) === normalizedPlaylistId ? updatedPlaylist : entry,
        );
      });

      // Keep optimistic playlist state visible after add.
      // Some backend responses can lag and temporarily report stale song counts.
      if (backendAdded) {
        triggerPlaylistCounterPulse(normalizedPlaylistId);
      }
      setAuthError("");
      return {
        ok: true,
        message: backendAdded ? "Song added to playlist." : "Song already exists in this playlist.",
      };
    } catch (error) {
      const message = error.response?.data?.message || "Unable to add song to playlist.";
      setAuthError(message);
      return { ok: false, message };
    } finally {
      playlistMutationLockRef.current.delete(mutationKey);
    }
  };

  const removeFromPlaylist = async (songId, playlistId) => {
    if (!songId || !playlistId) return;

    if (!user) {
      setAuthError("Please login to modify playlists.");
      return;
    }

    const normalizedSongId = String(songId);
    const normalizedPlaylistId = String(playlistId);

    try {
      const response = await api.patch(
        `/playlists/${normalizedPlaylistId}/remove`,
        { songId: normalizedSongId },
        getAuthConfig(),
      );

      const payload = extractPlaylistPayload(response.data);
      const playlist = playlists.find((entry) => String(entry.id || entry._id) === normalizedPlaylistId);
      const updatedPlaylist = normalizePlaylist(
        payload || {
          ...(playlist || { id: normalizedPlaylistId, title: "Untitled playlist" }),
          songs: (playlist?.songs || []).filter((id) => String(id) !== normalizedSongId),
        },
      );

      setPlaylists((previous) =>
        previous.map((entry) =>
          String(entry.id || entry._id) === normalizedPlaylistId ? updatedPlaylist : entry,
        ),
      );
      await refreshPlaylistById(normalizedPlaylistId);
      await loadPlaylists();
      setAuthError("");
    } catch (error) {
      setAuthError(error.response?.data?.message || "Unable to remove song from playlist.");
    }
  };

  const renamePlaylist = async (playlistId, nextTitle) => {
    const trimmedTitle = String(nextTitle || "").trim();
    if (!playlistId || !trimmedTitle) return false;
    return updatePlaylistDetails(playlistId, { title: trimmedTitle });
  };

  const updatePlaylistPrivacy = async (playlistId, privacy) => {
    const normalizedPrivacy = String(privacy || "").trim().toLowerCase();
    if (!playlistId || !["private", "public", "unlisted"].includes(normalizedPrivacy)) return false;
    return updatePlaylistDetails(playlistId, { privacy: normalizedPrivacy });
  };

  const reorderPlaylistSongs = async (playlistId, orderedSongIds = []) => {
    if (!playlistId || !Array.isArray(orderedSongIds) || !orderedSongIds.length) return false;

    if (!user) {
      setAuthError("Please login to modify playlists.");
      return false;
    }

    const normalizedPlaylistId = String(playlistId);
    const normalizedSongIds = orderedSongIds.map((entry) => String(entry || "")).filter(Boolean);
    if (!normalizedSongIds.length) return false;

    try {
      const response = await api.patch(
        `/playlists/${normalizedPlaylistId}/reorder`,
        { songIds: normalizedSongIds },
        getAuthConfig(),
      );

      const payload = extractPlaylistPayload(response.data);
      const updatedPlaylist = normalizePlaylist(payload || { id: normalizedPlaylistId, title: "Untitled playlist", songs: normalizedSongIds });
      setPlaylists((previous) =>
        previous.map((entry) =>
          String(entry.id || entry._id) === normalizedPlaylistId ? updatedPlaylist : entry,
        ),
      );
      setAuthError("");
      return true;
    } catch (error) {
      setAuthError(error.response?.data?.message || "Unable to reorder playlist songs.");
      return false;
    }
  };

  const repairPlaylist = async (playlistId) => {
    if (!playlistId) return { ok: false, repairedCount: 0 };

    if (!user) {
      setAuthError("Please login to modify playlists.");
      return { ok: false, repairedCount: 0 };
    }

    const normalizedPlaylistId = String(playlistId);

    try {
      const response = await api.post(
        `/playlists/${normalizedPlaylistId}/repair`,
        {},
        getAuthConfig(),
      );

      const payload = extractPlaylistPayload(response.data);
      const updatedPlaylist = normalizePlaylist(
        payload || { id: normalizedPlaylistId, title: "Untitled playlist", songs: [] },
      );

      setPlaylists((previous) =>
        previous.map((entry) =>
          String(entry.id || entry._id) === normalizedPlaylistId ? updatedPlaylist : entry,
        ),
      );
      setAuthError("");

      await refreshPlaylistById(normalizedPlaylistId);

      return {
        ok: true,
        repairedCount: Number(response.data?.repairedCount) || 0,
        songCount: Number(response.data?.songCount) || updatedPlaylist.songCount || 0,
      };
    } catch (error) {
      const message = error.response?.data?.message || "Unable to repair playlist songs.";
      setAuthError(message);
      return { ok: false, repairedCount: 0, message };
    }
  };

  const deletePlaylist = async (playlistId) => {
    if (!playlistId) return false;

    if (!user) {
      setAuthError("Please login to modify playlists.");
      return false;
    }

    const normalizedPlaylistId = String(playlistId);
    try {
      await api.delete(`/playlists/${normalizedPlaylistId}`, getAuthConfig());

      setPlaylists((previous) =>
        previous.filter((entry) => String(entry.id || entry._id) !== normalizedPlaylistId),
      );

      setSelectedPlaylistId((current) => (String(current) === normalizedPlaylistId ? null : current));
      setAuthError("");
      return true;
    } catch (error) {
      setAuthError(error.response?.data?.message || "Unable to delete playlist.");
      return false;
    }
  };

  const likePlaylist = async (playlistId) => {
    if (!playlistId) return false;
    if (!user) {
      setAuthError("Please login to modify playlists.");
      return false;
    }

    const normalizedPlaylistId = String(playlistId);
    try {
      const response = await api.patch(
        `/playlists/${normalizedPlaylistId}/like`,
        {},
        getAuthConfig(),
      );
      const payload = extractPlaylistPayload(response.data);
      const updatedPlaylist = normalizePlaylist(payload || { id: normalizedPlaylistId, title: "Untitled playlist", songs: [] });
      setPlaylists((previous) =>
        previous.map((entry) =>
          String(entry.id || entry._id) === normalizedPlaylistId ? updatedPlaylist : entry,
        ),
      );
      setAuthError("");
      return true;
    } catch (error) {
      setAuthError(error.response?.data?.message || "Unable to like playlist.");
      return false;
    }
  };

  const addPlaylistComment = async (playlistId, text) => {
    const commentText = String(text || "").trim();
    if (!playlistId || !commentText) return false;
    if (!user) {
      setAuthError("Please login to modify playlists.");
      return false;
    }

    const normalizedPlaylistId = String(playlistId);
    try {
      const response = await api.post(
        `/playlists/${normalizedPlaylistId}/comments`,
        { text: commentText, user: user?.name || "Guest" },
        getAuthConfig(),
      );
      const payload = extractPlaylistPayload(response.data);
      const updatedPlaylist = normalizePlaylist(payload || { id: normalizedPlaylistId, title: "Untitled playlist", songs: [] });
      setPlaylists((previous) =>
        previous.map((entry) =>
          String(entry.id || entry._id) === normalizedPlaylistId ? updatedPlaylist : entry,
        ),
      );
      setAuthError("");
      return true;
    } catch (error) {
      setAuthError(error.response?.data?.message || "Unable to comment on playlist.");
      return false;
    }
  };

  const sharePlaylistUrl = (playlistId) => {
    const normalizedPlaylistId = String(playlistId || "").trim();
    if (!normalizedPlaylistId) return "";
    if (typeof window === "undefined") return `/playlist/${normalizedPlaylistId}`;
    return `${window.location.origin}/playlist/${normalizedPlaylistId}`;
  };

  const selectedPlaylist =
    playlists.find((playlist) => String(playlist.id || playlist._id) === String(selectedPlaylistId)) || playlists[0] || null;

  const authDebug = useMemo(
    () => ({
      apiBaseUrl: api.defaults.baseURL || "",
      sessionCookieMode: true,
      userPresent: Boolean(user),
      isAuthReady,
      authError,
    }),
    [user, isAuthReady, authError],
  );

  const playlistSongs = useMemo(
    () => {
      if (!selectedPlaylist) return [];

      const selectedSongIds = Array.isArray(selectedPlaylist.songs)
        ? selectedPlaylist.songs.map((songId) => String(songId || "")).filter(Boolean)
        : [];

      if (!selectedSongIds.length) {
        return [];
      }

      const detailsById = new Map(
        (selectedPlaylist.songDetails || [])
          .map((song) => [String(song?._id || song?.id || ""), normalizeSong(song)])
          .filter(([songId, song]) => Boolean(songId && song)),
      );

      const songsById = new Map(
        songs
          .map((song) => [String(getSongIdentifier(song)), normalizeSong(song)])
          .filter(([songId, song]) => Boolean(songId && song)),
      );

      return selectedSongIds
        .map((songId) => detailsById.get(songId) || songsById.get(songId) || null)
        .filter(Boolean);
    },
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
        playlistCounterPulse,
        audioRef,
        user,
        authDebug,
        isAuthReady,
        authError,
        setAuthError,
        isLoadingSongs,
        isLoadingPlaylists,
        playSong,
        setIsPlaying,
        playPlaylist,
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
        renamePlaylist,
        updatePlaylistDetails,
        updatePlaylistPrivacy,
        reorderPlaylistSongs,
        repairPlaylist,
        deletePlaylist,
        likePlaylist,
        addPlaylistComment,
        sharePlaylistUrl,
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
