import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sprig from "./Sprig";

export default function Navbar() {
  const { user, profile, isAdmin, isPatient, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
      <nav className="mx-auto max-w-6xl flex items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <Sprig className="w-7 h-7" />
          <span className="font-display text-lg" style={{ color: "var(--forest)" }}>
            Saraswathi Homoeo Clinic
          </span>
        </Link>

        <div className="flex items-center gap-5 font-body text-sm">
          <Link to="/#reviews" className="hidden sm:inline hover:opacity-70" style={{ color: "var(--text-muted)" }}>
            Reviews
          </Link>

          {!user && (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-full border"
                style={{ borderColor: "var(--sage)", color: "var(--forest)" }}
              >
                Patient Login
              </Link>
              <Link
                to="/admin"
                className="hidden sm:inline hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                Admin
              </Link>
            </>
          )}

          {user && isPatient && (
            <>
              <span className="hidden sm:inline" style={{ color: "var(--text-muted)" }}>
                Hi, {profile?.name?.split(" ")[0]}
              </span>
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-full text-white"
                style={{ background: "var(--sage)" }}
              >
                My Consultations
              </Link>
              <button onClick={handleLogout} className="hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                Log out
              </button>
            </>
          )}

          {user && isAdmin && (
            <>
              <Link
                to="/admin/dashboard"
                className="px-4 py-2 rounded-full text-white"
                style={{ background: "var(--forest)" }}
              >
                Admin Dashboard
              </Link>
              <button onClick={handleLogout} className="hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                Log out
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
