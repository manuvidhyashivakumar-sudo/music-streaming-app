import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaSearch,
  FaUser,
  FaMusic,
} from "react-icons/fa";

const navItems = [
  { to: "/", icon: FaHome, label: "Home" },
  { to: "/search", icon: FaSearch, label: "Search" },
  { to: "/playlists", icon: FaMusic, label: "Playlists" },
  { to: "/profile", icon: FaUser, label: "Profile" },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-slate-900 p-5">
      <h1 className="text-3xl font-bold text-green-500 mb-10">
        Musicify
      </h1>

      <div className="space-y-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-3xl px-4 py-3 transition ${
                isActive ? "bg-slate-950 text-white" : "text-slate-300 hover:bg-slate-950"
              }`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}