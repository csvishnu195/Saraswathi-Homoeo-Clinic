import { useEffect, useRef, useState } from "react";
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
  serverTimestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../lib/firebase";
import Sprig from "../components/Sprig";
import { compressImageToDataUrl } from "../lib/imageCompress";
import {
  WEEKDAY_LABELS,
  defaultWeeklyTemplate,
  generateDaySlots,
  parseTimeToMinutes,
  buildUpcomingDateKeys,
} from "../lib/schedule";

const TABS = ["Appointments", "Availability", "Settings", "Patients", "Reviews"];
const UPCOMING_DAYS = 21; // keep in sync with BookingCalendar's window

// Reads the weekly-hours template from settings/schedule and, for each of
// the next UPCOMING_DAYS dates, adds any slots the template calls for that
// aren't already in that date's availability doc. Never removes or
// overwrites an existing slot (booked or not) — this only fills gaps, so an
// admin's manual tweaks in the Availability tab are always preserved.
async function generateUpcomingSlots(schedule) {
  const days = buildUpcomingDateKeys(UPCOMING_DAYS);
  let changedCount = 0;
  for (const { dateKey, weekday } of days) {
    const template = schedule.weekly?.[weekday];
    const templateSlots = generateDaySlots(template, schedule.slotMinutes);
    if (templateSlots.length === 0) continue;

    const ref = doc(db, "availability", dateKey);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data().slots || [] : [];
    const existingTimes = new Set(existing.map((s) => s.time));
    const missing = templateSlots.filter((t) => !existingTimes.has(t));
    if (missing.length === 0) continue;

    const merged = [...existing, ...missing.map((time) => ({ time, booked: false }))].sort(
      (a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time)
    );
    await setDoc(ref, { slots: merged });
    changedCount += 1;
  }
  return changedCount;
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("Appointments");

  // Best-effort auto-refresh: since this project has no server-side
  // scheduler, keep the rolling availability window topped up by running
  // the generator once per calendar day whenever an admin opens the
  // dashboard (any tab), using the saved weekly-hours template if one
  // exists. Silent — the Settings tab has a manual button for on-demand runs.
  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, "settings", "schedule");
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const schedule = snap.data();
        const todayKey = buildUpcomingDateKeys(1)[0].dateKey;
        if (schedule.lastGeneratedDate === todayKey) return;
        await generateUpcomingSlots(schedule);
        await setDoc(ref, { lastGeneratedDate: todayKey, lastGeneratedAt: serverTimestamp() }, { merge: true });
      } catch {
        // Silent — the admin can still generate manually from Settings.
      }
    })();
  }, []);

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
      {tab === "Settings" && <SettingsTab />}
      {tab === "Patients" && <PatientsTab />}
      {tab === "Reviews" && <ReviewsTab />}
    </div>
  );
}

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled"];

const createZoomMeetingCall = httpsCallable(functions, "createZoomMeeting");

function AppointmentsTab() {
  const [appointments, setAppointments] = useState([]);
  const [zoomDrafts, setZoomDrafts] = useState({});
  const [zoomBusy, setZoomBusy] = useState({});
  const [zoomErrors, setZoomErrors] = useState({});

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

  async function createZoomMeeting(id) {
    setZoomBusy((b) => ({ ...b, [id]: true }));
    setZoomErrors((e) => ({ ...e, [id]: "" }));
    try {
      await createZoomMeetingCall({ appointmentId: id });
    } catch (err) {
      setZoomErrors((e) => ({
        ...e,
        [id]: err.message.includes("not-found") || err.code === "functions/not-found"
          ? "Zoom auto-create isn't set up yet — paste a link manually below, or see functions/index.js for setup steps."
          : err.message,
      }));
    } finally {
      setZoomBusy((b) => ({ ...b, [id]: false }));
    }
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
            <div className="mt-3">
              <button
                onClick={() => createZoomMeeting(a.id)}
                disabled={zoomBusy[a.id]}
                className="px-3 py-1.5 rounded-lg text-sm text-white"
                style={{ background: "var(--forest)" }}
              >
                {zoomBusy[a.id] ? "Creating…" : a.zoomLink ? "Recreate Zoom meeting" : "Create Zoom meeting"}
              </button>
              {zoomErrors[a.id] && <p className="text-xs mt-1 text-red-600">{zoomErrors[a.id]}</p>}
              <div className="flex gap-2 mt-2">
                <input
                  type="url"
                  placeholder="…or paste a Zoom link manually"
                  defaultValue={a.zoomLink}
                  onChange={(e) => setZoomDrafts((d) => ({ ...d, [a.id]: e.target.value }))}
                  className="flex-1 rounded-lg px-3 py-1.5 border text-sm"
                  style={{ borderColor: "var(--line)" }}
                />
                <button
                  onClick={() => saveZoom(a.id)}
                  className="px-3 py-1.5 rounded-lg text-sm border flex-shrink-0"
                  style={{ borderColor: "var(--line)", color: "var(--forest)" }}
                >
                  Save link
                </button>
              </div>
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

const SLOT_LENGTH_OPTIONS = [15, 20, 30, 45, 60];

function SettingsTab() {
  return (
    <div className="space-y-12 max-w-2xl">
      <DoctorPhotoSection />
      <WeeklyHoursSection />
    </div>
  );
}

function DoctorPhotoSection() {
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    getDoc(doc(db, "settings", "site")).then((snap) => {
      setPhotoUrl(snap.exists() ? snap.data().doctorPhotoUrl || "" : "");
      setLoading(false);
    });
  }, []);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setStatus("Compressing & saving…");
    try {
      const dataUrl = await compressImageToDataUrl(file);
      await setDoc(doc(db, "settings", "site"), { doctorPhotoUrl: dataUrl, updatedAt: serverTimestamp() }, { merge: true });
      setPhotoUrl(dataUrl);
      setStatus("Photo updated.");
    } catch (err) {
      setError(err.message);
      setStatus("");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removePhoto() {
    setError("");
    setStatus("Removing…");
    await setDoc(doc(db, "settings", "site"), { doctorPhotoUrl: "", updatedAt: serverTimestamp() }, { merge: true });
    setPhotoUrl("");
    setStatus("Reverted to the default photo.");
  }

  return (
    <section>
      <h2 className="font-display text-xl mb-1" style={{ color: "var(--forest)" }}>Doctor photo</h2>
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
        Shown on the homepage. Upload a new photo any time — no redeploy needed.
      </p>
      {!loading && (
        <div className="flex items-center gap-5">
          <div
            className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0"
            style={{ border: "1px solid var(--line)", background: "var(--sage-light)" }}
          >
            <img
              src={photoUrl || "/doctor-photo.jpg"}
              alt="Current doctor photo"
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
            />
          </div>
          <div>
            <div className="flex gap-3">
              <label
                className="px-4 py-2 rounded-lg text-sm text-white cursor-pointer"
                style={{ background: "var(--sage)" }}
              >
                Upload new photo
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </label>
              {photoUrl && (
                <button
                  onClick={removePhoto}
                  className="px-4 py-2 rounded-lg text-sm border"
                  style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                >
                  Use default
                </button>
              )}
            </div>
            {status && <p className="text-xs mt-2" style={{ color: "var(--sage)" }}>{status}</p>}
            {error && <p className="text-xs mt-2 text-red-600">{error}</p>}
          </div>
        </div>
      )}
    </section>
  );
}

function WeeklyHoursSection() {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    getDoc(doc(db, "settings", "schedule")).then((snap) => {
      setSchedule(snap.exists() ? snap.data() : defaultWeeklyTemplate());
      setLoading(false);
    });
  }, []);

  function updateDay(dayIndex, patch) {
    setSchedule((s) => ({
      ...s,
      weekly: { ...s.weekly, [dayIndex]: { ...s.weekly[dayIndex], ...patch } },
    }));
  }

  async function saveSchedule() {
    setSaving(true);
    setStatus("");
    try {
      await setDoc(doc(db, "settings", "schedule"), schedule, { merge: true });
      setStatus("Schedule saved. It'll apply next time slots are generated.");
    } finally {
      setSaving(false);
    }
  }

  async function generateNow() {
    setSaving(true);
    setStatus("Generating…");
    try {
      const changed = await generateUpcomingSlots(schedule);
      const todayKey = buildUpcomingDateKeys(1)[0].dateKey;
      await setDoc(
        doc(db, "settings", "schedule"),
        { ...schedule, lastGeneratedDate: todayKey, lastGeneratedAt: serverTimestamp() },
        { merge: true }
      );
      setStatus(changed === 0
        ? `Already up to date for the next ${UPCOMING_DAYS} days.`
        : `Done — opened slots on ${changed} day${changed === 1 ? "" : "s"}.`);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !schedule) return <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>;

  return (
    <section>
      <h2 className="font-display text-xl mb-1" style={{ color: "var(--forest)" }}>Weekly working hours</h2>
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
        Set a default weekly schedule. The app opens matching slots for the next {UPCOMING_DAYS} days automatically
        each time you visit this dashboard — or click "Generate now" below for an immediate refresh. This never
        removes or overwrites slots you've already opened or that are booked; it only fills in what's missing.
      </p>

      <label className="block text-sm mb-4 max-w-[200px]">
        <span className="block mb-1.5 font-medium" style={{ color: "var(--forest)" }}>Slot length</span>
        <select
          value={schedule.slotMinutes}
          onChange={(e) => setSchedule((s) => ({ ...s, slotMinutes: Number(e.target.value) }))}
          className="w-full rounded-lg px-3 py-2 border text-sm"
          style={{ borderColor: "var(--line)" }}
        >
          {SLOT_LENGTH_OPTIONS.map((m) => (
            <option key={m} value={m}>{m} minutes</option>
          ))}
        </select>
      </label>

      <div className="space-y-2 mb-6">
        {WEEKDAY_LABELS.map((label, i) => {
          const day = schedule.weekly[i] || { open: false, start: "10:00", end: "21:00" };
          return (
            <div
              key={label}
              className="flex flex-wrap items-center gap-3 rounded-lg p-3"
              style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
            >
              <label className="flex items-center gap-2 w-28 flex-shrink-0 text-sm font-medium" style={{ color: "var(--forest)" }}>
                <input type="checkbox" checked={day.open} onChange={(e) => updateDay(i, { open: e.target.checked })} />
                {label}
              </label>
              <input
                type="time"
                value={day.start}
                disabled={!day.open}
                onChange={(e) => updateDay(i, { start: e.target.value })}
                className="rounded-lg px-2 py-1.5 border text-sm disabled:opacity-40"
                style={{ borderColor: "var(--line)" }}
              />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>to</span>
              <input
                type="time"
                value={day.end}
                disabled={!day.open}
                onChange={(e) => updateDay(i, { end: e.target.value })}
                className="rounded-lg px-2 py-1.5 border text-sm disabled:opacity-40"
                style={{ borderColor: "var(--line)" }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={saveSchedule}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm text-white"
          style={{ background: "var(--forest)" }}
        >
          Save schedule
        </button>
        <button
          onClick={generateNow}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm border"
          style={{ borderColor: "var(--line)", color: "var(--forest)" }}
        >
          Save & generate now
        </button>
        {status && <span className="text-xs" style={{ color: "var(--sage)" }}>{status}</span>}
      </div>
    </section>
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
