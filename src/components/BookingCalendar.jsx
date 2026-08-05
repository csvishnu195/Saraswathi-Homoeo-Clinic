import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import Sprig from "./Sprig";

function toDateKey(d) {
  return d.toISOString().slice(0, 10);
}

function buildUpcomingDays(count = 21) {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

/**
 * mode="preview": read-only teaser for the homepage (no login required).
 * mode="book": interactive, calls onSelectSlot(dateKey, time) when a patient
 *              taps an open slot.
 */
export default function BookingCalendar({ mode = "preview", onSelectSlot, refreshKey = 0 }) {
  const days = useMemo(() => buildUpcomingDays(21), []);
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [slots, setSlots] = useState(null);
  const [loading, setLoading] = useState(true);

  const dateKey = toDateKey(selectedDay);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDoc(doc(db, "availability", dateKey))
      .then((snap) => {
        if (cancelled) return;
        setSlots(snap.exists() ? snap.data().slots || [] : []);
      })
      .catch(() => !cancelled && setSlots([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [dateKey, refreshKey]);

  return (
    <div className="rounded-2xl p-5 sm:p-6" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Sprig className="w-5 h-5" />
        <p className="font-display text-lg" style={{ color: "var(--forest)" }}>
          Dr Kumar's availability
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4" style={{ scrollbarWidth: "thin" }}>
        {days.map((d) => {
          const key = toDateKey(d);
          const active = key === dateKey;
          return (
            <button
              key={key}
              onClick={() => setSelectedDay(d)}
              className="flex-shrink-0 w-16 py-2 rounded-xl text-center font-mono text-xs transition"
              style={{
                background: active ? "var(--sage)" : "transparent",
                color: active ? "#fff" : "var(--text-muted)",
                border: `1px solid ${active ? "var(--sage)" : "var(--line)"}`,
              }}
            >
              <div>{d.toLocaleDateString("en-IN", { weekday: "short" })}</div>
              <div className="text-sm mt-0.5">{d.getDate()}</div>
            </button>
          );
        })}
      </div>

      <div className="leaf-rule mb-4">
        <span className="font-mono text-xs uppercase" style={{ color: "var(--text-muted)" }}>
          {selectedDay.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </span>
      </div>

      {loading && <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading slots…</p>}

      {!loading && slots && slots.length === 0 && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No slots have been opened for this date yet. Try another day.
        </p>
      )}

      {!loading && slots && slots.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map((slot) => {
            const disabled = slot.booked || mode === "preview";
            return (
              <button
                key={slot.time}
                disabled={disabled}
                onClick={() => onSelectSlot && onSelectSlot(dateKey, slot.time)}
                className="py-2 rounded-lg font-mono text-xs border transition disabled:cursor-not-allowed"
                style={{
                  borderColor: slot.booked ? "var(--line)" : "var(--sage)",
                  background: slot.booked ? "var(--bg)" : "transparent",
                  color: slot.booked ? "var(--text-muted)" : "var(--forest)",
                  opacity: slot.booked ? 0.55 : 1,
                  textDecoration: slot.booked ? "line-through" : "none",
                }}
                title={slot.booked ? "Already booked" : mode === "preview" ? "Log in to book" : "Book this slot"}
              >
                {slot.time}
              </button>
            );
          })}
        </div>
      )}

      {mode === "preview" && (
        <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
          Log in as a patient to reserve one of these times.
        </p>
      )}
    </div>
  );
}
