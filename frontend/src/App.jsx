import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MusicProvider } from "./context/MusicContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import MobileBottomNav from "./components/MobileBottomNav";
import MusicPlayer from "./components/MusicPlayer";
import DetailedPlayer from "./components/DetailedPlayer";
import BottomBarPlayer from "./components/BottomBarPlayer";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Playlist from "./pages/Playlist";
import Player from "./pages/Player";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MusicifyUI from "./pages/MusicifyUI";

export default function App() {
  return (
    <MusicProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100">
          <div className="lg:flex lg:min-h-screen">
            <aside className="hidden lg:block">
              <Sidebar />
            </aside>

            <div className="flex-1">
              <Navbar />

              <main className="px-4 py-6 pb-40 sm:pb-44 lg:px-8 lg:py-8 lg:pb-36">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/musicify" element={<MusicifyUI />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/playlists" element={<Playlist />} />
                  <Route path="/player" element={<Player />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </div>

          <div className="lg:hidden">
            <MobileBottomNav />
          </div>

          {/* Desktop fixed detailed player */}
          <div className="fixed left-6 right-6 bottom-6 z-50 hidden lg:block">
            <div className="mx-auto max-w-6xl">
              <BottomBarPlayer />
            </div>
          </div>

          {/* Mobile player (keeps existing small player) */}
          <MusicPlayer />
        </div>
      </BrowserRouter>
    </MusicProvider>
  );
}
