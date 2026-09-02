// Shared helpers for the admin "weekly working hours" template and for
// turning that template into concrete per-date slots in the `availability`
// collection. Kept separate from AdminDashboard.jsx so BookingCalendar-style
// date-key logic and time-string parsing live in one place.

export const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const DEFAULT_SLOT_MINUTES = 30;

// Matches what the clinic has been opening manually: Mon-Sat, 10:00-21:00.
export function defaultWeeklyTemplate() {
  const weekly = {};
  for (let day = 0; day < 7; day++) {
    weekly[day] = day === 0
      ? { open: false, start: "10:00", end: "21:00" }
      : { open: true, start: "10:00", end: "21:00" };
  }
  return { weekly, slotMinutes: DEFAULT_SLOT_MINUTES };
}

// Build the local "YYYY-MM-DD" key BookingCalendar/AdminDashboard use as the
// availability doc id. Must stay in sync with the identical helper in
// BookingCalendar.jsx (local date parts, not toISOString/UTC).
export function toDateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatTime12h(hour, minute) {
  const period = hour >= 12 ? "PM" : "AM";
  let h = hour % 12;
  if (h === 0) h = 12;
  const m = String(minute).padStart(2, "0");
  return `${h}:${m} ${period}`;
}

// Inverse of formatTime12h, for sorting a mixed/merged slots array back into
// chronological order (a plain string sort puts "10:00 AM" before "9:00 AM").
export function parseTimeToMinutes(time) {
  const match = /(\d+):(\d+)\s*(AM|PM)/i.exec(time || "");
  if (!match) return 0;
  let hour = parseInt(match[1], 10) % 12;
  const minute = parseInt(match[2], 10);
  if (match[3].toUpperCase() === "PM") hour += 12;
  return hour * 60 + minute;
}

// Turn one day's { open, start, end } template plus a slot length into the
// list of "h:MM AM/PM" strings between start (inclusive) and end (exclusive).
export function generateDaySlots(day, slotMinutes) {
  if (!day || !day.open || !day.start || !day.end || !slotMinutes) return [];
  const [startH, startM] = day.start.split(":").map(Number);
  const [endH, endM] = day.end.split(":").map(Number);
  if ([startH, startM, endH, endM].some(Number.isNaN)) return [];
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  const slots = [];
  for (let t = startTotal; t < endTotal; t += Number(slotMinutes)) {
    slots.push(formatTime12h(Math.floor(t / 60), t % 60));
  }
  return slots;
}

export function buildUpcomingDateKeys(count) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const keys = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    keys.push({ date: d, dateKey: toDateKey(d), weekday: d.getDay() });
  }
  return keys;
}
