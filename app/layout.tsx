import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/components/i18n-provider";
import { noto_ethiopic, varela_round } from "@/lib/fonts";
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
    <html lang="en" suppressHydrationWarning className={`${varela_round.variable} ${noto_ethiopic.variable}`}>
      <body className="antialiased">
        <I18nProvider>
          {/* Light only for now: pages still hard-code light colours (bg-white, text-slate-*), so following
              a dark system theme gives unreadable mixed pages. Turn the system theme back on once the
              pages use the colour tokens (docs/REMEDIATION_GUIDE.md, FE.6). */}
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
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
