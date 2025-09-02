import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'YOLO Object Detection with OCR',
  description: 'AI-powered object detection and text recognition',
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
