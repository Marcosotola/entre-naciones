import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFlotante from "@/components/WhatsAppFlotante";
import { getConfig } from "@/lib/data";

export default async function TiendaLayout({ children }: { children: React.ReactNode }) {
  const config = await getConfig();
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">{children}</main>
      <Footer config={config} />
      <WhatsAppFlotante numero={config.whatsapp} />
    </>
  );
}
