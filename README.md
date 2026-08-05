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
- Admin dashboard with 4 tabs:
  - **Appointments** — see every booking, change status, paste a Zoom link
  - **Availability** — open/remove time slots per date
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
Put a photo at `public/doctor-photo.jpg`. If it's missing, the homepage shows a
clean placeholder automatically, so the app still works without it.

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

## 5. Day-to-day use
- **Admin**: log in at `/admin` → **Availability** tab → pick a date → add
  times (e.g. `10:00 AM`) → **Add slot**. Slots you add appear immediately on
  the public calendar and in the patient dashboard.
- **Patient**: signs up at `/login`, picks an open slot, optionally describes
  their concern, and books. Status starts as "pending".
- **Admin**: in the **Appointments** tab, paste a Zoom (or Google Meet) link
  and change status to "confirmed" — the patient then sees a "Join video
  consultation" button on their dashboard.
- Either side can mark appointments **completed** or **cancelled** as needed.
- After a consultation, patients can leave a star rating + review on the
  homepage; the admin can remove inappropriate reviews from the **Reviews** tab.

## 6. Deploy
```bash
npm run build
firebase init hosting   # choose the "dist" folder as your public directory
firebase deploy --only hosting
```
Or deploy the `dist/` folder to Netlify/Vercel — any static host works, since
all the backend logic lives in Firebase.

## Project structure
```
src/
  components/   Navbar, Footer, DoctorHero, BookingCalendar, ReviewsSection, Sprig (icon), ProtectedRoute
  context/      AuthContext.jsx — Firebase Auth + Firestore role/profile handling
  lib/          firebase.js — your Firebase project config + ADMIN_EMAIL
  pages/        Home, PatientAuth, AdminLogin, PatientDashboard, AdminDashboard
firestore.rules  Security rules — deploy these before going live
```

## Notes
- Video calls use a Zoom (or any) link the admin pastes per booking rather
  than embedded WebRTC — simplest and free, and works with any Zoom account.
- Everything runs on Firebase's free Spark plan for a small clinic's volume
  (Auth + Firestore + Hosting are all free at this scale).
