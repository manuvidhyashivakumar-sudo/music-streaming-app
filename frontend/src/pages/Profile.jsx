import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMusic } from "../context/MusicContext";

export default function Profile() {
  const { user, token, isAuthReady, logoutUser, updatePassword, authError, setAuthError } = useMusic();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  if (!isAuthReady && token) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-green-400">Profile</p>
        <h1 className="mt-4 text-3xl font-bold text-white">Loading your profile...</h1>
        <p className="mt-4 text-slate-400">Restoring your session details.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-green-400">Profile</p>
        <h1 className="mt-4 text-3xl font-bold text-white">You are not signed in</h1>
        <p className="mt-4 text-slate-400">Please sign in or register to view and manage your profile.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="rounded-3xl bg-green-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-green-400"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            Register
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const success = await updatePassword(currentPassword, newPassword);
    if (!success) return;
    setCurrentPassword("");
    setNewPassword("");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-green-400">Profile</p>
            <h1 className="text-3xl font-bold text-white">Welcome back, {user.name}.</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              logoutUser();
              navigate("/");
            }}
            className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-400">Name</p>
            <p className="mt-2 text-xl font-semibold text-white">{user.name}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-400">Email</p>
            <p className="mt-2 text-xl font-semibold text-white">{user.email}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.3em] text-green-400">Change password</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Update your password</h2>
          <p className="text-slate-400">Enter your current password and a new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
            />
          </div>

          {authError ? <p className="text-sm text-red-400">{authError}</p> : null}

          <button type="submit" className="rounded-3xl bg-green-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-green-400">
            Update password
          </button>
        </form>
      </section>
    </div>
  );
}
