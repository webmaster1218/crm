// Forzar recarga de tema y estilos globales
import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../index.css';
import { AppProvider } from '../context/AppContext';
import { AuthGuard } from '../components/auth/AuthGuard';

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Telocalizo Chats',
  description: 'Sistema de gestión de clientes y pedidos - Telocalizo Chats',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Telocalizo Chats',
    startupImage: '/icono-fabrica-winners.png',
  },
  icons: {
    icon: '/icono-fabrica-winners-sin-fondo.png',
    apple: [
      { url: '/icono-fabrica-winners.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Inline script to prevent theme flash on initial load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = localStorage.getItem('nova_dark_mode');
                  if (mode === 'true') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <AppProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </AppProvider>
      </body>
    </html>
  );
}
