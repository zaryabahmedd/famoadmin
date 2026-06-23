'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import PeopleIcon from '@mui/icons-material/People';
import PaidIcon from '@mui/icons-material/Paid';
import SettingsIcon from '@mui/icons-material/Settings';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LogoutIcon from '@mui/icons-material/Logout';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HistoryIcon from '@mui/icons-material/History';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import Tooltip from '@mui/material/Tooltip';

const drawerWidth = 256;

// Visible to every admin (operational features).
const baseNavItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'Users', icon: <PeopleIcon />, path: '/users' },
  { label: 'Approvals', icon: <HowToRegIcon />, path: '/approvals' },
  { label: 'Drivers', icon: <TwoWheelerIcon />, path: '/drivers' },
  { label: 'All Orders', icon: <ReceiptLongIcon />, path: '/orders' },
  { label: 'Revenue', icon: <PaidIcon />, path: '/revenue' },
];

// Super Admin only: pricing config, admin management and audit logs.
const superAdminNavItems = [
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  { label: 'Admins', icon: <AdminPanelSettingsIcon />, path: '/admins' },
  { label: 'Logs', icon: <HistoryIcon />, path: '/logs' },
];

const ROLE_LABEL = { super_admin: 'Super Admin', admin: 'Admin' };

function initials(name) {
  return (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function DashboardLayout({ children }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [trackInput, setTrackInput] = useState('');
  const [me, setMe] = useState(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [toast, setToast] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const navigate = (href) => router.push(href);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/me');
        if (active && res.ok) setMe(await res.json());
      } catch {
        /* ignore — middleware will redirect if the session is gone */
      }
    })();
    return () => { active = false; };
  }, []);

  const navItems = useMemo(
    () => (me?.role === 'super_admin' ? [...baseNavItems, ...superAdminNavItems] : baseNavItems),
    [me?.role]
  );

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    const code = trackInput.trim();
    if (!code) return;
    router.push(`/orders?track=${encodeURIComponent(code)}`);
    setTrackInput('');
    if (!isDesktop) setMobileOpen(false);
  };

  const activePath = (() => {
    const match = navItems
      .filter((i) => i.path !== '/' && pathname.startsWith(i.path))
      .sort((a, b) => b.path.length - a.path.length)[0];
    if (match) return match.path;
    return pathname === '/' ? '/' : pathname;
  })();

  const handleNav = (path) => {
    navigate(path);
    if (!isDesktop) setMobileOpen(false);
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const openPwDialog = () => {
    setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    setPwError('');
    setPwOpen(true);
  };

  const submitPasswordChange = async () => {
    setPwError('');
    if (pwForm.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError('New password and confirmation do not match.');
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch('/api/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPwOpen(false);
        setMe((m) => (m ? { ...m, mustChangePassword: false } : m));
        setToast('Password updated.');
      } else {
        setPwError(data.error || 'Could not update password.');
      }
    } finally {
      setPwSaving(false);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1.5, px: 2.5 }}>
        <Box
          component="img"
          src="/Asset 2@4x-100.jpg"
          alt="Famo Admin Logo"
          sx={{ height: 36, width: 'auto', borderRadius: 1 }}
        />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1 }}>
            Famo Admin
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <Box sx={{ px: 2.5, py: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.8, display: 'block', mb: 1 }}>
          Track Package
        </Typography>
        <Box component="form" onSubmit={handleTrackSubmit}>
          <TextField
            size="small"
            fullWidth
            placeholder="FAMO-XXXXX"
            value={trackInput}
            onChange={(e) => setTrackInput(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><LocalShippingIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
            }}
          />
        </Box>
      </Box>
      <Divider />
      <List sx={{ px: 1.5, py: 1, flex: 1, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const selected = activePath === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                selected={selected}
                onClick={() => handleNav(item.path)}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: '#fff',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '& .MuiListItemIcon-root': { color: '#fff' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: selected ? '#fff' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: selected ? 700 : 500 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontSize: 15 }}>
          {initials(me?.name)}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {me?.name || '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {ROLE_LABEL[me?.role] || ''}
          </Typography>
        </Box>
        <Tooltip title="Change password">
          <IconButton onClick={openPwDialog} size="small">
            <VpnKeyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Log out">
          <IconButton onClick={handleLogout} size="small">
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          bgcolor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(8px)',
          color: 'text.primary',
          borderBottom: '1px solid #e8eaf2',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { lg: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 700 }}>
            {navItems.find((i) => i.path === activePath)?.label || 'Dashboard'}
          </Typography>
          <Avatar sx={{ ml: 1.5, width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
            {initials(me?.name)}
          </Avatar>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid #e8eaf2',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          p: { xs: 2, md: 3 },
        }}
      >
        <Toolbar />
        {me?.mustChangePassword && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={openPwDialog}>
                Change password
              </Button>
            }
          >
            You&apos;re still using the default password. Please set a new one.
          </Alert>
        )}
        {children}
      </Box>

      <Dialog open={pwOpen} onClose={() => !pwSaving && setPwOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change password</DialogTitle>
        <DialogContent>
          {pwError && <Alert severity="error" sx={{ mb: 2 }}>{pwError}</Alert>}
          <TextField
            fullWidth
            type="password"
            label="Current password"
            autoComplete="current-password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            type="password"
            label="New password"
            autoComplete="new-password"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm new password"
            autoComplete="new-password"
            value={pwForm.confirm}
            onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPwOpen(false)} disabled={pwSaving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitPasswordChange}
            disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirm}
          >
            {pwSaving ? <CircularProgress size={18} color="inherit" /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
