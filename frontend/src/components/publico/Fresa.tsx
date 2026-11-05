/**
 * Fresa bañada en chocolate, estilo minimalista: colores planos, formas simples.
 * La misma figura se usa en el inicio (grande) y en el isotipo del logo.
 */
export function Fresa({ className, idBase = "fresa" }: { className?: string; idBase?: string }) {
  const clip = `${idBase}-clip`;
  return (
    <svg viewBox="0 0 200 230" className={className} aria-hidden>
      <defs>
        <clipPath id={clip}>
          <path d="M100 222C46 194 20 140 26 96 31 60 62 46 100 56c38-10 69 4 74 40 6 44-20 98-74 126Z" />
        </clipPath>
      </defs>

      {/* Tallo y hojas */}
      <path d="M100 52V22" stroke="#3f9a55" strokeWidth="7" strokeLinecap="round" />
      <path d="M100 56C88 36 66 30 48 38c16 2 34 10 52 18Z" fill="#4fb067" />
      <path d="M100 56c12-20 34-26 52-18-16 2-34 10-52 18Z" fill="#43a05b" />
      <path d="M100 58c-6-14-4-28 6-38 2 14 0 26-6 38Z" fill="#5cc074" />

      {/* Cuerpo */}
      <path d="M100 222C46 194 20 140 26 96 31 60 62 46 100 56c38-10 69 4 74 40 6 44-20 98-74 126Z" fill="#f2405c" />

      {/* Semillas */}
      {[
        [72, 150], [100, 160], [128, 150], [86, 182], [114, 182], [100, 204],
      ].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="3.2" ry="5" fill="#ffd3dd" />
      ))}

      {/* Baño de chocolate con borde ondulado suave */}
      <g clipPath={`url(#${clip})`}>
        <path d="M0 0h200v118c-14 10-28 10-40 0s-28-12-42 0-30 12-44 0-30-10-44 2-22 10-30 2V0Z" fill="#4b2a1c" />
        {/* Hilo de chocolate blanco */}
        <path d="M30 92c22 12 40-8 62 2s38 8 60-4 20-4 24 0" stroke="#fff4f8" strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* Brillo */}
        <path d="M58 70c10-8 22-11 34-10" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="6" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}
