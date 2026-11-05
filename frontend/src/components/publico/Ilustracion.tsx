/** Fresa bañada en chocolate, ilustración principal del inicio. */
export function FresaIlustracion({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 360" className={className} aria-hidden>
      <defs>
        <linearGradient id="fr-cuerpo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff6f9c" />
          <stop offset="1" stopColor="#d42a5f" />
        </linearGradient>
        <linearGradient id="fr-choco" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b412d" />
          <stop offset="1" stopColor="#3f2519" />
        </linearGradient>
        <radialGradient id="fr-brillo" cx="0.35" cy="0.3" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Hojas */}
      <path d="M160 70c-18-30-52-38-72-26 22 4 40 16 52 34Z" fill="#5fae6b" />
      <path d="M160 70c18-30 52-38 72-26-22 4-40 16-52 34Z" fill="#4c9a59" />
      <path d="M160 74c-6-26 2-50 14-60-2 20-4 40-8 60Z" fill="#6cbd77" />
      {/* Cuerpo */}
      <path d="M160 340C82 300 40 230 40 160c0-60 52-96 120-96s120 36 120 96c0 70-42 140-120 180Z" fill="url(#fr-cuerpo)" />
      {/* Semillas */}
      {[
        [110, 250], [150, 270], [190, 250], [130, 300], [175, 298], [92, 210], [228, 212], [210, 270], [158, 318],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="4" ry="6" fill="#ffe6ef" opacity="0.85" transform={`rotate(${(i % 3) * 12 - 12} ${x} ${y})`} />
      ))}
      {/* Baño de chocolate con borde ondulado */}
      <path
        d="M40 160c0-60 52-96 120-96s120 36 120 96c0 6-.3 12-1 18-10-8-20 6-30 0s-18 18-30 10-20 10-30 2-22 22-34 8-20 6-32 0-20 16-30 4-18-2-26-8-14 10-21 2c-2-6-4-24-6-34Z"
        fill="url(#fr-choco)"
      />
      {/* Hilos de chocolate blanco */}
      <path d="M62 120c30 14 62-12 96 2s60 10 100-6" stroke="#fff4f8" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.95" />
      <path d="M58 146c34 10 66-14 100 0s66 8 104-8" stroke="#ffcde0" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.9" />
      {/* Brillo */}
      <ellipse cx="118" cy="110" rx="46" ry="28" fill="url(#fr-brillo)" />
    </svg>
  );
}
