import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { MARCA } from "@/lib/marca";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: { default: `${MARCA.nombre} | Fresas con chocolate, pasteles y regalos en Quito`, template: `%s · ${MARCA.nombre}` },
  description: `${MARCA.lema}. Fresas con chocolate, pasteles, bocaditos y gelatinas artísticas con entrega a domicilio en Quito y los valles.`,
  openGraph: { title: MARCA.nombre, description: MARCA.lema, locale: "es_EC", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${jakarta.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
