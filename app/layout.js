export const metadata = {
  title: 'WhatsApp Inbox – Evolution',
  description: 'Atiende WhatsApp con Evolution API'
};

import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head />
      <body>
        {children}
      </body>
    </html>
  );
}
