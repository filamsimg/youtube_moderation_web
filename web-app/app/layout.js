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
  metadataBase: new URL("https://athenashield.my.id"),
  title: "Athena Shield - Moderasi Komentar YouTube Berbasis AI",
  description: "Platform moderasi komentar YouTube otomatis mendeteksi promosi judi online & spam menggunakan IndoBERT.",
  openGraph: {
    title: "Athena Shield - Moderasi Komentar YouTube Berbasis AI",
    description: "Deteksi komentar judi online dan spam di YouTube secara otomatis dan real-time menggunakan IndoBERT.",
    url: "https://athenashield.my.id",
    siteName: "Athena Shield",
    images: [
      {
        url: "/Dashboard.png",
        width: 1200,
        height: 630,
        alt: "Athena Shield Dashboard & Landing Preview",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Athena Shield - Moderasi Komentar YouTube Berbasis AI",
    description: "Deteksi komentar judi online dan spam di YouTube secara otomatis dan real-time.",
    images: ["/Dashboard.png"],
  },
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

