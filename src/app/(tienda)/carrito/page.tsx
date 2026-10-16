import type { Metadata } from "next";
import Checkout from "@/components/Checkout";
import { getConfig } from "@/lib/data";

export const metadata: Metadata = { title: "Tu carrito" };
export const revalidate = 60;

export default async function CarritoPage() {
  const config = await getConfig();
  return <Checkout config={config} />;
}
