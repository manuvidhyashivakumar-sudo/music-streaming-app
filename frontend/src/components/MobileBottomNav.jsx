import { Link } from "react-router-dom";
import {
  FaHome,
  FaSearch,
  FaMusic,
  FaUser,
} from "react-icons/fa";

export default function MobileBottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-slate-700 bg-slate-900 p-4 lg:hidden">
      <Link to="/" className="text-slate-300 hover:text-white">
        <FaHome size={22} />
      </Link>
      <Link to="/search" className="text-slate-300 hover:text-white">
        <FaSearch size={22} />
      </Link>
      <Link to="/playlists" className="text-slate-300 hover:text-white">
        <FaMusic size={22} />
      </Link>
      <Link to="/profile" className="text-slate-300 hover:text-white">
        <FaUser size={22} />
      </Link>
    </div>
  );
}
