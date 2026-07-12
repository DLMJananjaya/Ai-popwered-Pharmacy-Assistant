import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pharmacy Camera — Link Your Phone',
  description: 'Use your phone camera to scan prescriptions and medicine labels',
};

export default function MobileCameraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0a0a0a" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: #0a0a0a;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          /* Prevent pull-to-refresh on mobile */
          html { overscroll-behavior: none; }
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
