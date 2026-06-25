import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MusicProvider } from "./context/MusicContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import MobileBottomNav from "./components/MobileBottomNav";
import MusicPlayer from "./components/MusicPlayer";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Playlist from "./pages/Playlist";
import Player from "./pages/Player";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";

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

              <main className="px-4 py-6 lg:px-8 lg:py-8">
                <Routes>
                  <Route path="/" element={<Home />} />
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

          <MusicPlayer />
        </div>
      </BrowserRouter>
    </MusicProvider>
  );
}
