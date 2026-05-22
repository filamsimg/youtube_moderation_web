import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

import { GlobalProviders } from "@/contexts/GlobalProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Athena Shield",
  description: "AI-powered YouTube comment moderation using IndoBERT",
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning mencegah React error saat class 'dark' 
    // ditambahkan client-side (berbeda dari HTML awal server)
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <SessionProvider>
            <GlobalProviders>
              {children}
            </GlobalProviders>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
