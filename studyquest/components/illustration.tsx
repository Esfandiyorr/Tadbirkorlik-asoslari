export function Illustration({ variant = 'hero' }: { variant?: string }) {
  return (
    <svg viewBox="0 0 380 280" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={'book-' + variant} x1="85" y1="180" x2="270" y2="80">
          <stop stopColor="#ede9fe" />
          <stop offset="1" stopColor="#c4b5fd" />
        </linearGradient>
      </defs>
      <circle cx="210" cy="143" r="108" fill="white" fillOpacity=".08" />
      <ellipse cx="198" cy="236" rx="111" ry="17" fill="#2e1065" fillOpacity=".14" />
      <path d="m80 176 103-51 117 55-105 56Z" fill="#fbbf24" />
      <path d="m80 176 115 50v10L80 187Z" fill="#f59e0b" />
      <path d="m86 153 101-48 116 49-106 55Z" fill={'url(#book-' + variant + ')'} />
      <path d="m86 153 111 46v10L86 164Z" fill="#a78bfa" />
      <path d="m88 124 102-50 112 49-105 55Z" fill="#faf5ff" />
      <path d="m88 124 109 44v10L88 135Z" fill="#ddd6fe" />
      <path d="m197 168 105-45v10l-105 45Z" fill="#8b5cf6" />
      <path d="m129 109 61-29 68 29-62 31Z" fill="#8b5cf6" />
      <path d="m149 109 41-19 42 19-42 20Z" fill="#c4b5fd" />
      <path d="M259 106v44" stroke="#fbbf24" strokeWidth="4" />
      <circle cx="259" cy="153" r="7" fill="#fbbf24" />
      <g transform="translate(284 56) rotate(20)">
        <rect width="44" height="57" rx="12" fill="#c4b5fd" />
        <path
          d="m12 29 7 7 14-17"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <circle cx="85" cy="84" r="18" fill="#fda4af" />
      <path d="m79 84 4 4 8-9" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <path d="m318 166 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" fill="#fde68a" />
      <circle cx="115" cy="215" r="5" fill="#c4b5fd" />
      <circle cx="220" cy="48" r="4" fill="#fde68a" />
    </svg>
  );
}
