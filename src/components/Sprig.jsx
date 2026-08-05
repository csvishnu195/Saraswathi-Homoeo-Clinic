// The recurring visual signature: a hand-drawn botanical sprig, nodding to
// homeopathy's roots in plant-based remedies. Used as dividers, bullets,
// and status marks throughout the app instead of generic icons/numbers.
export default function Sprig({ className = "", color = "var(--sage)" }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={`sprig ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M20 36C20 22 20 14 20 4"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M20 10C20 10 13 8 10 13C13 17 20 16 20 16"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 18C20 18 27 16 30 21C27 25 20 24 20 24"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 26C20 26 14 25 12 29C14 32 20 32 20 32"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
