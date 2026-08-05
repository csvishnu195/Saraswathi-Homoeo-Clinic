import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sprig from "../components/Sprig";

export default function PatientAuth() {
  const [tab, setTab] = useState("login");
  const { loginPatient, registerPatient } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (tab === "login") {
        await loginPatient({ email: form.email, password: form.password });
      } else {
        if (!form.name || !form.phone) throw new Error("Please fill in your name and phone number.");
        await registerPatient(form);
      }
      navigate("/dashboard");
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
        <p className="font-display text-2xl" style={{ color: "var(--forest)" }}>Patient Access</p>
      </div>

      <div className="flex rounded-full p-1 mb-8" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
        {["login", "signup"].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(""); }}
            className="flex-1 py-2 rounded-full text-sm font-medium capitalize transition"
            style={{
              background: tab === t ? "var(--sage)" : "transparent",
              color: tab === t ? "#fff" : "var(--text-muted)",
            }}
          >
            {t === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {tab === "signup" && (
          <>
            <Field label="Full name" value={form.name} onChange={update("name")} required />
            <Field label="Phone number" value={form.phone} onChange={update("phone")} required type="tel" />
          </>
        )}
        <Field label="Email" value={form.email} onChange={update("email")} required type="email" />
        <Field label="Password" value={form.password} onChange={update("password")} required type="password" minLength={6} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 rounded-full text-white font-medium"
          style={{ background: "var(--sage)" }}
        >
          {busy ? "Please wait…" : tab === "login" ? "Log in" : "Create account"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block text-sm">
      <span className="block mb-1.5 font-medium" style={{ color: "var(--forest)" }}>{label}</span>
      <input
        {...props}
        className="w-full rounded-lg px-3 py-2.5 border"
        style={{ borderColor: "var(--line)", background: "var(--paper)" }}
      />
    </label>
  );
}
