import { useEffect, useState } from "react";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import Sprig from "./Sprig";

function Stars({ value, onChange }) {
  const interactive = typeof onChange === "function";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange && onChange(n)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
          style={{ color: n <= value ? "var(--gold)" : "var(--line)", fontSize: "1.1rem", lineHeight: 1 }}
          aria-label={`${n} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  const { user, profile, isPatient } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  async function submitReview(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await addDoc(collection(db, "reviews"), {
        rating,
        comment: comment.trim(),
        patientName: profile?.name || "Patient",
        patientId: user.uid,
        createdAt: serverTimestamp(),
      });
      setComment("");
      setRating(5);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="reviews" className="mx-auto max-w-6xl px-5 py-16">
      <div className="leaf-rule mb-6 max-w-xs">
        <Sprig className="w-5 h-5" />
      </div>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-10">
        <h2 className="font-display text-3xl" style={{ color: "var(--forest)" }}>
          What patients say
        </h2>
        {average && (
          <p className="font-mono text-sm" style={{ color: "var(--text-muted)" }}>
            {average} / 5 average &middot; {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {reviews.length === 0 && (
        <p style={{ color: "var(--text-muted)" }}>No reviews yet — be the first to consult and share your experience.</p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-12">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl p-5" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
            <Stars value={r.rating} />
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text)" }}>
              {r.comment}
            </p>
            <p className="mt-4 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
              — {r.patientName}
            </p>
          </div>
        ))}
      </div>

      {isPatient && (
        <div className="max-w-lg rounded-2xl p-6" style={{ background: "var(--forest)" }}>
          <p className="font-display text-lg text-white mb-4">Leave a review</p>
          {done ? (
            <p className="text-sm" style={{ color: "#CFE0C6" }}>
              Thank you — your review has been posted above.
            </p>
          ) : (
            <form onSubmit={submitReview} className="space-y-4">
              <Stars value={rating} onChange={setRating} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was your consultation?"
                rows={3}
                required
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: "var(--paper)" }}
              />
              {error && <p className="text-sm text-red-300">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-full font-medium text-sm"
                style={{ background: "var(--gold)", color: "var(--forest)" }}
              >
                {submitting ? "Posting…" : "Post review"}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
