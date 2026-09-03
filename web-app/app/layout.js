import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

import { GlobalProviders } from "@/contexts/GlobalProviders";

const inter = Inter({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "Athena Shield",
  description: "AI-powered YouTube comment moderation using IndoBERT",
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning mencegah React error saat class 'dark' 
    // ditambahkan client-side (berbeda dari HTML awal server)
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
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

