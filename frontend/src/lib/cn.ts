/** Une clases condicionales. Sin "use client": sirve en servidor y cliente. */
export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}
