import React from 'react';
import './globals.css';

export const metadata = {
  title: 'LobeChat Image Plugin Hub',
  description: 'A collection of image generation plugins for LobeChat',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
