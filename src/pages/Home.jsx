import DoctorHero from "../components/DoctorHero";
import BookingCalendar from "../components/BookingCalendar";
import ReviewsSection from "../components/ReviewsSection";
import Sprig from "../components/Sprig";

const STEPS = [
  { title: "Pick a slot", body: "Browse Dr Kumar's open times on the clinic calendar." },
  { title: "Confirm details", body: "Tell us your symptoms and contact details when booking." },
  { title: "Join by video", body: "The clinic sends a video link to your consultation record." },
];

export default function Home() {
  return (
    <>
      <DoctorHero />

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] items-start">
          <div>
            <div className="leaf-rule mb-6 max-w-xs">
              <Sprig className="w-5 h-5" />
            </div>
            <h2 className="font-display text-3xl mb-6" style={{ color: "var(--forest)" }}>
              How a consultation works
            </h2>
            <div className="space-y-6">
              {STEPS.map((s, i) => (
                <div key={s.title} className="flex gap-4">
                  <Sprig className="w-6 h-6 mt-1" />
                  <div>
                    <p className="font-medium" style={{ color: "var(--forest)" }}>{s.title}</p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <BookingCalendar mode="preview" />
        </div>
      </section>

      <ReviewsSection />
    </>
  );
}
