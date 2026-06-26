import './globals.css'

export const metadata = {
  title: 'IACODEX',
  description: 'Chat IA de AICODEX'
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
