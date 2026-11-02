import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/components/i18n-provider";
import { karla, noto_ethiopic, noto_serif_ethiopic } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Lebu Kale Hiwot Church", template: "%s · Lebu Kale Hiwot Church" },
  description: "Church management for Lebu Kale Hiwot Church: members, ministries, events, attendance and finances.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${karla.variable} ${noto_ethiopic.variable} ${noto_serif_ethiopic.variable}`}>
      <body className="antialiased">
        <I18nProvider>
          {/* Light only for now: the church theme (app/globals.css) has no dark colours yet. */}
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
