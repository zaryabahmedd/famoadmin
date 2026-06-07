'use client';

import { useState } from 'react';
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

const drawerWidth = 256;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'Users', icon: <PeopleIcon />, path: '/users' },
  { label: 'Drivers', icon: <TwoWheelerIcon />, path: '/drivers' },
  { label: 'All Orders', icon: <ReceiptLongIcon />, path: '/orders' },
  { label: 'Revenue', icon: <PaidIcon />, path: '/revenue' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

export default function DashboardLayout({ children }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [trackInput, setTrackInput] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const navigate = (href) => router.push(href);

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
        <Avatar src="https://randomuser.me/api/portraits/men/32.jpg" />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            Alex Doyle
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            Super admin
          </Typography>
        </Box>
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
          <Avatar src="https://randomuser.me/api/portraits/men/32.jpg" sx={{ ml: 1.5, width: 36, height: 36 }} />
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
        {children}
      </Box>
    </Box>
  );
}
