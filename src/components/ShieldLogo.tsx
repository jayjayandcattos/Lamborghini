export function ShieldLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5 L90 25 L90 80 L50 115 L10 80 L10 25 Z" stroke="#FFB300" strokeWidth="4" fill="#050505" />
      <path d="M50 11 L84 28 L84 77 L50 107 L16 77 L16 28 Z" fill="#0A0A0A" />
      <path d="M50 35 L48 45 L40 50 L38 55 L45 53 L50 63 L55 53 L62 55 L60 50 L52 45 Z" fill="#FFB300" />
      <path d="M35 30 Q41 35 47 41 M65 30 Q59 35 53 41" stroke="#FFB300" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
