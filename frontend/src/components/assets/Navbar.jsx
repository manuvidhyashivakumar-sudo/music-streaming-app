import { FaBell } from "react-icons/fa";

export default function Navbar() {
  return (
    <div className="sticky top-0 z-50 bg-slate-950 p-4 flex justify-between items-center">
      <input
        type="text"
        placeholder="Search songs, artists..."
        className="bg-slate-800 px-4 py-2 rounded-lg w-[60%]"
      />

      <div className="flex items-center gap-4">
        <FaBell size={20} />

        <img
          src="https://i.pravatar.cc/40"
          alt=""
          className="rounded-full"
        />
      </div>
    </div>
  );
}