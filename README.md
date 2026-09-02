# Saraswathi Homoeo Clinic — Online Consultation Webapp

A full online-doctor-consultation web app: patients log in and book a time from
the clinic's calendar; the admin manages the doctor's availability and shares
a video (Zoom) link per booking. Built with React + Vite + Firebase.

## Features
- Clinic homepage with doctor photo, clinic name, "how it works", and a live
  calendar preview of open slots
- Patient sign up / log in (Firebase Auth, email + password)
- Admin log in (locked to one admin email you set, first-time setup creates the account)
- Calendar + time-slot booking (patients pick a date and time; only slots the
  admin has opened are shown; booking blocks the slot for others)
- Patient dashboard: book new consultations, see status of each
  (pending / confirmed / completed / cancelled), and a "Join video
  consultation" button once the admin adds a Zoom link
- Admin dashboard with 5 tabs:
  - **Appointments** — see every booking, change status, auto-create a Zoom
    meeting (or paste a link manually) for a booking
  - **Availability** — open/remove time slots per date
  - **Settings** — upload the doctor's photo and set the weekly working-hours
    template that auto-opens upcoming slots (see below)
  - **Patients** — list of all registered patients
  - **Reviews** — moderate (delete) patient reviews
- Public reviews section on the homepage with star ratings and average score;
  logged-in patients can post a review
- Firestore security rules included (`firestore.rules`) so patients can only
  see their own data and only admins can manage availability/appointments

## 1. Set up Firebase (free Spark plan is enough)
1. Go to https://console.firebase.google.com and create a project.
2. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable.**
3. **Build → Firestore Database → Create database** (production mode is fine —
   the rules file below locks it down).
4. **Project settings → General → Your apps → Add app → Web**, and copy the
   `firebaseConfig` object it gives you.
5. Paste those values into `src/lib/firebase.js`, replacing the placeholders.
6. In `src/lib/firebase.js`, set `ADMIN_EMAIL` to the real email the clinic
   admin will use to log in (defaults to `ssambaji9@gmail.com`).
7. Deploy the security rules: install the Firebase CLI (`npm i -g firebase-tools`),
   run `firebase login`, `firebase init firestore` (point it at this project and
   keep the existing `firestore.rules`), then `firebase deploy --only firestore:rules`.
   (Or paste the contents of `firestore.rules` into the Firestore "Rules" tab in
   the console and click Publish.)

## 2. Add the doctor's photo
Easiest: log in as admin → **Settings** tab → **Upload new photo**. It's
stored in Firestore (compressed client-side, no Firebase Storage/Blaze plan
needed) and takes effect immediately, no redeploy.

Alternatively, put a photo at `public/doctor-photo.jpg` before deploying —
that's the fallback used whenever no photo has been uploaded from Settings.
If neither exists, the homepage shows a clean placeholder automatically.

## 3. Run it locally
```bash
npm install
npm run dev
```
Open the printed localhost URL.

## 4. First-time admin setup
Go to `/admin` in the app, click **"First time setting up the clinic? Create
the admin account"**, enter the admin email (must match `ADMIN_EMAIL`) and a
password. This creates the one admin account. After that, use the same page
to log in normally.

## 5. Set the weekly schedule (instead of opening slots one by one)
Admin → **Settings** tab → **Weekly working hours**: tick which days are open,
set start/end time and slot length, then **Save & generate now**. From then
on, every time the dashboard loads it tops up the next 21 days of slots to
match the template (never touching slots you've already opened or that are
booked) — so you only need to revisit this if the hours actually change. You
can still open/remove individual slots by hand any time in **Availability**.

## 6. Auto-create Zoom meetings (optional — needs the Blaze plan)
The **Appointments** tab has a "Create Zoom meeting" button that calls a
Cloud Function (`functions/index.js`) to create the meeting via Zoom's API and
save the join link automatically. This needs:

1. **Upgrade the Firebase project to the Blaze (pay-as-you-go) plan** —
   Cloud Functions isn't available on Spark. Console → ⚙️ → Usage and billing
   → Details & settings → Modify plan. Blaze still has a free monthly quota;
   a small clinic's usage should stay at $0, but a card is required on file.
2. **Create a Zoom Server-to-Server OAuth app**: marketplace.zoom.us → Develop
   → Build App → Server-to-Server OAuth. Grant it the
   `meeting:write:meeting:admin` scope. Copy the Account ID, Client ID, and
   Client Secret it gives you.
3. **Store those as function secrets** (never commit them):
   ```bash
   cd functions
   firebase functions:secrets:set ZOOM_ACCOUNT_ID
   firebase functions:secrets:set ZOOM_CLIENT_ID
   firebase functions:secrets:set ZOOM_CLIENT_SECRET
   ```
4. **Deploy the function**:
   ```bash
   cd functions && npm install
   firebase deploy --only functions
   ```

Until this is done, the button shows a friendly "not set up yet" message and
the manual "paste a Zoom link" field next to it keeps working exactly as
before — nothing breaks in the meantime.

## 7. Day-to-day use
- **Admin**: **Availability** tab (or the Settings weekly template, see §5) →
  pick a date → add times (e.g. `10:00 AM`) → **Add slot**. Slots appear
  immediately on the public calendar and in the patient dashboard.
- **Patient**: signs up at `/login`, picks an open slot, optionally describes
  their concern, and books. Status starts as "pending".
- **Admin**: in the **Appointments** tab, click **Create Zoom meeting** (once
  §6 is set up) or paste a link manually, then set status to "confirmed" —
  the patient then sees a "Join video consultation" button on their
  dashboard.
- Either side can mark appointments **completed** or **cancelled** as needed.
- After a consultation, patients can leave a star rating + review on the
  homepage; the admin can remove inappropriate reviews from the **Reviews** tab.

## 8. Deploy
```bash
npm run build
firebase init hosting   # choose the "dist" folder as your public directory
firebase deploy --only hosting
```
This repo's `.github/workflows/firebase-hosting-merge.yml` also auto-deploys
`dist/` to Hosting on every push to `main`. It does **not** deploy the Cloud
Function — run `firebase deploy --only functions` yourself after §6's setup
(or ask to have that wired into CI once Blaze + secrets are in place).

## Project structure
```
src/
  components/   Navbar, Footer, DoctorHero, BookingCalendar, ReviewsSection, Sprig (icon), ProtectedRoute
  context/      AuthContext.jsx — Firebase Auth + Firestore role/profile handling
  lib/          firebase.js (project config), schedule.js (weekly-hours/slot-generation helpers),
                imageCompress.js (client-side photo compression for Settings)
  pages/        Home, PatientAuth, AdminLogin, PatientDashboard, AdminDashboard
functions/       Cloud Function for Zoom auto-create (needs Blaze — see §6)
firestore.rules  Security rules — deploy these before going live
```

## Notes
- Video calls use a Zoom meeting the admin creates with one click (or pastes
  manually) per booking rather than embedded WebRTC.
- Auth, Firestore, and Hosting all stay on the free Spark plan for a small
  clinic's volume. Only the Zoom auto-create Cloud Function (§6) needs Blaze;
  everything else in this app works without it.
