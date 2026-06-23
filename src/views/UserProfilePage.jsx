'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import StatusChip, { currency } from '../components/StatusChip';

function initials(name) {
  return (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [usersRes, ordersRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/orders'),
        ]);
        const [usersData, ordersData] = await Promise.all([
          usersRes.json(),
          ordersRes.json(),
        ]);
        if (active) {
          const found = (usersRes.ok ? usersData : []).find((u) => u.id === id);
          setUser(found || null);
          setOrders((ordersRes.ok ? ordersData : []).filter((o) => o.user?.id === id));
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>;
  }

  if (!user) {
    return (
      <Box>
        <Typography variant="h6">Customer not found.</Typography>
        <Button onClick={() => router.push('/users')} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Back to users
        </Button>
      </Box>
    );
  }

  const totalSpend = orders.reduce((s, o) => s + (Number(o.price) || 0), 0);
  const fmtDate = (v) => v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href="/users" underline="hover" color="inherit">Users</Link>
        <Typography color="text.primary">{user.full_name}</Typography>
      </Breadcrumbs>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                src={user.avatar_url || undefined}
                sx={{ width: 88, height: 88, bgcolor: 'secondary.main', fontSize: 32, mx: 'auto', mb: 2 }}
              >
                {initials(user.full_name)}
              </Avatar>
              <Typography variant="h6">{user.full_name || '—'}</Typography>
              <StatusChip status={user.status} />
              <Divider sx={{ my: 2 }} />
              <List dense sx={{ textAlign: 'left' }}>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}><PhoneIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={user.phone_number || '—'} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}><EmailIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={user.email || '—'} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}><CalendarMonthIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={`Joined ${fmtDate(user.created_at)}`} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Card><CardContent>
                <Typography variant="caption" color="text.secondary">Total orders</Typography>
                <Typography variant="h5">{orders.length}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Card><CardContent>
                <Typography variant="caption" color="text.secondary">Total spend</Typography>
                <Typography variant="h5">{currency(totalSpend)}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card><CardContent>
                <Typography variant="caption" color="text.secondary">Avg order value</Typography>
                <Typography variant="h5">{currency(orders.length ? totalSpend / orders.length : 0)}</Typography>
              </CardContent></Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Card>
                <CardHeader title="Order history" subheader={`${orders.length} order${orders.length !== 1 ? 's' : ''}`} />
                <CardContent sx={{ pt: 0 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700 } }}>
                        <TableCell>Rider</TableCell>
                        <TableCell>Dropoff</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.slice(0, 20).map((o) => (
                        <TableRow key={o.id} hover>
                          <TableCell>{o.rider?.full_name || '—'}</TableCell>
                          <TableCell sx={{ maxWidth: 200 }}>
                            <Typography variant="body2" noWrap>{o.dropoff_address || '—'}</Typography>
                          </TableCell>
                          <TableCell align="right">{currency(o.price)}</TableCell>
                          <TableCell align="right"><StatusChip status={o.status} /></TableCell>
                        </TableRow>
                      ))}
                      {orders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>No orders yet.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
