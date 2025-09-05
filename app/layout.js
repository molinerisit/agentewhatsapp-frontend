export const metadata = { title: 'WhatsApp Inbox – Evolution', description: 'Atiende WhatsApp con Evolution API' };
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
