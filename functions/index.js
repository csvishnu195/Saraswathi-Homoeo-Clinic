// Cloud Function: auto-creates a Zoom meeting for a confirmed appointment
// and writes the join link back onto the appointment doc.
//
// Requires the Blaze plan (Cloud Functions isn't available on Spark) and a
// Zoom Server-to-Server OAuth app. Before deploying, set the three secrets
// this function reads (once, from the `functions/` directory):
//
//   firebase functions:secrets:set ZOOM_ACCOUNT_ID
//   firebase functions:secrets:set ZOOM_CLIENT_ID
//   firebase functions:secrets:set ZOOM_CLIENT_SECRET
//
// Get those three values from a Server-to-Server OAuth app in the Zoom
// Marketplace (marketplace.zoom.us -> Develop -> Build App -> Server-to-Server
// OAuth), with the meeting:write:meeting:admin scope granted. Then deploy:
//
//   cd functions && npm install && firebase deploy --only functions
//
// Nothing here runs, and nothing in the deployed site changes, until that's
// done — the "Create Zoom meeting" button in Admin just shows a clear error
// until the function exists.

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

const ZOOM_ACCOUNT_ID = defineSecret("ZOOM_ACCOUNT_ID");
const ZOOM_CLIENT_ID = defineSecret("ZOOM_CLIENT_ID");
const ZOOM_CLIENT_SECRET = defineSecret("ZOOM_CLIENT_SECRET");

// Appointment docs store date as "YYYY-MM-DD" and time as "h:MM AM/PM"
// (see AdminDashboard.jsx / BookingCalendar.jsx). Zoom wants a timezone-local
// "YYYY-MM-DDTHH:MM:SS" plus a separate IANA `timezone` field.
function toZoomStartTime(dateStr, timeStr) {
  const match = /(\d+):(\d+)\s*(AM|PM)/i.exec(timeStr || "");
  if (!match) throw new HttpsError("invalid-argument", `Unrecognized appointment time: "${timeStr}"`);
  let hour = parseInt(match[1], 10) % 12;
  const minute = parseInt(match[2], 10);
  if (match[3].toUpperCase() === "PM") hour += 12;
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${dateStr}T${hh}:${mm}:00`;
}

async function getZoomAccessToken() {
  const basicAuth = Buffer.from(`${ZOOM_CLIENT_ID.value()}:${ZOOM_CLIENT_SECRET.value()}`).toString("base64");
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID.value()}`,
    { method: "POST", headers: { Authorization: `Basic ${basicAuth}` } }
  );
  if (!res.ok) {
    throw new HttpsError("internal", `Zoom auth failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

export const createZoomMeeting = onCall(
  { secrets: [ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in as an admin first.");
    }

    const adminSnap = await db.doc(`users/${request.auth.uid}`).get();
    if (!adminSnap.exists || adminSnap.data().role !== "admin") {
      throw new HttpsError("permission-denied", "Only the clinic admin can create Zoom meetings.");
    }

    const appointmentId = request.data?.appointmentId;
    if (!appointmentId) {
      throw new HttpsError("invalid-argument", "appointmentId is required.");
    }

    const apptRef = db.doc(`appointments/${appointmentId}`);
    const apptSnap = await apptRef.get();
    if (!apptSnap.exists) {
      throw new HttpsError("not-found", "That appointment no longer exists.");
    }
    const appt = apptSnap.data();

    const accessToken = await getZoomAccessToken();
    const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: `Consultation: Dr Sachin Kumar & ${appt.patientName || "Patient"}`,
        type: 2, // scheduled meeting
        start_time: toZoomStartTime(appt.date, appt.time),
        duration: 30,
        timezone: "Asia/Kolkata",
        settings: {
          join_before_host: true,
          waiting_room: false,
          approval_type: 2, // no registration required
        },
      }),
    });

    if (!res.ok) {
      throw new HttpsError("internal", `Zoom meeting creation failed: ${res.status} ${await res.text()}`);
    }
    const meeting = await res.json();

    await apptRef.update({ zoomLink: meeting.join_url, status: "confirmed" });

    return { zoomLink: meeting.join_url };
  }
);
