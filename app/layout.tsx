import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/components/i18n-provider";
  import {varela_round} from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lebbu Kale Heywet Church - Digital Management Platform",
  description: "A centralized platform for church operations, ministry management, and member services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={varela_round.variable}>
      <body className="antialiased">
        <I18nProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
