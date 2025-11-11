import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FlyPlaza',
  description: 'Платформа для поиска самых дешевых авиабилетов',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}


