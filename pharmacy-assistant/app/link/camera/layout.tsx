import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pharmacy Camera — Link Your Phone',
  description: 'Use your phone camera to scan prescriptions and medicine labels',
  themeColor: '#0a0a0a',
  appleWebApp: {
    capable: true,
  },
};

export default function MobileCameraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: #0a0a0a !important;
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
      `}} />
      {children}
    </>
  );
}
