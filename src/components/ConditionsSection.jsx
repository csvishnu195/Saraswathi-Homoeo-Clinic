import {
  TbBrain, TbLungs, TbActivity, TbApple, TbSparkles, TbBone, TbDroplet, TbHeartbeat,
} from "react-icons/tb";
import Sprig from "./Sprig";

const CONDITIONS = [
  { label: "Neurological", icon: TbBrain, items: ["Migraine", "Headache"] },
  { label: "Respiratory & ENT", icon: TbLungs, items: ["Allergy", "Sinusitis", "Bronchitis", "Asthma", "Nasal polyps"] },
  { label: "Hormonal & Metabolic", icon: TbActivity, items: ["Thyroid problem", "PCOD", "PCOS"] },
  { label: "Digestive", icon: TbApple, items: ["Acidity", "GERD", "Liver disease", "Gall stone", "Celiac disease"] },
  { label: "Skin & Hair", icon: TbSparkles, items: ["Acne", "Skin problem", "Hair fall and dandruff"] },
  { label: "Musculoskeletal & Vascular", icon: TbBone, items: ["Back pain", "Joint pain", "Varicose vein", "Varicose ulcer"] },
  { label: "Urinary", icon: TbDroplet, items: ["Kidney stone"] },
  { label: "Ano-rectal", icon: TbHeartbeat, items: ["Haemorrhoids (piles)", "Fistula", "Fissure"] },
];

export default function ConditionsSection() {
  return (
    <section id="conditions" className="mx-auto max-w-6xl px-5 py-16">
      <div className="leaf-rule mb-6 max-w-xs">
        <Sprig className="w-5 h-5" />
      </div>
      <h2 className="font-display text-3xl mb-2" style={{ color: "var(--forest)" }}>
        Conditions We Treat
      </h2>
      <p className="text-sm mb-10" style={{ color: "var(--text-muted)" }}>
        A few examples of what Dr Sachin Kumar commonly sees in clinic.
      </p>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CONDITIONS.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-2xl p-5"
              style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--gold-light)", opacity: 0.9 }}
                >
                  <Icon size={20} style={{ color: "var(--forest)" }} />
                </div>
                <p className="font-display text-lg" style={{ color: "var(--forest)" }}>
                  {c.label}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {c.items.map((item) => (
                  <span
                    key={item}
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: "var(--sage-light)", color: "var(--forest-2)", opacity: 0.9 }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
