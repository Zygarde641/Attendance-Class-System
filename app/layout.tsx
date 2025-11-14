import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Attendance & Class Management System',
  description: 'Comprehensive attendance and class management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

