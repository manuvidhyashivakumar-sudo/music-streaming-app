import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMusic } from "../context/MusicContext";

export default function Register() {
  const { registerUser, user, token, isAuthReady, authError, setAuthError } = useMusic();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  if (!isAuthReady && token) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-green-400">Register</p>
        <h1 className="mt-4 text-3xl font-bold text-white">Checking your session...</h1>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/profile" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await registerUser(name, email, password);
    if (!result) return;

    if (result === "requires-login") {
      navigate("/login", { state: { email: email.trim().toLowerCase() } });
      return;
    }

    setAuthError("");
    navigate("/");
  };

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-8">
      <p className="text-sm uppercase tracking-[0.3em] text-green-400">Register</p>
      <h1 className="mt-4 text-3xl font-bold text-white">Create your music streaming account</h1>
      <p className="mt-4 text-slate-400">Register with your email to save playlists and personalize your experience.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-200">Name</label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
          />
        </div>

        {authError ? <p className="text-sm text-red-400">{authError}</p> : null}

        <button type="submit" className="w-full rounded-3xl bg-green-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-green-400">
          Register
        </button>
      </form>
    </div>
  );
}
