// Fixed decorative background — medical equipment icons, very faint

const icons = [
  // Stethoscope
  <svg key="s1" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8h6a4 4 0 0 1 4 4v12a10 10 0 0 0 20 0V20a4 4 0 0 1 4-4h4" />
    <circle cx="46" cy="44" r="6" />
    <path d="M16 8a4 4 0 0 0-4 4v4a4 4 0 0 0 8 0v-4a4 4 0 0 0-4-4z" />
  </svg>,

  // Syringe
  <svg key="sy" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M50 14L36 28M22 42L8 56" />
    <rect x="24" y="18" width="16" height="28" rx="3" transform="rotate(-45 32 32)" />
    <path d="M40 24l-16 16M36 20l-16 16" />
    <path d="M56 8L44 20" />
  </svg>,

  // Pill capsule
  <svg key="p1" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="22" width="48" height="20" rx="10" />
    <line x1="32" y1="22" x2="32" y2="42" />
  </svg>,

  // Heart with pulse
  <svg key="h1" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M32 54S8 38 8 22a14 14 0 0 1 24-9.8A14 14 0 0 1 56 22c0 16-24 32-24 32z" />
    <polyline points="16,32 22,24 28,36 34,28 40,32 48,32" />
  </svg>,

  // First aid cross
  <svg key="c1" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="8" width="48" height="48" rx="6" />
    <line x1="32" y1="18" x2="32" y2="46" />
    <line x1="18" y1="32" x2="46" y2="32" />
  </svg>,

  // Test tubes
  <svg key="t1" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 8v32a8 8 0 0 0 16 0V8" />
    <line x1="18" y1="22" x2="38" y2="22" />
    <line x1="16" y1="8" x2="40" y2="8" />
    <path d="M44 8v24a6 6 0 0 0 12 0V8" />
    <line x1="42" y1="8" x2="58" y2="8" />
  </svg>,

  // Thermometer
  <svg key="th" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M32 8a6 6 0 0 1 6 6v22a12 12 0 1 1-12 0V14a6 6 0 0 1 6-6z" />
    <line x1="38" y1="20" x2="44" y2="20" />
    <line x1="38" y1="28" x2="42" y2="28" />
    <line x1="38" y1="36" x2="44" y2="36" />
  </svg>,

  // Clipboard / medical chart
  <svg key="cl" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="12" y="10" width="40" height="48" rx="4" />
    <path d="M24 10V8a8 8 0 0 1 16 0v2" />
    <line x1="22" y1="26" x2="42" y2="26" />
    <line x1="22" y1="34" x2="36" y2="34" />
    <line x1="22" y1="42" x2="38" y2="42" />
  </svg>,

  // Medical bag / first aid kit
  <svg key="b1" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="22" width="48" height="36" rx="4" />
    <path d="M22 22v-6a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v6" />
    <line x1="32" y1="32" x2="32" y2="48" />
    <line x1="24" y1="40" x2="40" y2="40" />
  </svg>,

  // Microscope
  <svg key="m1" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="28" cy="20" r="8" />
    <path d="M28 28v16M16 44h32M34 14l8-8 4 4-8 8" />
    <path d="M20 44a12 12 0 0 1 24 0" />
  </svg>,

  // Gloves / hand
  <svg key="g1" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 40V16a4 4 0 0 1 8 0v12M28 16V10a4 4 0 0 1 8 0v14M36 14a4 4 0 0 1 8 0v16M44 24a4 4 0 0 1 8 0v12a16 16 0 0 1-32 0V40" />
  </svg>,

  // Pills pack
  <svg key="pp" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="8" width="48" height="48" rx="4" />
    <circle cx="22" cy="22" r="6" />
    <circle cx="42" cy="22" r="6" />
    <circle cx="22" cy="42" r="6" />
    <circle cx="42" cy="42" r="6" />
  </svg>,
];

// Pre-defined positions to look naturally scattered
const positions = [
  { x: "3%",  y: "8%",  size: 72, rotate: -12, opacity: 0.055 },
  { x: "18%", y: "3%",  size: 56, rotate: 20,  opacity: 0.045 },
  { x: "38%", y: "6%",  size: 64, rotate: -5,  opacity: 0.05  },
  { x: "62%", y: "2%",  size: 52, rotate: 15,  opacity: 0.04  },
  { x: "82%", y: "7%",  size: 68, rotate: -20, opacity: 0.055 },
  { x: "92%", y: "25%", size: 58, rotate: 8,   opacity: 0.045 },
  { x: "88%", y: "50%", size: 72, rotate: -10, opacity: 0.05  },
  { x: "90%", y: "72%", size: 60, rotate: 25,  opacity: 0.04  },
  { x: "75%", y: "88%", size: 64, rotate: -15, opacity: 0.055 },
  { x: "52%", y: "92%", size: 56, rotate: 10,  opacity: 0.045 },
  { x: "28%", y: "90%", size: 68, rotate: -8,  opacity: 0.05  },
  { x: "8%",  y: "82%", size: 60, rotate: 18,  opacity: 0.04  },
  { x: "2%",  y: "55%", size: 72, rotate: -22, opacity: 0.055 },
  { x: "5%",  y: "32%", size: 52, rotate: 12,  opacity: 0.04  },
  { x: "25%", y: "45%", size: 48, rotate: -6,  opacity: 0.035 },
  { x: "48%", y: "48%", size: 56, rotate: 30,  opacity: 0.04  },
  { x: "68%", y: "38%", size: 60, rotate: -18, opacity: 0.045 },
  { x: "72%", y: "62%", size: 52, rotate: 7,   opacity: 0.04  },
];

export default function MedicalBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden>
      {positions.map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: pos.x,
            top: pos.y,
            width: pos.size,
            height: pos.size,
            opacity: pos.opacity,
            transform: `rotate(${pos.rotate}deg)`,
            color: "#1e3a5f",
          }}>
          {icons[i % icons.length]}
        </div>
      ))}
    </div>
  );
}
