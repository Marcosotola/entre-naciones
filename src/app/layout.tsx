import type { Metadata, Viewport } from "next";
import { Lilita_One, Nunito } from "next/font/google";
import { CartProvider } from "@/lib/cart";
import "./globals.css";

const lilita = Lilita_One({ variable: "--font-lilita", weight: "400", subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Entre Naciones | Sabores de Venezuela y Argentina",
    template: "%s | Entre Naciones",
  },
  description:
    "Comida y productos venezolanos y argentinos: harina P.A.N., tequeños, dulces, snacks y mucho más. Pedí online con envío o retiro.",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Entre Naciones",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#e3241b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${lilita.variable} ${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
