import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import Sprig from "../components/Sprig";

const TABS = ["Appointments", "Availability", "Patients", "Reviews"];

export default function AdminDashboard() {
  const [tab, setTab] = useState("Appointments");

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex items-center gap-2 mb-2">
        <Sprig className="w-6 h-6" />
        <h1 className="font-display text-3xl" style={{ color: "var(--forest)" }}>Clinic Admin</h1>
      </div>
      <p className="mb-8" style={{ color: "var(--text-muted)" }}>
        Manage Dr Kumar's calendar, appointments, patients, and reviews.
      </p>

      <div className="flex gap-2 mb-8 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-full text-sm font-medium flex-shrink-0"
            style={{
              background: tab === t ? "var(--forest)" : "var(--paper)",
              color: tab === t ? "#fff" : "var(--text-muted)",
              border: "1px solid var(--line)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Appointments" && <AppointmentsTab />}
      {tab === "Availability" && <AvailabilityTab />}
      {tab === "Patients" && <PatientsTab />}
      {tab === "Reviews" && <ReviewsTab />}
    </div>
  );
}

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled"];

function AppointmentsTab() {
  const [appointments, setAppointments] = useState([]);
  const [zoomDrafts, setZoomDrafts] = useState({});

  useEffect(() => {
    const q = query(collection(db, "appointments"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  async function setStatus(id, status) {
    await updateDoc(doc(db, "appointments", id), { status });
  }

  async function saveZoom(id) {
    const link = zoomDrafts[id];
    if (!link) return;
    await updateDoc(doc(db, "appointments", id), { zoomLink: link, status: "confirmed" });
  }

  if (appointments.length === 0) {
    return <p style={{ color: "var(--text-muted)" }}>No appointments booked yet.</p>;
  }

  return (
    <div className="space-y-4">
      {appointments.map((a) => (
        <div key={a.id} className="rounded-xl p-4 grid gap-3 sm:grid-cols-[1fr_auto]" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
          <div>
            <p className="font-mono text-sm" style={{ color: "var(--forest)" }}>{a.date} &middot; {a.time}</p>
            <p className="text-sm font-medium mt-1">{a.patientName} &middot; {a.patientPhone}</p>
            {a.reason && <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{a.reason}</p>}
            <div className="flex gap-2 mt-3">
              <input
                type="url"
                placeholder="Paste Zoom link"
                defaultValue={a.zoomLink}
                onChange={(e) => setZoomDrafts((d) => ({ ...d, [a.id]: e.target.value }))}
                className="flex-1 rounded-lg px-3 py-1.5 border text-sm"
                style={{ borderColor: "var(--line)" }}
              />
              <button
                onClick={() => saveZoom(a.id)}
                className="px-3 py-1.5 rounded-lg text-sm text-white flex-shrink-0"
                style={{ background: "var(--sage)" }}
              >
                Save link
              </button>
            </div>
          </div>
          <div className="flex sm:flex-col gap-2 items-start">
            <select
              value={a.status}
              onChange={(e) => setStatus(a.id, e.target.value)}
              className="rounded-lg px-3 py-1.5 border text-sm capitalize"
              style={{ borderColor: "var(--line)" }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

function AvailabilityTab() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [dateSlots, setDateSlots] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadSlots(d) {
    if (!d) return setDateSlots(null);
    setLoading(true);
    const snap = await getDoc(doc(db, "availability", d));
    setDateSlots(snap.exists() ? snap.data().slots || [] : []);
    setLoading(false);
  }

  useEffect(() => {
    loadSlots(date);
  }, [date]);

  async function addSlot(e) {
    e.preventDefault();
    if (!date || !time) return;
    const current = dateSlots || [];
    if (current.some((s) => s.time === time)) return;
    const updated = [...current, { time, booked: false }].sort();
    await setDoc(doc(db, "availability", date), { slots: updated });
    setDateSlots(updated);
    setTime("");
  }

  async function removeSlot(t) {
    const updated = (dateSlots || []).filter((s) => s.time !== t);
    await setDoc(doc(db, "availability", date), { slots: updated });
    setDateSlots(updated);
  }

  return (
    <div className="max-w-lg">
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Open up time slots for a date. Patients will only see and book slots you add here.
      </p>
      <form onSubmit={addSlot} className="flex flex-wrap gap-3 mb-6">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="rounded-lg px-3 py-2 border text-sm"
          style={{ borderColor: "var(--line)" }}
        />
        <input
          type="text"
          placeholder="e.g. 10:00 AM"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          className="rounded-lg px-3 py-2 border text-sm"
          style={{ borderColor: "var(--line)" }}
        />
        <button type="submit" className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: "var(--sage)" }}>
          Add slot
        </button>
      </form>

      {loading && <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>}

      {date && !loading && (
        <div className="flex flex-wrap gap-2">
          {(dateSlots || []).length === 0 && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No slots yet for {date}.</p>
          )}
          {(dateSlots || []).map((s) => (
            <span
              key={s.time}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-mono"
              style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
            >
              {s.time}
              {s.booked && <em className="not-italic text-xs" style={{ color: "var(--sage)" }}>booked</em>}
              {!s.booked && (
                <button onClick={() => removeSlot(s.time)} aria-label={`Remove ${s.time}`} style={{ color: "var(--text-muted)" }}>
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PatientsTab() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "patient"));
    const unsub = onSnapshot(q, (snap) => {
      setPatients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  if (patients.length === 0) return <p style={{ color: "var(--text-muted)" }}>No patients registered yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left" style={{ color: "var(--text-muted)" }}>
            <th className="pb-2 pr-4 font-medium">Name</th>
            <th className="pb-2 pr-4 font-medium">Email</th>
            <th className="pb-2 pr-4 font-medium">Phone</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.id} style={{ borderTop: "1px solid var(--line)" }}>
              <td className="py-2 pr-4">{p.name}</td>
              <td className="py-2 pr-4">{p.email}</td>
              <td className="py-2 pr-4">{p.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewsTab() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  async function remove(id) {
    await deleteDoc(doc(db, "reviews", id));
  }

  if (reviews.length === 0) return <p style={{ color: "var(--text-muted)" }}>No reviews yet.</p>;

  return (
    <div className="space-y-3 max-w-2xl">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-xl p-4 flex justify-between gap-4" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--gold)" }}>{"★".repeat(r.rating)}</p>
            <p className="text-sm mt-1">{r.comment}</p>
            <p className="font-mono text-xs mt-2" style={{ color: "var(--text-muted)" }}>— {r.patientName}</p>
          </div>
          <button onClick={() => remove(r.id)} className="text-xs flex-shrink-0" style={{ color: "#8A3B33" }}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
