import { useState } from "react";
import { Link } from "react-router-dom";
import Sprig from "./Sprig";

export default function DoctorHero() {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section className="mx-auto max-w-6xl px-5 pt-14 pb-10 grid gap-10 md:grid-cols-[1.1fr_0.9fr] items-center">
      <div>
        <div className="leaf-rule mb-6 max-w-[220px]">
          <Sprig className="w-5 h-5" />
        </div>
        <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: "var(--sage)" }}>
          Saraswathi Homoeo Clinic — Online Consultation
        </p>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.08] mb-5" style={{ color: "var(--forest)" }}>
          Homeopathic care,
          <br />
          rooted in your history,
          <br />
          delivered over video.
        </h1>
        <p className="text-base leading-relaxed max-w-md mb-8" style={{ color: "var(--text-muted)" }}>
          Consult Dr Sachin Kumar from wherever you are. Pick a time on the clinic's
          calendar, describe how you're feeling, and join by video at your slot.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/login"
            className="px-6 py-3 rounded-full text-white font-medium"
            style={{ background: "var(--sage)" }}
          >
            Book a Consultation
          </Link>
          <a
            href="#reviews"
            className="px-6 py-3 rounded-full border font-medium"
            style={{ borderColor: "var(--forest)", color: "var(--forest)" }}
          >
            Read Patient Reviews
          </a>
        </div>
      </div>

      <div className="relative justify-self-center">
        <div
          className="absolute -inset-4 rounded-[2rem] -z-10"
          style={{ background: "var(--gold-light)", opacity: 0.35 }}
          aria-hidden="true"
        />
        <div
          className="w-72 h-80 sm:w-80 sm:h-96 rounded-[2rem] overflow-hidden border-4 flex items-center justify-center"
          style={{ borderColor: "var(--paper)", background: "var(--sage-light)" }}
        >
          {!imgFailed ? (
            <img
              src="/doctor-photo.jpg"
              alt="Dr Sachin Kumar, BHMS"
              className="w-full h-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center px-6">
              <Sprig className="w-10 h-10" color="var(--paper)" />
              <p className="font-display text-2xl text-white">Dr Sachin Kumar</p>
              <p className="text-xs text-white/85">
                Replace <code>public/doctor-photo.jpg</code> with the doctor's photo
              </p>
            </div>
          )}
        </div>
        <div
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl shadow-sm text-center font-mono text-xs"
          style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
        >
          Dr Sachin Kumar &middot; BHMS
        </div>
      </div>
    </section>
  );
}
