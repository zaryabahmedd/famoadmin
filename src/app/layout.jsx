import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Famo Admin',
  description: 'Famo delivery operations admin dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
