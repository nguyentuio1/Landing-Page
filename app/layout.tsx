import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '🚀 Turn Any Image Into Amazing 3D Models for Roblox | Instant AI Conversion',
  description: 'Revolutionary AI transforms your images into stunning 3D models in seconds! Join thousands of Roblox developers creating game-changing content with zero 3D skills required.',
  keywords: 'roblox, 3d model, image to 3d, roblox development, 3d conversion, game development, roblox assets',
  authors: [{ name: 'Image to 3D Roblox' }],
  creator: 'Image to 3D Roblox',
  publisher: 'Image to 3D Roblox',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Turn Any Image Into Amazing 3D Models for Roblox',
    description: 'Revolutionary AI transforms your images into stunning 3D models in seconds! Zero 3D skills required.',
    siteName: 'Image to 3D Roblox',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Turn Any Image Into Amazing 3D Models for Roblox',
    description: 'Revolutionary AI transforms your images into stunning 3D models in seconds! Zero 3D skills required.',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script type="module" src="https://unpkg.com/@splinetool/viewer@1.10.48/build/spline-viewer.js" async></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}