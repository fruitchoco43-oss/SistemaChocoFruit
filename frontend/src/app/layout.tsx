import type { Metadata } from "next";
import { Anton, Playfair_Display, Plus_Jakarta_Sans, Yellowtail } from "next/font/google";
import { Toaster } from "sonner";
import { MARCA } from "@/lib/marca";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], style: ["normal", "italic"] });
// Tipografías del logo (versión web del logo original)
const yellowtail = Yellowtail({ variable: "--font-yellowtail", subsets: ["latin"], weight: "400" });
const anton = Anton({ variable: "--font-anton", subsets: ["latin"], weight: "400" });

const SITIO = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sistemachocofruit.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITIO),
  title: { default: `${MARCA.nombre} | Fresas con chocolate, pasteles y regalos en Quito`, template: `%s · ${MARCA.nombre}` },
  description: `${MARCA.lema}. Fresas con chocolate, pasteles, bocaditos y gelatinas artísticas con entrega a domicilio en Quito y los valles.`,
  openGraph: {
    title: MARCA.nombre,
    description: MARCA.lema,
    locale: "es_EC",
    type: "website",
    images: [{ url: "/marca/compartir.jpg", width: 1200, height: 630, alt: MARCA.nombre }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${jakarta.variable} ${playfair.variable} ${yellowtail.variable} ${anton.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
