import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Constructecnia 2026 | Registro de Asistencia - ADEIC PUCP",
  description:
    "Sistema oficial de registro de asistencia por ponencia para el congreso Constructecnia 2026 (XXI Edición, ADEIC PUCP, Sede B-100 PUCP).",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0B192C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-adeic-navy-900 antialiased selection:bg-adeic-gold-400 selection:text-adeic-navy-950">
        {children}
      </body>
    </html>
  );
}
