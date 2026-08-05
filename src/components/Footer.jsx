import Sprig from "./Sprig";

export default function Footer() {
  return (
    <footer className="mt-24 border-t" style={{ borderColor: "var(--line)", background: "var(--forest)" }}>
      <div className="mx-auto max-w-6xl px-5 py-12 grid gap-8 sm:grid-cols-3 text-sm" style={{ color: "#E7E4D8" }}>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sprig color="#E4C888" className="w-6 h-6" />
            <span className="font-display text-base text-white">Saraswathi Homoeo Clinic</span>
          </div>
          <p style={{ color: "#B9C0AE" }}>
            Gentle, individualised homeopathic care — now a video call away.
          </p>
        </div>
        <div>
          <p className="font-medium text-white mb-2">Consulting</p>
          <p style={{ color: "#B9C0AE" }}>Dr Sachin Kumar, BHMS</p>
          <p style={{ color: "#B9C0AE" }}>Online video consultations by appointment</p>
        </div>
        <div>
          <p className="font-medium text-white mb-2">Reach us</p>
          <p style={{ color: "#B9C0AE" }}>Phone: 7353853096</p>
          <p style={{ color: "#B9C0AE" }}>Email: ssambaji9@gmail.com</p>
        </div>
      </div>
      <div className="text-center text-xs pb-6" style={{ color: "#7C8571" }}>
        © {new Date().getFullYear()} Saraswathi Homoeo Clinic. All rights reserved.
      </div>
    </footer>
  );
}
