import './globals.css'

export const metadata = {
  title: 'IACODEX',
  description: 'Chat IA de AICODEX',
  manifest: '/manifest.webmanifest',
  applicationName: 'IACODEX',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'IACODEX'
  },
  icons: {
    icon: [
      { url: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' }]
  }
}

export const viewport = {
  themeColor: '#101113',
  viewportFit: 'cover'
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
