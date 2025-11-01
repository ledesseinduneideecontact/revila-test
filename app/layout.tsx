import type { Metadata } from 'next'
import { Inter, Fredoka, Cormorant_Garamond } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import Script from 'next/script'
import CookieBanner from '@/components/CookieBanner'

const inter = Inter({ subsets: ['latin'] })
const fredoka = Fredoka({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-fredoka'
})
const cormorantGaramond = Cormorant_Garamond({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-cormorant'
})

export const metadata: Metadata = {
  title: 'REVILA - Transformez vos photos en œuvres d\'art magiques',
  description: 'Revila : la photo qui révèle vos vidéos.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} ${fredoka.variable} ${cormorantGaramond.variable}`}>
        {children}
        <Toaster />
        <CookieBanner />
        <Script
          id="clarity-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Ne charger Clarity que si l'utilisateur a accepté les cookies analytiques
              (function() {
                var consent = localStorage.getItem('cookieConsent');
                if (consent) {
                  var prefs = JSON.parse(consent);
                  if (prefs.analytics) {
                    (function(c,l,a,r,i,t,y){
                        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                    })(window, document, "clarity", "script", "t4yw0lfqse");
                  }
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  )
}