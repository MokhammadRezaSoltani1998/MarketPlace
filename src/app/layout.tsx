import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/widgets";

export const metadata: Metadata = {
  title: "MarketPlace",
  description: "Маркетплейс товаров",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
      </body>
    </html>
  );
}
