'use client';

import { usePathname } from 'next/navigation';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../theme';
import DashboardLayout from '../layout/DashboardLayout';

export default function Providers({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname?.startsWith('/login');

  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {isLoginPage ? children : <DashboardLayout>{children}</DashboardLayout>}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
