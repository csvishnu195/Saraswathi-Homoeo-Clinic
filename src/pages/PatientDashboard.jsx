import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import BookingCalendar from "../components/BookingCalendar";
import Sprig from "../components/Sprig";

const STATUS_STYLE = {
  pending: { bg: "#F4E9CF", text: "#7A5B15" },
  confirmed: { bg: "#DCEAD6", text: "#2E4429" },
  completed: { bg: "#E4E1D6", text: "#5B6155" },
  cancelled: { bg: "#F3D9D6", text: "#8A3B33" },
};

export default function PatientDashboard() {
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [pendingSlot, setPendingSlot] = useState(null);
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "appointments"),
      where("patientId", "==", user.uid),
      orderBy("date", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  function handleSelectSlot(dateKey, time) {
    setError("");
    setReason("");
    setPendingSlot({ dateKey, time });
  }

  async function confirmBooking(e) {
    e.preventDefault();
    if (!pendingSlot) return;
    setBooking(true);
    setError("");
    try {
      const availRef = doc(db, "availability", pendingSlot.dateKey);
      const availSnap = await getDoc(availRef);
      if (!availSnap.exists()) throw new Error("That slot is no longer available.");
      const slots = availSnap.data().slots || [];
      const idx = slots.findIndex((s) => s.time === pendingSlot.time);
      if (idx === -1 || slots[idx].booked) throw new Error("That slot was just booked by someone else. Pick another.");

      const updatedSlots = slots.map((s, i) => (i === idx ? { ...s, booked: true } : s));
      await updateDoc(availRef, { slots: updatedSlots });

      await addDoc(collection(db, "appointments"), {
        patientId: user.uid,
        patientName: profile?.name || "Patient",
        patientPhone: profile?.phone || "",
        patientEmail: profile?.email || "",
        date: pendingSlot.dateKey,
        time: pendingSlot.time,
        reason: reason.trim(),
        status: "pending",
        zoomLink: "",
        createdAt: serverTimestamp(),
      });

      setPendingSlot(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex items-center gap-2 mb-2">
        <Sprig className="w-6 h-6" />
        <h1 className="font-display text-3xl" style={{ color: "var(--forest)" }}>
          My Consultations
        </h1>
      </div>
      <p className="mb-10" style={{ color: "var(--text-muted)" }}>
        Welcome back, {profile?.name}. Book a new slot or check the status of your consultations below.
      </p>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 className="font-display text-xl mb-4" style={{ color: "var(--forest)" }}>Book a new consultation</h2>
          <BookingCalendar mode="book" onSelectSlot={handleSelectSlot} refreshKey={refreshKey} />
        </div>

        <div>
          <h2 className="font-display text-xl mb-4" style={{ color: "var(--forest)" }}>Your appointments</h2>
          {appointments.length === 0 && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              You haven't booked a consultation yet.
            </p>
          )}
          <div className="space-y-4">
            {appointments.map((a) => {
              const style = STATUS_STYLE[a.status] || STATUS_STYLE.pending;
              return (
                <div key={a.id} className="rounded-xl p-4" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-sm" style={{ color: "var(--forest)" }}>
                      {a.date} &middot; {a.time}
                    </p>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full capitalize font-medium"
                      style={{ background: style.bg, color: style.text }}
                    >
                      {a.status}
                    </span>
                  </div>
                  {a.reason && (
                    <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>{a.reason}</p>
                  )}
                  {a.status === "confirmed" && a.zoomLink && (
                    <a
                      href={a.zoomLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-sm font-medium px-4 py-2 rounded-full text-white mt-1"
                      style={{ background: "var(--sage)" }}
                    >
                      Join video consultation
                    </a>
                  )}
                  {a.status === "confirmed" && !a.zoomLink && (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Confirmed — the clinic will share your video link shortly before your slot.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {pendingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5" style={{ background: "rgba(34,51,33,0.5)" }}>
          <form
            onSubmit={confirmBooking}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "var(--paper)" }}
          >
            <p className="font-display text-xl mb-1" style={{ color: "var(--forest)" }}>Confirm your slot</p>
            <p className="font-mono text-sm mb-4" style={{ color: "var(--sage)" }}>
              {pendingSlot.dateKey} &middot; {pendingSlot.time}
            </p>
            <label className="block text-sm mb-4">
              <span className="block mb-1.5 font-medium" style={{ color: "var(--forest)" }}>
                What would you like to discuss? (optional)
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg px-3 py-2 border text-sm"
                style={{ borderColor: "var(--line)" }}
              />
            </label>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingSlot(null)}
                className="flex-1 py-2.5 rounded-full border text-sm font-medium"
                style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={booking}
                className="flex-1 py-2.5 rounded-full text-sm font-medium text-white"
                style={{ background: "var(--sage)" }}
              >
                {booking ? "Booking…" : "Confirm booking"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
