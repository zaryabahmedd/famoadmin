import './globals.css';
import Providers from './providers';
import { getAdminSession } from '@/lib/auth';

export const metadata = {
  title: 'Famo Admin',
  description: 'Famo delivery operations admin dashboard',
};

export default async function RootLayout({ children }) {
  // Read the session server-side so the sidebar knows the role on first paint —
  // this prevents the Super Admin nav items (Settings, Admins, Logs) from
  // popping in a second or two after the /api/me fetch resolves.
  const session = await getAdminSession();
  const initialMe = session
    ? { id: session.sub, name: session.name, email: session.email, role: session.role }
    : null;

  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        <Providers initialMe={initialMe}>{children}</Providers>
      </body>
    </html>
  );
}
