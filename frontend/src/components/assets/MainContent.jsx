import SongCard from "../SongCard";

const songs = [
  {
    id: 1,
    title: "Shape Of You",
    artist: "Ed Sheeran",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
  },
  {
    id: 2,
    title: "Believer",
    artist: "Imagine Dragons",
    image:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
  },
  {
    id: 3,
    title: "Perfect",
    artist: "Ed Sheeran",
    image:
      "https://images.unsplash.com/photo-1501612780327-45045538702b",
  },
];
export default function MainContent() {
  return (
    <div className="p-5">
      {/* Hero */}

      <div className="bg-gradient-to-r from-green-600 to-emerald-400 rounded-3xl p-10 mb-10">
        <h1 className="text-4xl font-bold">
          Discover New Music
        </h1>

        <p className="mt-3">
          Millions of songs waiting for you
        </p>

        <button className="bg-black mt-5 px-6 py-3 rounded-xl">
          Play Now
        </button>
      </div>

      <h2 className="text-2xl font-bold mb-5">
        Recommended Songs
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {songs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>
    </div>
  );
}