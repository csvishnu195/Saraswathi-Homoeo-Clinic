import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ADMIN_EMAIL } from "../lib/firebase";
import Sprig from "../components/Sprig";

export default function AdminLogin() {
  const { loginAdmin, registerAdminFirstTime } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [firstTime, setFirstTime] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (firstTime) {
        await registerAdminFirstTime({ email, password });
      } else {
        await loginAdmin({ email, password });
      }
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="flex items-center gap-2 mb-8 justify-center">
        <Sprig className="w-6 h-6" />
        <p className="font-display text-2xl" style={{ color: "var(--forest)" }}>Clinic Admin</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="block mb-1.5 font-medium" style={{ color: "var(--forest)" }}>Admin email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg px-3 py-2.5 border"
            style={{ borderColor: "var(--line)", background: "var(--paper)" }}
          />
        </label>
        <label className="block text-sm">
          <span className="block mb-1.5 font-medium" style={{ color: "var(--forest)" }}>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg px-3 py-2.5 border"
            style={{ borderColor: "var(--line)", background: "var(--paper)" }}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 rounded-full text-white font-medium"
          style={{ background: "var(--forest)" }}
        >
          {busy ? "Please wait…" : firstTime ? "Create admin account" : "Log in"}
        </button>

        <button
          type="button"
          onClick={() => setFirstTime((f) => !f)}
          className="w-full text-xs text-center"
          style={{ color: "var(--text-muted)" }}
        >
          {firstTime ? "Already set up? Log in instead" : "First time setting up the clinic? Create the admin account"}
        </button>
      </form>
    </div>
  );
}
